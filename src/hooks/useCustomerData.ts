import {useMemo} from 'react'
import {useCurrentUser, useOrders, useRecentProducts, useSavedProducts} from '@shopify/shop-minis-react'
import type {Product} from '../types'

export interface CustomerProfile {
  id: string
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  createdAt?: Date
  lastLoginAt?: Date
}

export interface CustomerPreferences {
  favoriteCategories: string[]
  preferredPriceRange: {
    min: number
    max: number
  }
  shoppingFrequency: 'low' | 'medium' | 'high'
  preferredBrands: string[]
}

export interface CustomerAnalytics {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate?: Date
  favoriteProducts: Product[]
  recentlyViewed: Product[]
  savedProducts: Product[]
  cartAbandonmentRate: number
}

export function useCustomerData() {
  const {currentUser, isLoading: userLoading} = useCurrentUser()
  const {orders, isLoading: ordersLoading} = useOrders()
  const {products: recentProducts, isLoading: recentLoading} = useRecentProducts()
  const {products: savedProducts, isLoading: savedLoading} = useSavedProducts()

  const customerProfile = useMemo((): CustomerProfile => {
    if (!currentUser) {
      return {
        id: 'anonymous',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
    }

    return {
      id: currentUser.id || 'anonymous',
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone,
      createdAt: currentUser.createdAt ? new Date(currentUser.createdAt) : new Date(),
      lastLoginAt: currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt) : new Date()
    }
  }, [currentUser])

  const customerPreferences = useMemo((): CustomerPreferences => {
    if (!orders || !recentProducts || !savedProducts) {
      return {
        favoriteCategories: [],
        preferredPriceRange: {min: 0, max: 1000},
        shoppingFrequency: 'low',
        preferredBrands: []
      }
    }

    // Analyze order history for preferences
    const orderData = orders.edges?.map(edge => edge.node) || []
    const purchasedProducts = orderData.flatMap(order => 
      order.lineItems?.edges?.map(edge => edge.node.merchandise?.product) || []
    )

    // Extract categories from purchased products
    const categories = purchasedProducts
      .map(product => product?.productType)
      .filter(Boolean) as string[]
    
    const categoryCounts = categories.reduce((acc, category) => {
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const favoriteCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category)

    // Calculate price range from orders
    const orderValues = orderData
      .map(order => parseFloat(order.totalPrice?.amount || '0'))
      .filter(price => price > 0)

    const preferredPriceRange = orderValues.length > 0 ? {
      min: Math.min(...orderValues) * 0.8, // 20% below lowest order
      max: Math.max(...orderValues) * 1.2  // 20% above highest order
    } : {min: 0, max: 1000}

    // Determine shopping frequency
    const orderDates = orderData
      .map(order => new Date(order.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())

    let shoppingFrequency: 'low' | 'medium' | 'high' = 'low'
    if (orderDates.length > 0) {
      const daysSinceLastOrder = (Date.now() - orderDates[0].getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastOrder < 30) shoppingFrequency = 'high'
      else if (daysSinceLastOrder < 90) shoppingFrequency = 'medium'
    }

    // Extract preferred brands from product titles/vendors
    const brands = purchasedProducts
      .map(product => product?.vendor)
      .filter(Boolean) as string[]
    
    const brandCounts = brands.reduce((acc, brand) => {
      acc[brand] = (acc[brand] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const preferredBrands = Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([brand]) => brand)

    return {
      favoriteCategories,
      preferredPriceRange,
      shoppingFrequency,
      preferredBrands
    }
  }, [orders, recentProducts, savedProducts])

  const customerAnalytics = useMemo((): CustomerAnalytics => {
    if (!orders || !recentProducts || !savedProducts) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        favoriteProducts: [],
        recentlyViewed: recentProducts || [],
        savedProducts: savedProducts || [],
        cartAbandonmentRate: 0
      }
    }

    const orderData = orders.edges?.map(edge => edge.node) || []
    
    // Calculate order statistics
    const totalOrders = orderData.length
    const totalSpent = orderData.reduce((sum, order) => {
      return sum + parseFloat(order.totalPrice?.amount || '0')
    }, 0)
    
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
    
    const lastOrderDate = orderData.length > 0 
      ? new Date(orderData[0].createdAt)
      : undefined

    // Get favorite products (most ordered)
    const productOrderCounts = orderData.flatMap(order => 
      order.lineItems?.edges?.map(edge => edge.node.merchandise?.product?.id) || []
    ).reduce((acc, productId) => {
      if (productId) {
        acc[productId] = (acc[productId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const favoriteProducts = Object.entries(productOrderCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([productId]) => 
        recentProducts?.find(p => p.id === productId)
      )
      .filter(Boolean) as Product[]

    // Calculate cart abandonment rate (simplified)
    // This would need more sophisticated tracking in a real implementation
    const cartAbandonmentRate = 0.3 // Placeholder - would need cart session tracking

    return {
      totalOrders,
      totalSpent,
      averageOrderValue,
      lastOrderDate,
      favoriteProducts,
      recentlyViewed: recentProducts || [],
      savedProducts: savedProducts || [],
      cartAbandonmentRate
    }
  }, [orders, recentProducts, savedProducts])

  const isLoading = userLoading || ordersLoading || recentLoading || savedLoading

  return {
    customerProfile,
    customerPreferences,
    customerAnalytics,
    isLoading,
    // Raw data for advanced usage
    rawData: {
      currentUser,
      orders,
      recentProducts,
      savedProducts
    }
  }
}
