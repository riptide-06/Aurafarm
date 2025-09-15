# VibeBarn Hooks for Cart and Customer Data

This directory contains custom React hooks that integrate with the Shopify Minis SDK to collect cart data, customer information, and provide personalized recommendations.

## Available Hooks

### 1. `useCartData` - Cart Management

Manages the user's shopping cart with local storage persistence and Shopify integration.

```tsx
import {useCartData} from '../hooks'

function MyComponent() {
  const {
    cart,                    // Current cart state
    addItemToCart,          // Add product to cart
    removeItemFromCart,     // Remove item from cart
    updateItemQuantity,     // Update item quantity
    clearCart,              // Clear entire cart
    buyItemDirectly,        // Buy product directly
    isLoading               // Loading state
  } = useCartData()

  const handleAddToCart = async (product) => {
    const result = await addItemToCart(product, 2)
    if (result.success) {
      console.log('Added to cart successfully!')
    }
  }

  return (
    <div>
      <p>Cart has {cart.totalItems} items</p>
      <p>Total value: ${cart.totalValue.toFixed(2)}</p>
      {/* Render cart items */}
    </div>
  )
}
```

**Features:**
- Local storage persistence
- Shopify cart integration
- Quantity management
- Price calculations
- Error handling

### 2. `useCustomerData` - Customer Information

Collects and analyzes customer data from Shopify for personalization.

```tsx
import {useCustomerData} from '../hooks'

function MyComponent() {
  const {
    customerProfile,        // Basic customer info
    customerPreferences,    // Analyzed preferences
    customerAnalytics,      // Shopping analytics
    isLoading,              // Loading state
    rawData                // Raw Shopify data
  } = useCustomerData()

  return (
    <div>
      <h2>Welcome, {customerProfile.firstName}!</h2>
      <p>You've spent ${customerAnalytics.totalSpent.toFixed(2)}</p>
      <p>Favorite categories: {customerPreferences.favoriteCategories.join(', ')}</p>
    </div>
  )
}
```

**Features:**
- Customer profile extraction
- Purchase history analysis
- Category preferences
- Price range preferences
- Brand preferences
- Shopping frequency analysis

### 3. `usePersonalizedRecommendations` - Smart Recommendations

Provides personalized product recommendations based on user behavior.

```tsx
import {usePersonalizedRecommendations} from '../hooks'

function MyComponent() {
  const {
    personalizedRecommendations,    // Top recommendations
    getRecommendationsByCategory,   // Filter by category
    getRecommendationsByPriceRange, // Filter by price
    getRecommendationsByBrand,      // Filter by brand
    isLoading,                       // Loading state
    summary                          // Recommendation stats
  } = usePersonalizedRecommendations()

  return (
    <div>
      <h3>Recommended for You</h3>
      {personalizedRecommendations.map(rec => (
        <div key={rec.product.id}>
          <ProductCard product={rec.product} />
          <p>Score: {rec.score}</p>
          {rec.reasons.map(reason => (
            <span key={reason.type}>✨ {reason.description}</span>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Features:**
- Multi-factor scoring algorithm
- Cart similarity matching
- Purchase history analysis
- Category preferences
- Price range matching
- Brand preferences
- Recently viewed products

### 4. `useUserAnalytics` - Behavior Tracking

Tracks user behavior and provides analytics for improving personalization.

```tsx
import {useUserAnalytics} from '../hooks'

function MyComponent() {
  const {
    trackProductView,       // Track product views
    trackProductClick,      // Track product clicks
    trackAddToCart,         // Track cart additions
    trackPurchase,          // Track purchases
    trackSearch,            // Track searches
    currentSession,         // Current session info
    analyticsSummary,       // Analytics overview
    clearAnalytics          // Clear analytics data
  } = useUserAnalytics()

  const handleProductView = (product) => {
    trackProductView(product)
  }

  return (
    <div>
      <p>Session ID: {currentSession?.id}</p>
      <p>Total events: {analyticsSummary.totalEvents}</p>
      <p>Conversion rate: {(analyticsSummary.conversionRate * 100).toFixed(1)}%</p>
    </div>
  )
}
```

**Features:**
- Session management
- Event tracking
- Behavior analytics
- Conversion tracking
- Local storage persistence
- Privacy-compliant

## Integration Example

Here's how to use all hooks together in a component:

```tsx
import React from 'react'
import {useCartData, useCustomerData, usePersonalizedRecommendations, useUserAnalytics} from '../hooks'

function ShoppingExperience() {
  // Initialize all hooks
  const {cart, addItemToCart} = useCartData()
  const {customerProfile, customerPreferences} = useCustomerData()
  const {personalizedRecommendations} = usePersonalizedRecommendations()
  const {trackProductView, trackAddToCart} = useUserAnalytics()

  const handleProductInteraction = async (product) => {
    // Track the interaction
    trackProductView(product)
    
    // Add to cart
    const result = await addItemToCart(product)
    if (result.success) {
      trackAddToCart(product)
    }
  }

  return (
    <div>
      {/* Personalized welcome */}
      <h1>Welcome back, {customerProfile.firstName}!</h1>
      
      {/* Cart summary */}
      <p>Your cart has {cart.totalItems} items</p>
      
      {/* Personalized recommendations */}
      <h2>Recommended for You</h2>
      {personalizedRecommendations.map(rec => (
        <div key={rec.product.id}>
          <ProductCard 
            product={rec.product}
            onClick={() => handleProductInteraction(rec.product)}
          />
        </div>
      ))}
    </div>
  )
}
```

## Data Flow

1. **User Interaction** → `useUserAnalytics` tracks behavior
2. **Behavior Data** → `useCustomerData` analyzes patterns
3. **Analysis Results** → `usePersonalizedRecommendations` generates suggestions
4. **Recommendations** → User sees personalized content
5. **Cart Actions** → `useCartData` manages shopping state
6. **Purchase Data** → Feeds back into customer analysis

## Privacy and Performance

- All data is stored locally in localStorage
- No external analytics services required
- Optimized with React hooks and memoization
- Session-based tracking with automatic cleanup
- GDPR-compliant local storage approach

## Best Practices

1. **Initialize hooks early** in component hierarchy
2. **Use loading states** to handle async data
3. **Track events consistently** for better personalization
4. **Handle errors gracefully** in cart operations
5. **Respect user privacy** by not storing sensitive data
6. **Optimize performance** by memoizing expensive calculations

## Troubleshooting

### Common Issues

1. **Cart not persisting**: Check localStorage permissions
2. **Recommendations not loading**: Verify Shopify SDK connection
3. **Analytics not tracking**: Ensure hooks are properly initialized
4. **Performance issues**: Check for unnecessary re-renders

### Debug Mode

Enable debug logging by setting localStorage:

```tsx
localStorage.setItem('vibebarn-debug', 'true')
```

This will log detailed information about hook operations to the console.
