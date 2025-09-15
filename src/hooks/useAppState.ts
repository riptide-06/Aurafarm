import {useState, useMemo} from 'react'
import type {Screen, FriendGroup, GiftAssignment, UserStats, ColorScheme} from '../types'
import {useLocalStorage} from './useLocalStorage'

export const useAppState = () => {
  // Persistent state with localStorage
  const [userStats, setUserStats] = useState({
    aura: 0,
    points: 0,
    streak: 0,
    dailyComplete: false,
    badges: ['New Member']
  })
  const [friendGroups, setFriendGroups] = useLocalStorage<FriendGroup[]>('vibe-barn-friend-groups', [])
  const [giftAssignments, setGiftAssignments] = useLocalStorage<GiftAssignment[]>('vibe-barn-gift-assignments', [])
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>('vibe-barn-color-scheme', 'default')
  
  // Session state (not persisted)
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash')
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [showFriendSelection, setShowFriendSelection] = useState(false)
  const [showDailyComplete, setShowDailyComplete] = useState(false)
  const [showProductInfo, setShowProductInfo] = useState(false)
  const [isInfiniteMode, setIsInfiniteMode] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<FriendGroup | null>(null)
  const [userId] = useState(() => {
    // Generate consistent user ID or retrieve from localStorage
    const stored = localStorage.getItem('vibe-barn-user-id')
    if (stored) return stored
    const newId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('vibe-barn-user-id', newId)
    return newId
  })
  const [groupName, setGroupName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)

  // Memoized derived state
  const totalAuraEarned = useMemo(() => 
    userStats.aura + (userStats.streak * 5), 
    [userStats.aura, userStats.streak]
  )

  return {
    currentScreen, setCurrentScreen,
    currentProductIndex, setCurrentProductIndex,
    showFriendSelection, setShowFriendSelection,
    showDailyComplete, setShowDailyComplete,
    showProductInfo, setShowProductInfo,
    isInfiniteMode, setIsInfiniteMode,
    currentGroup, setCurrentGroup,
    friendGroups, setFriendGroups,
    giftAssignments, setGiftAssignments,
    userStats, setUserStats,
    userId,
    groupName, setGroupName,
    groupCode, setGroupCode,
    colorScheme, setColorScheme,
    isHolding, setIsHolding,
    holdProgress, setHoldProgress,
    totalAuraEarned
  }
}