import React, {useState, useCallback} from 'react'
import {ProductCard, useShopCartActions} from '@shopify/shop-minis-react'
import {usePersonalizedRecommendations, useUserAnalytics} from '../hooks'
import {getColorClasses} from '../constants'
import type {ColorScheme, PersonalizedProduct} from '../types'

interface PersonalizedRecommendationsProps {
  colorScheme: ColorScheme
  maxItems?: number
  showReasons?: boolean
  showFilters?: boolean
}

export function PersonalizedRecommendations({
  colorScheme,
  maxItems = 6,
  showReasons = true,
  showFilters = true
}: PersonalizedRecommendationsProps) {
  const colors = getColorClasses(colorScheme)
  const {personalizedRecommendations, isLoading, summary} = usePersonalizedRecommendations()
  const {trackProductView, trackProductClick, trackAddToCart, trackButtonClick} = useUserAnalytics()
  const {addToCart} = useShopCartActions()
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter recommendations based on selected filters
  const filteredRecommendations = React.useMemo(() => {
    let filtered = personalizedRecommendations

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rec => rec.product.productType === selectedCategory)
    }

    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(Number)
      filtered = filtered.filter(rec => {
        const price = parseFloat(rec.product.price?.amount || '0')
        if (max) {
          return price >= min && price <= max
        }
        return price >= min
      })
    }

    return filtered.slice(0, maxItems)
  }, [personalizedRecommendations, selectedCategory, selectedPriceRange, maxItems])

  // Get unique categories and price ranges for filters
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(personalizedRecommendations.map(rec => rec.product.productType))]
    return ['all', ...uniqueCategories.slice(0, 5)]
  }, [personalizedRecommendations])

  const priceRanges = [
    {value: 'all', label: 'All Prices'},
    {value: '0-25', label: 'Under $25'},
    {value: '25-50', label: '$25 - $50'},
    {value: '50-100', label: '$50 - $100'},
    {value: '100-', label: 'Over $100'}
  ]

  const handleProductView = useCallback((product: PersonalizedProduct) => {
    trackProductView(product.product)
  }, [trackProductView])

  const handleProductClick = useCallback((product: PersonalizedProduct) => {
    trackProductClick(product.product)
  }, [trackProductClick])

  const handleAddToCart = useCallback(async (product: PersonalizedProduct) => {
    try {
      await addToCart({
        merchandiseId: product.product.id,
        quantity: 1
      })
      trackAddToCart(product.product)
      trackButtonClick('add-to-cart', 'Add to Cart', 'recommendations')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }, [addToCart, trackAddToCart, trackButtonClick])

  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategory(category)
    trackButtonClick('category-filter', category, 'recommendations')
  }, [trackButtonClick])

  const handlePriceFilter = useCallback((range: string) => {
    setSelectedPriceRange(range)
    trackButtonClick('price-filter', range, 'recommendations')
  }, [trackButtonClick])

  const handleViewModeToggle = useCallback(() => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid'
    setViewMode(newMode)
    trackButtonClick('view-mode-toggle', newMode, 'recommendations')
  }, [viewMode, trackButtonClick])

  if (isLoading) {
    return (
      <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (personalizedRecommendations.length === 0) {
    return (
      <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl text-center`}>
        <div className="text-6xl mb-4">🌟</div>
        <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>
          No Recommendations Yet
        </h3>
        <p className={`${colors.textSecondary} mb-4`}>
          Start shopping to get personalized recommendations based on your preferences!
        </p>
        <div className={`inline-flex items-center space-x-2 ${colors.primaryGradient} text-white px-4 py-2 rounded-xl text-sm font-medium`}>
          <span>✨</span>
          <span>Complete your first purchase</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-black ${colors.textPrimary} mb-1`}>
            🌟 Recommended for You
          </h3>
          <p className={`text-sm ${colors.textSecondary}`}>
            {filteredRecommendations.length} personalized suggestions
          </p>
        </div>
        
        <button
          onClick={handleViewModeToggle}
          className={`p-2 ${colors.cardBg} rounded-xl ${colors.textPrimary} hover:${colors.primaryGradient} hover:text-white transition-all duration-200`}
          aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
        >
          {viewMode === 'grid' ? '📱' : '🔲'}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 space-y-4">
          {/* Category Filter */}
          <div>
            <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryFilter(category)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? `${colors.primaryGradient} text-white`
                      : `${colors.cardBg} ${colors.textSecondary} hover:${colors.primaryGradient} hover:text-white`
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
              Price Range
            </label>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handlePriceFilter(range.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedPriceRange === range.value
                      ? `${colors.primaryGradient} text-white`
                      : `${colors.cardBg} ${colors.textSecondary} hover:${colors.primaryGradient} hover:text-white`
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
        {filteredRecommendations.map((rec) => (
          <div
            key={rec.product.id}
            className={`${colors.cardBg} rounded-2xl p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
            onMouseEnter={() => handleProductView(rec)}
            onClick={() => handleProductClick(rec)}
          >
            <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center space-x-4'}>
              {/* Product Image and Info */}
              <div className={viewMode === 'grid' ? 'space-y-3' : 'flex-1'}>
                <ProductCard 
                  product={rec.product}
                  className="w-full"
                />
                
                {/* Recommendation Score */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors.primaryGradient}`}
                      style={{width: `${Math.min(rec.score, 100)}%`}}
                    ></div>
                  </div>
                  <span className={`text-xs font-bold ${colors.textAccent}`}>
                    {rec.score}%
                  </span>
                </div>

                {/* Recommendation Reasons */}
                {showReasons && rec.reasons.length > 0 && (
                  <div className="space-y-1">
                    {rec.reasons.slice(0, 2).map((reason, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs">✨</span>
                        <span className={`text-xs ${colors.textSecondary} leading-tight`}>
                          {reason.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddToCart(rec)
                }}
                className={`${colors.primaryGradient} text-white font-bold py-3 px-4 rounded-xl text-sm hover:scale-105 transition-transform duration-200 flex-shrink-0 ${
                  viewMode === 'list' ? 'self-start' : 'w-full'
                }`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      {summary.totalRecommendations > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-lg font-bold ${colors.textAccent}`}>
                {summary.totalRecommendations}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Total</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${colors.textAccent}`}>
                {summary.topCategories.length}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Categories</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${colors.textAccent}`}>
                {Math.round(summary.averageScore)}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Avg Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Filters */}
      {filteredRecommendations.length === 0 && personalizedRecommendations.length > 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className={`${colors.textSecondary} mb-2`}>
            No recommendations match your current filters
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all')
              setSelectedPriceRange('all')
            }}
            className={`${colors.primaryGradient} text-white px-4 py-2 rounded-xl text-sm font-medium`}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
