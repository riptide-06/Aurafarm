import type {Product as ShopifyProduct} from '@shopify/shop-minis-react'

export type Product = ShopifyProduct

export type Friend = {
  id: string
  name: string
  avatar: string
  aura: number
  dailyComplete: boolean
}

export type FriendGroup = {
  id: string
  name: string
  code: string
  members: Friend[]
  createdAt: Date
}

export type GiftAssignment = {
  id: string
  product: Product
  fromFriendId: string
  toFriendId: string
  groupId: string
  createdAt: Date
  revealed: boolean
}

export type UserStats = {
  points: number
  streak: number
  aura: number
  dailyComplete: boolean
  badges: string[]
}

export type ColorScheme = 'default' | 'colorblind'

export type Screen = 'splash' | 'home' | 'groups' | 'create-group' | 'join-group' | 'group-dashboard' | 'aura-farming' | 'continuous-aura-farm' | 'profile' | 'aura-info'

export interface DragPosition {
  x: number
  y: number
}

export interface DragConfig {
  readonly maxDistance: number
  readonly minSize: number
  readonly baseSize: number
  readonly baseHeight: number
  readonly borderRadius: number
  readonly friendSpacing: number
  readonly animationDuration: number
}

export interface UIConfig {
  readonly holdDuration: number
  readonly dailyCompleteDelay: number
  readonly animationStagger: number
}

export interface ColorClasses {
  readonly background: string
  readonly cardBg: string
  readonly primaryGradient: string
  readonly secondaryGradient: string
  readonly accentGradient: string
  readonly logoGradient: string
  readonly textPrimary: string
  readonly textSecondary: string
  readonly textAccent: string
  readonly border: string
  readonly hover: string
  readonly glass: string
  readonly ringColor: string
  readonly hoverBorder: string
  readonly hoverBg: string
}