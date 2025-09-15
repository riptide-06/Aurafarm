// Cart and Customer Data Hooks
export {useCartData} from './useCartData'
export type {CartItem, CartData} from './useCartData'

export {useCustomerData} from './useCustomerData'
export type {CustomerProfile, CustomerPreferences, CustomerAnalytics} from './useCustomerData'

// Personalization Hooks
export {usePersonalizedRecommendations} from './usePersonalizedRecommendations'
export type {PersonalizedProduct, RecommendationReason} from './usePersonalizedRecommendations'

// Analytics Hooks
export {useUserAnalytics} from './useUserAnalytics'
export type {UserEvent, UserSession, AnalyticsSummary} from './useUserAnalytics'

// Existing Hooks
export {useAppState} from './useAppState'
export {useDragDrop} from './useDragDrop'
export {useLocalStorage} from './useLocalStorage'
