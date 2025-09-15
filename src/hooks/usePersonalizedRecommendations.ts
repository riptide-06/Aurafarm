import {useMemo, useCallback} from 'react'
import {usePopularProducts, useRecommendedProducts} from '@shopify/shop-minis-react'
import {useCartData} from './useCartData'
import {useCustomerData} from './useCustomerData'
import type {Product} from '../types'

export interface RecommendationReason {
  type: 'cart_similar' | 'purchase_history' | 'category_preference' | 'price_range' | 'brand_preference' | 'recently_viewed' | 'popular'
  confidence: number
  description: string
}

export interface PersonalizedProduct {
  product: Product
  reasons: RecommendationReason[]
  score: number
}

export function usePersonalizedRecommendations() {
  const {products: popularProducts, isLoading: popularLoading} = usePopularProducts()
  const {products: recommendedProducts, isLoading: recommendedLoading} = useRecommendedProducts()
  const {cart} = useCartData()
  const {customerPreferences, customerAnalytics} = useCustomerData()

  const personalizedRecommendations = useMemo((): PersonalizedProduct[] => {
    if (!popularProducts || !recommendedProducts) {
      return []
    }

    // Combine all available products
    const allProducts = [...(popularProducts || []), ...(recommendedProducts || [])]
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    )

    // Score each product based on various factors
    const scoredProducts = uniqueProducts.map(product => {
      const reasons: RecommendationReason[] = []
      let score = 0

      // 1. Cart similarity (products similar to what's in cart)
      if (cart.items.length > 0) {
        const cartCategories = cart.items.map(item => item.product.productType)
        if (cartCategories.includes(product.productType)) {
          score += 50
          reasons.push({
            type: 'cart_similar',
            confidence: 0.8,
            description: 'Similar to items in your cart'
          })
        }
      }

      // 2. Category preference (based on purchase history)
      if (customerPreferences.favoriteCategories.includes(product.productType)) {
        score += 40
        reasons.push({
          type: 'category_preference',
          confidence: 0.9,
          description: 'Based on your favorite categories'
        })
      }

      // 3. Price range preference
      const productPrice = parseFloat(product.price?.amount || '0')
      if (productPrice >= customerPreferences.preferredPriceRange.min && 
          productPrice <= customerPreferences.preferredPriceRange.max) {
        score += 30
        reasons.push({
          type: 'price_range',
          confidence: 0.7,
          description: 'Within your preferred price range'
        })
      }

      // 4. Brand preference
      if (customerPreferences.preferredBrands.includes(product.vendor || '')) {
        score += 35
        reasons.push({
          type: 'brand_preference',
          confidence: 0.8,
          description: 'From brands you love'
        })
      }

      // 5. Recently viewed
      if (customerAnalytics.recentlyViewed.some(p => p.id === product.id)) {
        score += 20
        reasons.push({
          type: 'recently_viewed',
          confidence: 0.6,
          description: 'You recently viewed this'
        })
      }

      // 6. Purchase history similarity
      if (customerAnalytics.favoriteProducts.some(p => p.productType === product.productType)) {
        score += 25
        reasons.push({
          type: 'purchase_history',
          confidence: 0.7,
          description: 'Similar to products you\'ve purchased'
        })
      }

      // 7. Popular products (baseline score)
      if (popularProducts?.some(p => p.id === product.id)) {
        score += 10
        reasons.push({
          type: 'popular',
          confidence: 0.5,
          description: 'Popular among customers'
        })
      }

      return {
        product,
        reasons,
        score
      }
    })

    // Sort by score and return top recommendations
    return scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [popularProducts, recommendedProducts, cart, customerPreferences, customerAnalytics])

  const getRecommendationsByCategory = useCallback((category: string): PersonalizedProduct[] => {
    return personalizedRecommendations.filter(rec => 
      rec.product.productType === category
    )
  }, [personalizedRecommendations])

  const getRecommendationsByPriceRange = useCallback((min: number, max: number): PersonalizedProduct[] => {
    return personalizedRecommendations.filter(rec => {
      const price = parseFloat(rec.product.price?.amount || '0')
      return price >= min && price <= max
    })
  }, [personalizedRecommendations])

  const getRecommendationsByBrand = useCallback((brand: string): PersonalizedProduct[] => {
    return personalizedRecommendations.filter(rec => 
      rec.product.vendor === brand
    )
  }, [personalizedRecommendations])

  const isLoading = popularLoading || recommendedLoading

  return {
    personalizedRecommendations,
    getRecommendationsByCategory,
    getRecommendationsByPriceRange,
    getRecommendationsByBrand,
    isLoading,
    // Summary statistics
    summary: {
      totalRecommendations: personalizedRecommendations.length,
      topCategories: [...new Set(personalizedRecommendations.map(rec => rec.product.productType))].slice(0, 5),
      averageScore: personalizedRecommendations.length > 0 
        ? personalizedRecommendations.reduce((sum, rec) => sum + rec.score, 0) / personalizedRecommendations.length 
        : 0
    }
  }
}
