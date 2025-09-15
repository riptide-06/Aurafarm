import {useState, useEffect, useCallback, useRef} from 'react'
import {useCartData} from './useCartData'
import {useCustomerData} from './useCustomerData'
import type {Product} from '../types'

export interface UserEvent {
  id: string
  type: 'product_view' | 'product_click' | 'add_to_cart' | 'remove_from_cart' | 'purchase' | 'search' | 'category_browse' | 'cart_abandon' | 'scroll' | 'time_spent' | 'screen_view' | 'button_click' | 'form_interaction' | 'error' | 'performance'
  productId?: string
  productType?: string
  category?: string
  searchQuery?: string
  timestamp: Date
  sessionId: string
  metadata?: Record<string, any>
  duration?: number
  screenName?: string
  elementId?: string
  errorMessage?: string
  performanceMetrics?: {
    loadTime?: number
    renderTime?: number
    interactionTime?: number
  }
}

export interface UserSession {
  id: string
  startTime: Date
  endTime?: Date
  events: UserEvent[]
  pageViews: string[]
  productsViewed: string[]
  cartInteractions: number
  purchases: number
  totalScrollDepth: number
  totalTimeSpent: number
  lastActivity: Date
  deviceInfo: {
    userAgent: string
    screenSize: string
    viewportSize: string
    language: string
  }
}

export interface AnalyticsSummary {
  totalSessions: number
  totalEvents: number
  averageSessionDuration: number
  mostViewedCategories: Array<{category: string, count: number}>
  mostInteractedProducts: Array<{productId: string, count: number}>
  conversionRate: number
  cartAbandonmentRate: number
  averageScrollDepth: number
  averageTimeSpent: number
  topPerformingScreens: Array<{screenName: string, engagement: number}>
  errorRate: number
}

// New interfaces for recommendation algorithms
export interface UserPreference {
  userId: string
  productId: string
  rating: number // 1-5 scale
  interactionType: 'view' | 'click' | 'cart' | 'purchase'
  timestamp: Date
  weight: number // Weight based on interaction type
}

export interface ProductSimilarity {
  productId1: string
  productId2: string
  similarity: number // 0-1 scale
  category: string
}

export interface RecommendationScore {
  productId: string
  score: number
  algorithm: 'collaborative' | 'content' | 'hybrid' | 'ml'
  confidence: number
  reasoning: string[]
}

export interface MLPrediction {
  productId: string
  purchaseProbability: number
  nextPurchaseTime?: number // days from now
  churnRisk: number
  lifetimeValue: number
}

// Enhanced analytics summary with ML insights
export interface EnhancedAnalyticsSummary extends AnalyticsSummary {
  userSegments: Array<{segment: string, count: number, avgValue: number}>
  productAffinityGroups: Array<{group: string, products: string[], strength: number}>
  seasonalTrends: Array<{month: string, trend: number, confidence: number}>
  mlInsights: {
    topPredictions: MLPrediction[]
    churnRiskUsers: string[]
    highValueUsers: string[]
  }
}

