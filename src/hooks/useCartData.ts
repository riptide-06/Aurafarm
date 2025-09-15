import {useState, useEffect, useCallback} from 'react'
import {useShopCartActions} from '@shopify/shop-minis-react'
import type {Product} from '../types'

export interface CartItem {
  id: string
  product: Product
  quantity: number
  addedAt: Date
}

export interface CartData {
  items: CartItem[]
  totalItems: number
  totalValue: number
  lastUpdated: Date
}

export function useCartData() {
  const [cart, setCart] = useState<CartData>({
    items: [],
    totalItems: 0,
    totalValue: 0,
    lastUpdated: new Date()
  })
  
  const {addToCart, buyProduct} = useShopCartActions()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('vibebarn-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Convert date strings back to Date objects
        parsedCart.lastUpdated = new Date(parsedCart.lastUpdated)
        parsedCart.items = parsedCart.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        setCart(parsedCart)
      } catch (error) {
        console.error('Failed to parse saved cart:', error)
        localStorage.removeItem('vibebarn-cart')
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vibebarn-cart', JSON.stringify(cart))
  }, [cart])

  // Calculate totals whenever items change
  useEffect(() => {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = cart.items.reduce((sum, item) => {
      const price = parseFloat(item.product.price?.amount || '0')
      return sum + (price * item.quantity)
    }, 0)

    setCart(prev => ({
      ...prev,
      totalItems,
      totalValue,
      lastUpdated: new Date()
    }))
  }, [cart.items])

  const addItemToCart = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      // Add to Shopify cart
      await addToCart({
        productId: product.id,
        quantity
      })

      // Update local cart state
      setCart(prev => {
        const existingItemIndex = prev.items.findIndex(item => item.product.id === product.id)
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const updatedItems = [...prev.items]
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + quantity
          }
          return {
            ...prev,
            items: updatedItems,
            lastUpdated: new Date()
          }
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
            addedAt: new Date()
          }
          return {
            ...prev,
            items: [...prev.items, newItem],
            lastUpdated: new Date()
          }
        }
      })

      return {success: true}
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      return {success: false, error}
    }
  }, [addToCart])

  const removeItemFromCart = useCallback((itemId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
      lastUpdated: new Date()
    }))
  }, [])

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCart(itemId)
      return
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? {...item, quantity} : item
      ),
      lastUpdated: new Date()
    }))
  }, [removeItemFromCart])

  const clearCart = useCallback(() => {
    setCart({
      items: [],
      totalItems: 0,
      totalValue: 0,
      lastUpdated: new Date()
    })
  }, [])

  const buyItemDirectly = useCallback(async (product: Product, quantity: number = 1) => {
    try {
      await buyProduct({
        productId: product.id,
        quantity
      })
      return {success: true}
    } catch (error) {
      console.error('Failed to buy product:', error)
      return {success: false, error}
    }
  }, [buyProduct])

  return {
    cart,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCart,
    buyItemDirectly,
    isLoading: false // Since we're managing cart locally
  }
}
