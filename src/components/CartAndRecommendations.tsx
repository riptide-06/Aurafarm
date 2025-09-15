import React from 'react'
import {ProductCard} from '@shopify/shop-minis-react'
import {useCartData, usePersonalizedRecommendations, useUserAnalytics} from '../hooks'
import {getColorClasses} from '../constants'
import type {ColorScheme, Product} from '../types'

interface CartAndRecommendationsProps {
  colorScheme: ColorScheme
}

export function CartAndRecommendations({colorScheme}: CartAndRecommendationsProps) {
  const colors = getColorClasses(colorScheme)
  const {cart, addItemToCart, removeItemFromCart, updateItemQuantity} = useCartData()
  const {personalizedRecommendations, isLoading: recommendationsLoading} = usePersonalizedRecommendations()
  const {trackProductView, trackProductClick, trackAddToCart} = useUserAnalytics()

  const handleAddToCart = async (product: Product) => {
    const result = await addItemToCart(product)
    if (result.success) {
      trackAddToCart(product)
    }
  }

  const handleProductClick = (product: Product) => {
    trackProductClick(product)
  }

  const handleProductView = (product: Product) => {
    trackProductView(product)
  }

  return (
    <div className="space-y-6">
      {/* Cart Section */}
      <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
        <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>
          🛒 Your Cart ({cart.totalItems} items)
        </h3>
        
        {cart.items.length === 0 ? (
          <p className={`${colors.textSecondary} text-center py-8`}>
            Your cart is empty. Start shopping to see items here!
          </p>
        ) : (
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className={`${colors.cardBg} rounded-2xl p-4 flex items-center space-x-4`}>
                <div className="flex-1">
                  <h4 className={`font-bold ${colors.textPrimary}`}>
                    {item.product.title}
                  </h4>
                  <p className={`text-sm ${colors.textSecondary}`}>
                    {item.product.price?.amount} {item.product.price?.currencyCode}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className={`w-8 h-8 ${colors.primaryGradient} text-white rounded-full flex items-center justify-center text-lg font-bold`}
                  >
                    -
                  </button>
                  <span className={`w-8 text-center ${colors.textPrimary} font-bold`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className={`w-8 h-8 ${colors.primaryGradient} text-white rounded-full flex items-center justify-center text-lg font-bold`}
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => removeItemFromCart(item.id)}
                  className={`w-8 h-8 ${colors.glass} ${colors.textPrimary} rounded-full flex items-center justify-center text-lg`}
                >
                  ×
                </button>
              </div>
            ))}
            
            <div className={`pt-4 border-t ${colors.border}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`${colors.textPrimary} font-bold`}>Total:</span>
                <span className={`${colors.textAccent} font-bold text-lg`}>
                  {cart.totalValue.toFixed(2)} {cart.items[0]?.product.price?.currencyCode || 'USD'}
                </span>
              </div>
              <button className={`w-full ${colors.primaryGradient} text-white font-bold py-3 px-6 rounded-2xl`}>
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Personalized Recommendations */}
      <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
        <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>
          🌟 Recommended for You
        </h3>
        
        {recommendationsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${colors.cardBg} rounded-2xl p-4 animate-pulse`}>
                <div className={`h-4 ${colors.border} rounded mb-2`}></div>
                <div className={`h-3 ${colors.border} rounded w-2/3`}></div>
              </div>
            ))}
          </div>
        ) : personalizedRecommendations.length > 0 ? (
          <div className="space-y-4">
            {personalizedRecommendations.slice(0, 3).map((rec) => (
              <div key={rec.product.id} className={`${colors.cardBg} rounded-2xl p-4`}>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <ProductCard 
                      product={rec.product}
                      onMouseEnter={() => handleProductView(rec.product)}
                      onClick={() => handleProductClick(rec.product)}
                    />
                    
                    {/* Recommendation reasons */}
                    <div className="mt-2 space-y-1">
                      {rec.reasons.slice(0, 2).map((reason, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-xs">✨</span>
                          <span className={`text-xs ${colors.textSecondary}`}>
                            {reason.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(rec.product)}
                    className={`${colors.primaryGradient} text-white font-bold py-2 px-4 rounded-xl text-sm`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`${colors.textSecondary} text-center py-8`}>
            Complete your first purchase to get personalized recommendations!
          </p>
        )}
      </div>
    </div>
  )
}
