import type {Friend, ColorScheme} from './types'

export const SAMPLE_FRIENDS: Friend[] = []

// Drag & Drop Constants
export const DRAG_CONFIG = {
  MAX_DISTANCE: 200,
  MIN_SIZE: 64,
  BASE_SIZE: 256,
  BASE_HEIGHT: 320,
  BORDER_RADIUS: 24,
  FRIEND_SPACING: 100, // Legacy - now calculated dynamically
  MIN_FRIEND_SPACING: 20, // Minimum spacing between friend blobs
  ANIMATION_DURATION: 300
} as const

// UI Constants
export const UI_CONFIG = {
  HOLD_DURATION: 1500,
  DAILY_COMPLETE_DELAY: 3000,
  ANIMATION_STAGGER: 300
} as const

// Cache for color classes to avoid recalculation
const colorClassesCache = new Map<ColorScheme, ReturnType<typeof calculateColorClasses>>()

function calculateColorClasses(colorScheme: ColorScheme) {
  if (colorScheme === 'colorblind') {
    // Colorblind-friendly purple/violet theme
    return {
      background: 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50',
      cardBg: 'bg-white/40 backdrop-blur-sm border border-white/30',
      primaryGradient: 'bg-gradient-to-r from-violet-500 to-purple-600',
      secondaryGradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
      accentGradient: 'bg-gradient-to-r from-violet-400 to-purple-500',
      logoGradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
      textPrimary: 'text-slate-700',
      textSecondary: 'text-slate-500',
      textAccent: 'text-violet-600',
      border: 'border-white/40',
      hover: 'hover:bg-violet-500/90',
      glass: 'bg-white/30 backdrop-blur-md border border-white/40 shadow-lg',
      ringColor: 'ring-violet-400/30',
      hoverBorder: 'hover:border-violet-400',
      hoverBg: 'hover:bg-violet-50'
    }
  }
  
  // Default chill blue theme
  return {
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    cardBg: 'bg-white/40 backdrop-blur-sm border border-white/30',
    primaryGradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    secondaryGradient: 'bg-gradient-to-r from-indigo-500 to-blue-600',
    accentGradient: 'bg-gradient-to-r from-blue-400 to-indigo-500',
    logoGradient: 'from-blue-500 via-indigo-600 to-blue-700',
    textPrimary: 'text-slate-700',
    textSecondary: 'text-slate-500',
    textAccent: 'text-blue-600',
    border: 'border-white/40',
    hover: 'hover:bg-blue-500/90',
    glass: 'bg-white/30 backdrop-blur-md border border-white/40 shadow-lg',
    ringColor: 'ring-blue-400/30',
    hoverBorder: 'hover:border-blue-400',
    hoverBg: 'hover:bg-blue-50'
  }
}

export const getColorClasses = (colorScheme: ColorScheme) => {
  if (!colorClassesCache.has(colorScheme)) {
    colorClassesCache.set(colorScheme, calculateColorClasses(colorScheme))
  }
  return colorClassesCache.get(colorScheme)!
}