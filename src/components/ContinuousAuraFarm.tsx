import React, {useRef, useEffect, useState} from 'react'
import {usePopularProducts, useRecommendedProducts, ProductCard} from '@shopify/shop-minis-react'
import type {Product, Friend, FriendGroup, ColorScheme, DragPosition} from '../types'
import {getColorClasses, DRAG_CONFIG} from '../constants'

interface ContinuousAuraFarmProps {
  colorScheme: ColorScheme
  currentGroup: FriendGroup | null
  dragPosition: DragPosition
  dragStart: DragPosition
  isDragging: boolean
  dragTarget: string | null
  userId: string
  onBack: () => void
  onSkipProduct: () => void
  onAssignGift: (product: Product, friend: Friend) => void
  onDragStart: (e: React.MouseEvent | React.TouchEvent, element: HTMLElement) => void
  onDragMove: (e: React.MouseEvent | React.TouchEvent) => void
  onDragEnd: () => void
  onClearDragTarget: () => void
}

export const ContinuousAuraFarm = React.memo(function ContinuousAuraFarm({
  colorScheme,
  currentGroup,
  dragPosition,
  dragStart,
  isDragging,
  dragTarget,
  userId,
  onBack,
  onSkipProduct,
  onAssignGift,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClearDragTarget
}: ContinuousAuraFarmProps) {
  const {products: popularProducts} = usePopularProducts()
  const {products: recommendedProducts} = useRecommendedProducts()
  const colors = getColorClasses(colorScheme)
  const productCardRef = useRef<HTMLDivElement>(null)
  const isProcessingAssignment = useRef(false)

  // State for continuous aura farm
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [showFriendSelection, setShowFriendSelection] = useState(false)
  const [showProductInfo, setShowProductInfo] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  // Combine all available products
  const allProducts = React.useMemo(() => {
    const combined = [...(popularProducts || []), ...(recommendedProducts || [])]
    // Remove duplicates based on product ID
    return combined.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    )
  }, [popularProducts, recommendedProducts])

  // Use filtered products if in search mode, otherwise use all available products
  const products = isSearchMode ? filteredProducts : allProducts

  console.log('ContinuousAuraFarm render:', { 
    popularProducts: popularProducts?.length, 
    recommendedProducts: recommendedProducts?.length,
    allProducts: allProducts?.length,
    filteredProducts: filteredProducts?.length,
    currentGroup: currentGroup?.name,
    colorScheme,
    products: products?.length, 
    currentProductIndex, 
    isSearchMode, 
    hasCurrentProduct: !!products?.[currentProductIndex],
    currentProduct: products?.[currentProductIndex]?.title 
  })

  // Handle drag end and gift assignment
  useEffect(() => {
    if (!isDragging && dragTarget && products?.[currentProductIndex] && !isProcessingAssignment.current) {
      if (dragTarget === 'product-info') {
        // Product was dropped on info modal - show product info
        setShowProductInfo(true)
      } else {
        // Product was dropped on a friend - assign gift
        const friend = currentGroup?.members.find(m => m.id === dragTarget)
        if (friend) {
          // Set flag to prevent multiple rapid assignments
          isProcessingAssignment.current = true
          
          // Clear drag target after a small delay to prevent multiple triggers
          setTimeout(() => {
            onClearDragTarget()
          }, 50)
          
          // Small delay to show the drop animation
          setTimeout(() => {
            onAssignGift(products[currentProductIndex], friend)
            // Move to next product for continuous farming
            nextProduct()
            // Reset flag after assignment
            setTimeout(() => {
              isProcessingAssignment.current = false
            }, 200)
          }, 100)
        }
      }
    }
  }, [isDragging, dragTarget, products, currentProductIndex, currentGroup, onAssignGift, onClearDragTarget])

  const nextProduct = () => {
    if (products && currentProductIndex < products.length - 1) {
      setCurrentProductIndex(prev => prev + 1)
    } else {
      // Loop back to start for infinite farming
      setCurrentProductIndex(0)
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (productCardRef.current) {
      onDragStart(e, productCardRef.current)
    }
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    onDragMove(e)
  }

  const handleDragEnd = () => {
    onDragEnd()
  }

  const handleInfoModalClick = (e: React.MouseEvent) => {
    // Close modal if clicking on the backdrop
    if (e.target === e.currentTarget) {
      setShowProductInfo(false)
    }
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const filtered = allProducts.filter(product =>
        product.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
      setIsSearchMode(true)
      setCurrentProductIndex(0)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setIsSearchMode(false)
    setFilteredProducts([])
    setCurrentProductIndex(0)
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

      {/* Search bar at top */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex justify-center space-x-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="px-4 py-2 bg-black/50 backdrop-blur-md text-white placeholder-gray-300 rounded-full text-sm font-semibold border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          {isSearchMode && (
            <button
              onClick={clearSearch}
              className="px-3 py-2 bg-gray-500 text-white font-bold rounded-full text-sm hover:bg-gray-600 transition-colors duration-200"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-6 right-6 z-40">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
          {products ? `${currentProductIndex + 1}/${products.length}` : 'Loading...'}
          {isSearchMode && <div className="text-xs">Search Mode</div>}
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
                    setShowFriendSelection(false)
                    nextProduct()
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
              onClick={() => setShowFriendSelection(false)}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-all duration-300 active:scale-95 hover:bg-gray-300"
            >
              Back to Product
            </button>
          </div>
        </div>
      ) : showProductInfo && products?.[currentProductIndex] ? (
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-6"
          data-friend-id="product-info"
          onClick={handleInfoModalClick}
        >
          <div 
            className={`bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-bounce-in border-4 ${
              dragTarget === 'product-info' ? 'border-blue-500 scale-105' : 'border-gray-200'
            } transition-all duration-300`}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-gray-800 mb-2">Product Details</h3>
              <p className="text-gray-600 text-sm">Drag product here to view info</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <ProductCard product={products[currentProductIndex]} />
            </div>
            <div className="text-center">
              <p className="text-gray-700 text-sm mb-3">
                Tap outside to close or drag the product back
              </p>
            </div>
          </div>
        </div>
      ) : products?.[currentProductIndex] ? (
        <div className="min-h-screen flex items-center justify-center p-8 relative">
          {/* Friend blobs positioned above product */}
          {currentGroup?.members.filter(m => m.id !== userId).map((friend, index) => {
            const totalFriends = currentGroup?.members.filter(m => m.id !== userId).length || 1
            const spacing = DRAG_CONFIG.FRIEND_SPACING
            const startX = -(totalFriends - 1) * spacing / 2
            const x = startX + (index * spacing)
            
            return (
              <div
                key={friend.id}
                data-friend-id={friend.id}
                className={`absolute ${colors.glass} rounded-full p-4 shadow-xl transition-all duration-300 cursor-pointer ${
                  dragTarget === friend.id ? `scale-125 ring-4 ${colors.ringColor} animate-float` : 'hover:scale-110'
                } ${isDragging ? 'z-30' : 'z-20'}`}
                style={{
                  left: `calc(50% + ${x}px)`,
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
              onMouseMove={handleDragMove}
              onTouchMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onTouchEnd={handleDragEnd}
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
              onClick={() => {
                onSkipProduct()
                nextProduct()
              }}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className={`${colors.glass} p-4 rounded-full shadow-xl transition-all duration-300 active:scale-95 hover:scale-110`}
              aria-label="Skip this product"
            >
              <span className="text-3xl" aria-hidden="true">❌</span>
            </button>
            
            <button
              onClick={() => setShowProductInfo(true)}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              className={`${colors.glass} p-4 rounded-full shadow-xl transition-all duration-300 active:scale-95 hover:scale-110`}
              aria-label="Show product information"
            >
              <span className="text-3xl" aria-hidden="true">ℹ️</span>
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