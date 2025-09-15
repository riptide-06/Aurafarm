import {useState, useEffect, useCallback, useRef} from 'react'

export const useDragDrop = () => {
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  
  const isDraggingRef = useRef(false)
  
  const findHoveredFriend = useCallback((clientX: number, clientY: number): string | null => {
    const friendElements = Array.from(document.querySelectorAll('[data-friend-id]'))
    
    for (const el of friendElements) {
      const rect = el.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right && 
          clientY >= rect.top && clientY <= rect.bottom) {
        return el.getAttribute('data-friend-id')
      }
    }
    return null
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, element: HTMLElement) => {
    e.preventDefault()
    e.stopPropagation()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    console.log('Drag start:', { clientX, clientY, element })
    
    isDraggingRef.current = true
    setDragStart({ x: clientX, y: clientY })
    setDragPosition({ x: clientX, y: clientY })
    setIsDragging(true)
    setDragTarget(null)
    
    // Add dragging class to body to prevent text selection
    document.body.classList.add('dragging')
  }, [])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragPosition({ x: clientX, y: clientY })
    
    // Find hovered friend
    const hoveredFriend = findHoveredFriend(clientX, clientY)
    if (hoveredFriend !== dragTarget) {
      console.log('Hovering over:', hoveredFriend)
      setDragTarget(hoveredFriend)
    }
  }, [dragTarget, findHoveredFriend])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    
    console.log('Drag end, target:', dragTarget)
    
    // Reset all drag state immediately
    isDraggingRef.current = false
    setIsDragging(false)
    setDragPosition({ x: 0, y: 0 })
    setDragStart({ x: 0, y: 0 })
    
    // Keep dragTarget for a moment so the effect can process it
    // It will be cleared by the component after processing
    
    // Remove dragging class from body
    document.body.classList.remove('dragging')
  }, [dragTarget])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDragMove(e)
      }
    }

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        handleDragEnd()
      }
    }

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault()
        handleDragMove(e)
      }
    }

    const handleGlobalTouchEnd = () => {
      if (isDraggingRef.current) {
        handleDragEnd()
      }
    }

    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false })
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', handleGlobalTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
      document.body.classList.remove('dragging')
    }
  }, [handleDragMove, handleDragEnd])

  const clearDragTarget = useCallback(() => {
    setDragTarget(null)
  }, [])

  return {
    dragPosition,
    dragStart,
    isDragging,
    dragTarget,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearDragTarget
  }
}