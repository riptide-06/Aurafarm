import React, {useRef, useEffect} from 'react'
import {usePopularProducts, ProductCard} from '@shopify/shop-minis-react'
import type {ColorScheme, FriendGroup, Product, DragPosition, Friend} from '../types'
import {getColorClasses, DRAG_CONFIG} from '../constants'

interface AuraFarmingProps {
  colorScheme: ColorScheme
  currentProductIndex: number
  showFriendSelection: boolean
  showDailyComplete: boolean
  showProductInfo: boolean
  currentGroup: FriendGroup | null
  dragPosition: DragPosition
  dragStart: DragPosition
  isDragging: boolean
  dragTarget: string | null
  userId: string
  onBack: () => void
  onSkipProduct: () => void
  onShowProductInfo: () => void
  onCloseProductInfo: () => void
  onCloseFriendSelection: () => void
  onAssignGift: (product: Product, friend: Friend) => void
  onCompleteDailyAssignment: () => void
  onDragStart: (e: React.MouseEvent | React.TouchEvent, element: HTMLElement) => void
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void
  onDragEnd: () => void
  onClearDragTarget: () => void
  onNavigateHome: () => void
}

export const AuraFarming = React.memo(function AuraFarming({
  colorScheme,
  currentProductIndex,
  showFriendSelection,
  showDailyComplete,
  showProductInfo,
  currentGroup,
  dragPosition,
  dragStart,
  isDragging,
  dragTarget,
  userId,
  onBack,
  onSkipProduct,
  onShowProductInfo,
  onCloseProductInfo,
  onCloseFriendSelection,
  onAssignGift,
  onCompleteDailyAssignment,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClearDragTarget,
  onNavigateHome
}: AuraFarmingProps) {
  const {products} = usePopularProducts()
  const colors = getColorClasses(colorScheme)
  const productCardRef = useRef<HTMLDivElement>(null)
  const isProcessingAssignment = useRef(false)

  // Handle drag end and gift assignment
  useEffect(() => {
    console.log('Drag effect triggered:', { isDragging, dragTarget, hasProduct: !!products?.[currentProductIndex] })
    
    if (!isDragging && dragTarget && products?.[currentProductIndex] && !isProcessingAssignment.current) {
      if (dragTarget === 'product-info') {
        // Product was dropped on info modal - show product info
        console.log('Dropping on product info')
        onShowProductInfo()
      } else {
        // Product was dropped on a friend - assign gift
        console.log('Dropping on friend:', dragTarget)
        const friend = currentGroup?.members.find(m => m.id === dragTarget)
        if (friend) {
          console.log('Found friend, assigning gift:', friend.name)
          
          // Set flag to prevent multiple rapid assignments
          isProcessingAssignment.current = true
          
          // Clear drag target after a small delay to prevent multiple triggers
          setTimeout(() => {
            onClearDragTarget()
          }, 50)
          
          // Small delay to show the drop animation
          setTimeout(() => {
            onAssignGift(products[currentProductIndex], friend)
            // Reset flag after assignment
            setTimeout(() => {
              isProcessingAssignment.current = false
            }, 200)
          }, 100)
        }
      }
    }
  }, [isDragging, dragTarget, products, currentProductIndex, currentGroup, onAssignGift, onShowProductInfo, onClearDragTarget])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('AuraFarming: Drag start event')
    if (productCardRef.current) {
      onDragStart(e, productCardRef.current)
    }
  }

  const handleDragEnd = () => {
    console.log('AuraFarming: Drag end event')
    onDragEnd()
  }

  const handleInfoModalClick = (e: React.MouseEvent) => {
    // Close modal if clicking on the backdrop
    if (e.target === e.currentTarget) {
      onCloseProductInfo()
    }
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${colors.background} transition-colors duration-500`}>
      {/* Back button */}
      <div className="absolute top-6 left-6 z-40">
        <button 
          onClick={onBack}
          className="bg-black/50 backdrop-blur-md text-white p-3 rounded-full text-xl shadow-lg"
          aria-label="Go back to previous screen"
        >
          <span aria-hidden="true">←</span>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-6 right-6 z-40">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          {products ? `${currentProductIndex + 1}/${products.length}` : 'Loading...'}
        </div>
      </div>

      {showFriendSelection && products?.[currentProductIndex] ? (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in border-2 border-gray-200">
            <h4 className="text-xl font-black text-gray-800 mb-4 text-center">Assign to:</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentGroup?.members.filter(m => m.id !== userId).map(friend => (
                <button
                  key={friend.id}
                  onClick={() => {
                    onAssignGift(products[currentProductIndex], friend)
                  }}
                  onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
                  onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
                  className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 active:scale-95 shadow-lg"
                  aria-label={`Assign gift to ${friend.name}`}
                >
                  <div className="text-2xl mb-2">{friend.avatar}</div>
                  <div className="text-lg font-bold text-gray-800">{friend.name}</div>
                  <div className="text-sm text-gray-600 font-semibold">Aura {friend.aura}</div>
                </button>
              ))}
            </div>
            <button
              onClick={onCloseFriendSelection}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-all duration-300 active:scale-95 hover:bg-gray-300"
            >
              Back to Product
            </button>
          </div>
        </div>
      ) : showDailyComplete ? (
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center z-50">
          <div className="text-center animate-bounce-in bg-white rounded-3xl p-8 shadow-2xl mx-6">
            <div className="text-8xl mb-6">🎉</div>
            <h3 className="text-4xl font-black text-gray-800 mb-4">Daily Task Complete!</h3>
            <p className="text-gray-700 text-xl font-medium mb-6">Amazing work! You've curated gifts for all products today.</p>
            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-black py-4 px-8 rounded-2xl shadow-xl text-2xl inline-block mb-6">
              +10 Aura Points! ✨
            </div>
            <button
              onClick={onNavigateHome}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 active:scale-95 text-xl"
            >
              🏠 Return to Home
            </button>
          </div>
        </div>
      ) : showProductInfo && products?.[currentProductIndex] ? (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-6"
          onClick={handleInfoModalClick}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in border-4 border-gray-200 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Remove onClick from this div */}
            <ProductCard
              product={products[currentProductIndex]}
              // If ProductCard supports an onImageClick prop, use it:
              onImageClick={() => window.open(products[currentProductIndex].url, '_blank')}
            />
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={onCloseProductInfo}
            >
              ✕
            </button>
          </div>
        </div>
      ) : products?.[currentProductIndex] ? (
        <div className="min-h-screen flex items-center justify-center p-8 relative">
          {/* Friend blobs positioned above product */}
          {currentGroup?.members.filter(m => m.id !== userId).map((friend, index) => {
            const totalFriends = currentGroup?.members.filter(m => m.id !== userId).length || 1
            const blobWidth = 90 // Actual width of each friend blob
            const blobHeight = 90 // Actual height of each friend blob
            
            // Calculate proper spacing to fit all blobs on screen
            const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375
            const totalBlobWidth = totalFriends * blobWidth
            const availableWidth = screenWidth - 40 // 20px padding on each side
            
            // Handle spacing calculation for different friend counts
            let spacing = 20 // Default minimum spacing
            let startPosition = 20 // Default start position
            
            if (totalFriends > 1) {
              spacing = Math.max(20, (availableWidth - totalBlobWidth) / (totalFriends - 1))
              const totalRowWidth = totalBlobWidth + (spacing * (totalFriends - 1))
              startPosition = (screenWidth - totalRowWidth) / 2
            } else {
              // Single friend - center it
              startPosition = (screenWidth - blobWidth) / 2
            }
            
            // Calculate position for each blob
            const leftPosition = startPosition + (index * (blobWidth + spacing)) + (blobWidth / 2)
            
            return (
              <div
                key={friend.id}
                data-friend-id={friend.id}
                className={`absolute ${colors.glass} rounded-full p-4 shadow-xl transition-all duration-300 cursor-pointer ${
                  dragTarget === friend.id ? `ring-4 ${colors.ringColor}` : 'hover:ring-2 hover:ring-blue-300'
                } ${isDragging ? 'z-30' : 'z-20'}`}
                style={{
                  left: leftPosition,
                  top: '20%',
                  transform: 'translate(-50%, -50%)',
                  minWidth: '90px',
                  minHeight: '90px'
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{friend.avatar}</div>
                  <div className={`text-sm font-bold ${colors.textPrimary}`}>{friend.name}</div>
                  <div className={`text-xs ${colors.textSecondary}`}>{friend.aura} aura</div>
                  {isDragging && (
                    <div className="text-xs text-blue-600 font-bold mt-1">Drop here!</div>
                  )}
                </div>
              </div>
            )
          })}
          
          {/* Central product card */}
          <div className="relative">
            <div 
              ref={productCardRef}
              className={`${colors.glass} overflow-hidden shadow-2xl transition-all duration-300 cursor-grab hover:scale-105 select-none ${
                isDragging ? 'z-50' : ''
              }`}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              style={{
                width: DRAG_CONFIG.BASE_SIZE,
                height: DRAG_CONFIG.BASE_HEIGHT,
                borderRadius: DRAG_CONFIG.BORDER_RADIUS,
                ...(isDragging && {
                  position: 'fixed',
                  left: dragPosition.x - DRAG_CONFIG.BASE_SIZE / 2,
                  top: dragPosition.y - DRAG_CONFIG.BASE_HEIGHT / 2,
                  pointerEvents: 'none',
                  zIndex: 50,
                  transform: 'translate(0, 0)',
                  transition: 'none'
                })
              }}
            >
              <ProductCard product={products[currentProductIndex]} />
            </div>
            
            {/* Drag indicator */}
            {isDragging && (
              <div 
                className="fixed pointer-events-none z-40"
                style={{
                  left: dragPosition.x - 20,
                  top: dragPosition.y - 20,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '2px solid rgba(0, 0, 0, 0.3)',
                  transform: 'translate(0, 0)'
                }}
              />
            )}
          </div>
          
          {/* Bottom controls */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-8">
            <button
              onClick={onSkipProduct}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className={`${colors.glass} p-4 rounded-full shadow-xl transition-all duration-300 active:scale-95 hover:scale-110`}
              aria-label="Skip this product"
            >
              <span className="text-3xl" aria-hidden="true">❌</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`min-h-screen flex items-center justify-center ${colors.background}`}>
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm mx-6 border-2 border-gray-200">
            <div className="text-4xl mb-3">🔄</div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Loading products...</h3>
            <p className="text-gray-600 font-medium">Finding perfect gifts for your friends</p>
          </div>
        </div>
      )}

      {!currentGroup && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm mx-6 animate-bounce-in border-2 border-gray-200">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-black text-gray-800 mb-3">Join a group first</h3>
            <p className="text-gray-600 font-medium mb-6">You need friends to assign gifts to</p>
            <button
              onClick={onBack}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 active:scale-95 hover:from-orange-500 hover:to-red-600"
            >
              Find Friends
            </button>
          </div>
        </div>
      )}
    </div>
  )
})