export function useUserAnalytics() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null)
  const [events, setEvents] = useState<UserEvent[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreference[]>([])
  const [productSimilarities, setProductSimilarities] = useState<ProductSimilarity[]>([])
  
  const {cart} = useCartData()
  const {customerAnalytics} = useCustomerData()
  
  const sessionTimeoutRef = useRef<NodeJS.Timeout>()
  const scrollTrackerRef = useRef<NodeJS.Timeout>()
  const timeTrackerRef = useRef<NodeJS.Timeout>()
  const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  const SCROLL_DEBOUNCE = 100 // 100ms debounce for scroll events

  // Get device information
  const getDeviceInfo = useCallback(() => ({
    userAgent: navigator.userAgent,
    screenSize: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language
  }), [])

  // Initialize or resume session
  useEffect(() => {
    const savedSessions = localStorage.getItem('vibebarn-sessions')
    const savedEvents = localStorage.getItem('vibebarn-events')
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : undefined,
          lastActivity: new Date(session.lastActivity),
          events: session.events.map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp)
          }))
        }))
        setSessions(parsedSessions)
      } catch (error) {
        console.error('Failed to parse saved sessions:', error)
      }
    }
    
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }))
        setEvents(parsedEvents)
      } catch (error) {
        console.error('Failed to parse saved events:', error)
      }
    }

    // Start new session
    const newSession: UserSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      lastActivity: new Date(),
      events: [],
      pageViews: [],
      productsViewed: [],
      cartInteractions: 0,
      purchases: 0,
      totalScrollDepth: 0,
      totalTimeSpent: 0,
      deviceInfo: getDeviceInfo()
    }
    
    setCurrentSession(newSession)
    
    // Set session timeout
    sessionTimeoutRef.current = setTimeout(() => {
      endSession()
    }, SESSION_TIMEOUT)

    // Start time tracking
    startTimeTracking()

    // Start scroll tracking
    startScrollTracking()

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current)
      }
      if (scrollTrackerRef.current) {
        clearTimeout(scrollTrackerRef.current)
      }
    }
  }, [getDeviceInfo])

  // Load user preferences and product similarities from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('vibebarn-user-preferences')
    const savedSimilarities = localStorage.getItem('vibebarn-product-similarities')
    
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences).map((pref: any) => ({
          ...pref,
          timestamp: new Date(pref.timestamp)
        }))
        setUserPreferences(parsedPreferences)
      } catch (error) {
        console.error('Failed to parse saved preferences:', error)
      }
    }
    
    if (savedSimilarities) {
      try {
        setProductSimilarities(JSON.parse(savedSimilarities))
      } catch (error) {
        console.error('Failed to parse saved similarities:', error)
      }
    }
  }, [])

  // Save sessions and events to localStorage
  useEffect(() => {
    localStorage.setItem('vibebarn-sessions', JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    localStorage.setItem('vibebarn-events', JSON.stringify(events))
  }, [events])

  // Save user preferences and product similarities to localStorage
  useEffect(() => {
    localStorage.setItem('vibebarn-user-preferences', JSON.stringify(userPreferences))
  }, [userPreferences])

  useEffect(() => {
    localStorage.setItem('vibebarn-product-similarities', JSON.stringify(productSimilarities))
  }, [productSimilarities])

  const startTimeTracking = useCallback(() => {
    timeTrackerRef.current = setInterval(() => {
      if (currentSession) {
        const now = new Date()
        const timeSpent = now.getTime() - currentSession.startTime.getTime()
        
        setCurrentSession(prev => {
          if (!prev) return prev
          return {
            ...prev,
            totalTimeSpent: timeSpent,
            lastActivity: now
          }
        })

        // Track time spent event every minute
        if (timeSpent % 60000 < 1000) { // Every minute
          trackEvent({
            type: 'time_spent',
            duration: timeSpent,
            metadata: { interval: 'minute' }
          })
        }
      }
    }, 1000) // Update every second
  }, [currentSession])

  const startScrollTracking = useCallback(() => {
    const handleScroll = () => {
      if (scrollTrackerRef.current) {
        clearTimeout(scrollTrackerRef.current)
      }
      
      scrollTrackerRef.current = setTimeout(() => {
        const scrollDepth = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
        
        if (currentSession && scrollDepth > currentSession.totalScrollDepth) {
          setCurrentSession(prev => {
            if (!prev) return prev
            return {
              ...prev,
              totalScrollDepth: Math.max(prev.totalScrollDepth, scrollDepth)
            }
          })

          // Track significant scroll progress
          if (scrollDepth % 25 === 0) { // Every 25% scroll
            trackEvent({
              type: 'scroll',
              metadata: { scrollDepth, direction: 'down' }
            })
          }
        }
      }, SCROLL_DEBOUNCE)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentSession])

  const endSession = useCallback(() => {
    if (currentSession) {
      const endedSession: UserSession = {
        ...currentSession,
        endTime: new Date()
      }
      
      setSessions(prev => [...prev, endedSession])
      setCurrentSession(null)
      
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current)
      }
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current)
      }
      if (scrollTrackerRef.current) {
        clearTimeout(scrollTrackerRef.current)
      }
    }
  }, [currentSession])

  // Update user preferences based on events
  const updateUserPreferences = useCallback((event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>) => {
    if (!event.productId) return

    const userId = currentSession?.id || 'anonymous'
    let rating = 0
    let weight = 0

    // Assign ratings and weights based on interaction type
    switch (event.type) {
      case 'product_view':
        rating = 1
        weight = 0.1
        break
      case 'product_click':
        rating = 2
        weight = 0.3
        break
      case 'add_to_cart':
        rating = 4
        weight = 0.7
        break
      case 'purchase':
        rating = 5
        weight = 1.0
        break
      case 'remove_from_cart':
        rating = 1
        weight = 0.2
        break
      default:
        return
    }

    // Update or add preference
    setUserPreferences(prev => {
      const existingIndex = prev.findIndex(p => p.userId === userId && p.productId === event.productId)
      
      if (existingIndex >= 0) {
        // Update existing preference with weighted average
        const existing = prev[existingIndex]
        const newWeight = existing.weight + weight
        const newRating = (existing.rating * existing.weight + rating * weight) / newWeight
        
        const updated = [...prev]
        updated[existingIndex] = {
          ...existing,
          rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
          weight: newWeight,
          timestamp: new Date()
        }
        return updated
      } else {
        // Add new preference
        return [...prev, {
          userId,
          productId: event.productId!,
          rating,
          interactionType: event.type as any,
          timestamp: new Date(),
          weight
        }]
      }
    })
  }, [currentSession])

  // Enhanced tracking with preference learning
  const trackEvent = useCallback((event: Omit<UserEvent, 'id' | 'timestamp' | 'sessionId'>) => {
    if (!currentSession) return

    const newEvent: UserEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: currentSession.id
    }

    // Update user preferences based on event
    updateUserPreferences(event)

    // Update current session
    setCurrentSession(prev => {
      if (!prev) return prev
      
      const updatedEvents = [...prev.events, newEvent]
      let updatedSession = { ...prev, events: updatedEvents, lastActivity: new Date() }
      
      // Update session metrics based on event type
      switch (event.type) {
        case 'product_view':
          if (event.productId && !prev.productsViewed.includes(event.productId)) {
            updatedSession.productsViewed = [...prev.productsViewed, event.productId]
          }
          break
        case 'add_to_cart':
        case 'remove_from_cart':
          updatedSession.cartInteractions = prev.cartInteractions + 1
          break
        case 'purchase':
          updatedSession.purchases = prev.purchases + 1
          break
        case 'time_spent':
          updatedSession.totalTimeSpent = event.duration || prev.totalTimeSpent
          break
        case 'scroll':
          updatedSession.totalScrollDepth = Math.max(prev.totalScrollDepth, event.metadata?.scrollDepth || 0)
          break
      }
      
      return updatedSession
    })

    // Add to global events
    setEvents(prev => [...prev, newEvent])

    // Reset session timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
      endSession()
    }, SESSION_TIMEOUT)
  }, [currentSession, endSession, updateUserPreferences])

  const trackProductView = useCallback((product: Product) => {
    trackEvent({
      type: 'product_view',
      productId: product.id,
      productType: product.productType,
      category: product.productType
    })
  }, [trackEvent])

  const trackProductClick = useCallback((product: Product) => {
    trackEvent({
      type: 'product_click',
      productId: product.id,
      productType: product.productType,
      category: product.productType
    })
  }, [trackEvent])

  const trackAddToCart = useCallback((product: Product) => {
    trackEvent({
      type: 'add_to_cart',
      productId: product.id,
      productType: product.productType,
      category: product.productType
    })
  }, [trackEvent])

  const trackRemoveFromCart = useCallback((product: Product) => {
    trackEvent({
      type: 'remove_from_cart',
      productId: product.id,
      productType: product.productType,
      category: product.productType
    })
  }, [trackEvent])

  const trackPurchase = useCallback((products: Product[], totalAmount: number) => {
    products.forEach(product => {
      trackEvent({
        type: 'purchase',
        productId: product.id,
        productType: product.productType,
        category: product.productType,
        metadata: { totalAmount }
      })
    })
  }, [trackEvent])

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent({
      type: 'search',
      searchQuery: query,
      metadata: { resultsCount }
    })
  }, [trackEvent])

  const trackCategoryBrowse = useCallback((category: string) => {
    trackEvent({
      type: 'category_browse',
      category
    })
  }, [trackEvent])

  const trackScreenView = useCallback((screenName: string) => {
    trackEvent({
      type: 'screen_view',
      screenName
    })
  }, [trackEvent])

  const trackButtonClick = useCallback((buttonId: string, buttonText?: string, context?: string) => {
    trackEvent({
      type: 'button_click',
      elementId: buttonId,
      metadata: { buttonText, context }
    })
  }, [trackEvent])

  const trackFormInteraction = useCallback((formId: string, fieldName: string, action: 'focus' | 'blur' | 'change' | 'submit') => {
    trackEvent({
      type: 'form_interaction',
      elementId: formId,
      metadata: { fieldName, action }
    })
  }, [trackEvent])

  const trackError = useCallback((errorMessage: string, errorType: string, context?: string) => {
    trackEvent({
      type: 'error',
      errorMessage,
      metadata: { errorType, context }
    })
  }, [trackEvent])

  const trackPerformance = useCallback((metrics: {loadTime?: number, renderTime?: number, interactionTime?: number}) => {
    trackEvent({
      type: 'performance',
      performanceMetrics: metrics
    })
  }, [trackEvent])

  const trackPageView = useCallback((page: string) => {
    if (currentSession && !currentSession.pageViews.includes(page)) {
      setCurrentSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          pageViews: [...prev.pageViews, page]
        }
      })
    }
  }, [currentSession])

  const getAnalyticsSummary = useCallback((): AnalyticsSummary => {
    const totalSessions = sessions.length
    const totalEvents = events.length
    
    // Calculate average session duration
    const completedSessions = sessions.filter(s => s.endTime)
    const averageSessionDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, session) => {
          const duration = session.endTime!.getTime() - session.startTime.getTime()
          return sum + duration
        }, 0) / completedSessions.length
      : 0

    // Calculate average scroll depth and time spent
    const averageScrollDepth = sessions.length > 0
      ? sessions.reduce((sum, session) => sum + session.totalScrollDepth, 0) / sessions.length
      : 0

    const averageTimeSpent = sessions.length > 0
      ? sessions.reduce((sum, session) => sum + session.totalTimeSpent, 0) / sessions.length
      : 0

    // Most viewed categories
    const categoryCounts = events
      .filter(event => event.category)
      .reduce((acc, event) => {
        acc[event.category!] = (acc[event.category!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const mostViewedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Most interacted products
    const productCounts = events
      .filter(event => event.productId)
      .reduce((acc, event) => {
        acc[event.productId!] = (acc[event.productId!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const mostInteractedProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([productId, count]) => ({ productId, count }))

    // Top performing screens
    const screenCounts = events
      .filter(event => event.screenName)
      .reduce((acc, event) => {
        acc[event.screenName!] = (acc[event.screenName!] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topPerformingScreens = Object.entries(screenCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([screenName, count]) => ({ screenName, engagement: count }))

    // Conversion rate (purchases / total sessions)
    const totalPurchases = events.filter(e => e.type === 'purchase').length
    const conversionRate = totalSessions > 0 ? totalPurchases / totalSessions : 0

    // Error rate
    const totalErrors = events.filter(e => e.type === 'error').length
    const errorRate = totalEvents > 0 ? totalErrors / totalEvents : 0

    // Cart abandonment rate
    const cartAbandonmentRate = 0.3 // Placeholder - would need more sophisticated tracking

    return {
      totalSessions,
      totalEvents,
      averageSessionDuration,
      mostViewedCategories,
      mostInteractedProducts,
      conversionRate,
      cartAbandonmentRate,
      averageScrollDepth,
      averageTimeSpent,
      topPerformingScreens,
      errorRate
    }
  }, [sessions, events])

  // Helper functions for ML algorithms
  const getProductCategory = useCallback((productId: string): string | null => {
    // This would typically come from your product catalog
    // For now, we'll use a simple hash-based approach
    const hash = productId.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff
      return a
    }, 0)
    
    const categories = ['electronics', 'clothing', 'home', 'sports', 'books', 'beauty']
    return categories[Math.abs(hash) % categories.length]
  }, [])

  const analyzeUserBehavior = useCallback((userId: string) => {
    const userPrefs = userPreferences.filter(p => p.userId === userId)
    const userEvents = events.filter(e => e.sessionId === userId)
    
    return {
      avgRating: userPrefs.reduce((sum, p) => sum + p.rating, 0) / userPrefs.length || 0,
      totalInteractions: userPrefs.length,
      purchaseRate: userPrefs.filter(p => p.interactionType === 'purchase').length / userPrefs.length || 0,
      avgSessionDuration: userEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / userEvents.length || 0,
      categoryDiversity: new Set(userPrefs.map(p => getProductCategory(p.productId))).size
    }
  }, [userPreferences, events, getProductCategory])

  const calculateUserSimilarity = useCallback((userId1: string, userId2: string): number => {
    const user1Prefs = userPreferences.filter(p => p.userId === userId1)
    const user2Prefs = userPreferences.filter(p => p.userId === userId2)
    
    if (user1Prefs.length === 0 || user2Prefs.length === 0) return 0
    
    // Find common products
    const user1Products = new Set(user1Prefs.map(p => p.productId))
    const user2Products = new Set(user2Prefs.map(p => p.productId))
    const commonProducts = new Set([...user1Products].filter(x => user2Products.has(x)))
    
    if (commonProducts.size === 0) return 0
    
    // Calculate Pearson correlation
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0
    
    commonProducts.forEach(productId => {
      const rating1 = user1Prefs.find(p => p.productId === productId)?.rating || 0
      const rating2 = user2Prefs.find(p => p.productId === productId)?.rating || 0
      
      sum1 += rating1
      sum2 += rating2
      sum1Sq += rating1 * rating1
      sum2Sq += rating2 * rating2
      pSum += rating1 * rating2
    })
    
    const n = commonProducts.size
    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))
    
    return den === 0 ? 0 : Math.max(-1, Math.min(1, num / den))
  }, [userPreferences])

  // Collaborative Filtering Algorithm
  const getCollaborativeRecommendations = useCallback((userId: string, limit: number = 10): RecommendationScore[] => {
    const userPrefs = userPreferences.filter(p => p.userId === userId)
    if (userPrefs.length === 0) return []

    // Find similar users based on preference overlap
    const userSimilarities = new Map<string, number>()
    
    userPreferences.forEach(pref => {
      if (pref.userId === userId) return
      
      const commonProducts = userPrefs.some(up => up.productId === pref.productId)
      if (commonProducts) {
        const similarity = calculateUserSimilarity(userId, pref.userId)
        userSimilarities.set(pref.userId, similarity)
      }
    })

    // Get top similar users
    const topSimilarUsers = Array.from(userSimilarities.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId]) => userId)

    // Calculate recommendation scores
    const productScores = new Map<string, {score: number, count: number}>()
    
    topSimilarUsers.forEach(similarUserId => {
      const similarity = userSimilarities.get(similarUserId) || 0
      const similarUserPrefs = userPreferences.filter(p => p.userId === similarUserId)
      
      similarUserPrefs.forEach(pref => {
        if (userPrefs.some(up => up.productId === pref.productId)) return // Skip already rated
        
        const current = productScores.get(pref.productId) || {score: 0, count: 0}
        productScores.set(pref.productId, {
          score: current.score + (pref.rating * similarity),
          count: current.count + 1
        })
      })
    })

    // Convert to recommendation scores
    return Array.from(productScores.entries())
      .map(([productId, {score, count}]) => ({
        productId,
        score: score / count,
        algorithm: 'collaborative' as const,
        confidence: Math.min(count / 3, 1), // Confidence based on number of similar users
        reasoning: [`Recommended by ${count} similar users`]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }, [userPreferences, calculateUserSimilarity])

  // Content-Based Filtering Algorithm
  const getContentBasedRecommendations = useCallback((userId: string, limit: number = 10): RecommendationScore[] => {
    const userPrefs = userPreferences.filter(p => p.userId === userId)
    if (userPrefs.length === 0) return []

    // Calculate user's category preferences
    const categoryPreferences = new Map<string, number>()
    const totalWeight = userPrefs.reduce((sum, pref) => sum + pref.weight, 0)
    
    userPrefs.forEach(pref => {
      const category = getProductCategory(pref.productId)
      if (category) {
        const current = categoryPreferences.get(category) || 0
        categoryPreferences.set(category, current + (pref.rating * pref.weight))
      }
    })

    // Normalize category preferences
    categoryPreferences.forEach((value, category) => {
      categoryPreferences.set(category, value / totalWeight)
    })

    // Find products in preferred categories
    const productScores = new Map<string, {score: number, category: string}>()
    
    userPreferences.forEach(pref => {
      if (userPrefs.some(up => up.productId === pref.productId)) return // Skip already rated
      
      const category = getProductCategory(pref.productId)
      if (category && categoryPreferences.has(category)) {
        const categoryScore = categoryPreferences.get(category) || 0
        const productScore = pref.rating * categoryScore
        
        productScores.set(pref.productId, {
          score: productScore,
          category
        })
      }
    })

    return Array.from(productScores.entries())
      .map(([productId, {score, category}]) => ({
        productId,
        score,
        algorithm: 'content' as const,
        confidence: 0.8, // High confidence for content-based
        reasoning: [`Based on your preference for ${category} products`]
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }, [userPreferences, getProductCategory])

  // Hybrid Recommendation Algorithm
  const getHybridRecommendations = useCallback((userId: string, limit: number = 10): RecommendationScore[] => {
    const collaborative = getCollaborativeRecommendations(userId, limit * 2)
    const contentBased = getContentBasedRecommendations(userId, limit * 2)
    
    // Combine and re-rank recommendations
    const combinedScores = new Map<string, {collaborative: number, content: number, count: number}>()
    
    collaborative.forEach(rec => {
      const current = combinedScores.get(rec.productId) || {collaborative: 0, content: 0, count: 0}
      combinedScores.set(rec.productId, {
        collaborative: Math.max(current.collaborative, rec.score),
        content: current.content,
        count: current.count + 1
      })
    })
    
    contentBased.forEach(rec => {
      const current = combinedScores.get(rec.productId) || {collaborative: 0, content: 0, count: 0}
      combinedScores.set(rec.productId, {
        collaborative: current.collaborative,
        content: Math.max(current.content, rec.score),
        count: current.count + 1
      })
    })

    // Calculate hybrid scores with weights
    const hybridRecommendations = Array.from(combinedScores.entries())
      .map(([productId, {collaborative, content, count}]) => {
        const hybridScore = (collaborative * 0.6) + (content * 0.4)
        const confidence = Math.min(count / 2, 1)
        
        return {
          productId,
          score: hybridScore,
          algorithm: 'hybrid' as const,
          confidence,
          reasoning: [
            count > 1 ? 'Recommended by multiple algorithms' : 'Hybrid recommendation',
            `Collaborative: ${collaborative.toFixed(2)}, Content: ${content.toFixed(2)}`
          ]
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return hybridRecommendations
  }, [userPreferences, getCollaborativeRecommendations, getContentBasedRecommendations])

  // ML-based Purchase Prediction
  const getMLPredictions = useCallback((userId: string): MLPrediction[] => {
    const userPrefs = userPreferences.filter(p => p.userId === userId)
    if (userPrefs.length === 0) return []

    // Simple ML model using user behavior patterns
    const userBehavior = analyzeUserBehavior(userId)
    const predictions: MLPrediction[] = []

    // Analyze all products for this user
    const allProductIds = [...new Set(userPreferences.map(p => p.productId))]
    
    allProductIds.forEach(productId => {
      if (userPrefs.some(p => p.productId === productId)) return // Skip already rated
      
      const purchaseProbability = calculatePurchaseProbability(productId, userBehavior)
      const nextPurchaseTime = predictNextPurchaseTime(userBehavior)
      const churnRisk = calculateChurnRisk(userBehavior)
      const lifetimeValue = calculateLifetimeValue(userBehavior)
      
      predictions.push({
        productId,
        purchaseProbability,
        nextPurchaseTime,
        churnRisk,
        lifetimeValue
      })
    })

    return predictions
      .sort((a, b) => b.purchaseProbability - a.score)
      .slice(0, 10)
  }, [userPreferences, analyzeUserBehavior])

  const calculatePurchaseProbability = useCallback((productId: string, userBehavior: any): number => {
    const category = getProductCategory(productId)
    const categoryPref = userBehavior.categoryPreferences?.[category] || 0.5
    
    // Simple probability model based on user behavior
    let probability = 0.3 // Base probability
    
    // Adjust based on user rating patterns
    if (userBehavior.avgRating > 4) probability += 0.2
    if (userBehavior.avgRating > 3) probability += 0.1
    
    // Adjust based on purchase rate
    probability += userBehavior.purchaseRate * 0.3
    
    // Adjust based on category preference
    probability += categoryPref * 0.2
    
    return Math.min(1, Math.max(0, probability))
  }, [getProductCategory])

  const predictNextPurchaseTime = useCallback((userBehavior: any): number => {
    // Simple prediction based on user activity patterns
    const baseDays = 30
    const activityMultiplier = Math.max(0.5, 1 - (userBehavior.totalInteractions * 0.1))
    const purchaseMultiplier = userBehavior.purchaseRate > 0.5 ? 0.7 : 1.3
    
    return Math.round(baseDays * activityMultiplier * purchaseMultiplier)
  }, [])

  const calculateChurnRisk = useCallback((userBehavior: any): number => {
    // Calculate churn risk based on user behavior
    let risk = 0.5 // Base risk
    
    // Higher risk for low engagement
    if (userBehavior.totalInteractions < 3) risk += 0.3
    if (userBehavior.avgRating < 2.5) risk += 0.2
    if (userBehavior.purchaseRate < 0.2) risk += 0.2
    
    // Lower risk for high engagement
    if (userBehavior.totalInteractions > 10) risk -= 0.2
    if (userBehavior.avgRating > 4) risk -= 0.2
    if (userBehavior.purchaseRate > 0.6) risk -= 0.2
    
    return Math.min(1, Math.max(0, risk))
  }, [])

  const calculateLifetimeValue = useCallback((userBehavior: any): number => {
    // Simple LTV calculation
    const baseValue = 100
    const ratingMultiplier = userBehavior.avgRating / 5
    const purchaseMultiplier = userBehavior.purchaseRate * 2
    const engagementMultiplier = Math.min(2, userBehavior.totalInteractions / 5)
    
    return Math.round(baseValue * ratingMultiplier * purchaseMultiplier * engagementMultiplier)
  }, [])

  // Enhanced analytics summary with ML insights
  const getEnhancedAnalyticsSummary = useCallback((): EnhancedAnalyticsSummary => {
    const baseSummary = getAnalyticsSummary()
    
    // User segmentation
    const userSegments = analyzeUserSegments()
    
    // Product affinity groups
    const productAffinityGroups = findProductAffinityGroups()
    
    // Seasonal trends
    const seasonalTrends = analyzeSeasonalTrends()
    
    // ML insights
    const mlInsights = {
      topPredictions: getMLPredictions('anonymous').slice(0, 5),
      churnRiskUsers: identifyChurnRiskUsers(),
      highValueUsers: identifyHighValueUsers()
    }
    
    return {
      ...baseSummary,
      userSegments,
      productAffinityGroups,
      seasonalTrends,
      mlInsights
    }
  }, [getAnalyticsSummary, getMLPredictions])

  const analyzeUserSegments = useCallback(() => {
    const segments = [
      {name: 'High Value', criteria: (user: any) => user.avgRating > 4 && user.purchaseRate > 0.5},
      {name: 'Engaged', criteria: (user: any) => user.totalInteractions > 5},
      {name: 'At Risk', criteria: (user: any) => user.avgRating < 2.5 || user.purchaseRate < 0.2},
      {name: 'New', criteria: (user: any) => user.totalInteractions <= 2}
    ]
    
    const userIds = [...new Set(userPreferences.map(p => p.userId))]
    
    return segments.map(segment => {
      const matchingUsers = userIds.filter(userId => {
        const behavior = analyzeUserBehavior(userId)
        return segment.criteria(behavior)
      })
      
      const avgValue = matchingUsers.reduce((sum, userId) => {
        const behavior = analyzeUserBehavior(userId)
        return sum + calculateLifetimeValue(behavior)
      }, 0) / matchingUsers.length || 0
      
      return {
        segment: segment.name,
        count: matchingUsers.length,
        avgValue: Math.round(avgValue)
      }
    }).filter(segment => segment.count > 0)
  }, [userPreferences, analyzeUserBehavior, calculateLifetimeValue])

  const findProductAffinityGroups = useCallback(() => {
    // Simple affinity analysis based on co-occurrence in user preferences
    const productPairs = new Map<string, number>()
    
    userPreferences.forEach(pref1 => {
      userPreferences.forEach(pref2 => {
        if (pref1.userId === pref2.userId && pref1.productId !== pref2.productId) {
          const pairKey = [pref1.productId, pref2.productId].sort().join('|')
          productPairs.set(pairKey, (productPairs.get(pairKey) || 0) + 1)
        }
      })
    })
    
    // Group products by affinity
    const affinityGroups: Array<{group: string, products: string[], strength: number}> = []
    const processedProducts = new Set<string>()
    
    productPairs.forEach((strength, pairKey) => {
      if (strength < 2) return // Minimum affinity threshold
      
      const [prod1, prod2] = pairKey.split('|')
      if (processedProducts.has(prod1) || processedProducts.has(prod2)) return
      
      const group = [prod1, prod2]
      processedProducts.add(prod1)
      processedProducts.add(prod2)
      
      affinityGroups.push({
        group: `Group ${affinityGroups.length + 1}`,
        products: group,
        strength: strength / userPreferences.length
      })
    })
    
    return affinityGroups.sort((a, b) => b.strength - a.strength).slice(0, 5)
  }, [userPreferences])

  const analyzeSeasonalTrends = useCallback(() => {
    // Simple seasonal analysis based on event timestamps
    const monthlyTrends = new Map<string, number>()
    
    events.forEach(event => {
      const month = event.timestamp.toLocaleDateString('en-US', {month: 'short'})
      monthlyTrends.set(month, (monthlyTrends.get(month) || 0) + 1)
    })
    
    const totalEvents = events.length
    return Array.from(monthlyTrends.entries())
      .map(([month, count]) => ({
        month,
        trend: count / totalEvents,
        confidence: Math.min(count / 10, 1) // Confidence based on event count
      }))
      .sort((a, b) => b.trend - a.trend)
  }, [events])

  const identifyChurnRiskUsers = useCallback(): string[] => {
    const userIds = [...new Set(userPreferences.map(p => p.userId))]
    return userIds.filter(userId => {
      const behavior = analyzeUserBehavior(userId)
      return calculateChurnRisk(behavior) > 0.7
    }).slice(0, 10)
  }, [userPreferences, analyzeUserBehavior, calculateChurnRisk])

  const identifyHighValueUsers = useCallback(): string[] => {
    const userIds = [...new Set(userPreferences.map(p => p.userId))]
    return userIds.filter(userId => {
      const behavior = analyzeUserBehavior(userId)
      return calculateLifetimeValue(behavior) > 200
    }).slice(0, 10)
  }, [userPreferences, analyzeUserBehavior, calculateLifetimeValue])

  const clearAnalytics = useCallback(() => {
    setSessions([])
    setEvents([])
    setUserPreferences([])
    setProductSimilarities([])
    localStorage.removeItem('vibebarn-sessions')
    localStorage.removeItem('vibebarn-events')
    localStorage.removeItem('vibebarn-user-preferences')
    localStorage.removeItem('vibebarn-product-similarities')
  }, [])

  return {
    // Enhanced tracking functions
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackRemoveFromCart,
    trackPurchase,
    trackSearch,
    trackCategoryBrowse,
    trackPageView,
    trackScreenView,
    trackButtonClick,
    trackFormInteraction,
    trackError,
    trackPerformance,
    
    // Data access
    currentSession,
    sessions,
    events,
    analyticsSummary: getAnalyticsSummary(),
    enhancedAnalyticsSummary: getEnhancedAnalyticsSummary(),
    
    // Recommendation algorithms
    getCollaborativeRecommendations,
    getContentBasedRecommendations,
    getHybridRecommendations,
    getMLPredictions,
    
    // Utility functions
    endSession,
    clearAnalytics,
    
    // Status
    isTracking: !!currentSession
  }
}
