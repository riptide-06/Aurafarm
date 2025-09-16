import {useMemo, useCallback, useState, useEffect} from 'react'
import {usePopularProducts} from '@shopify/shop-minis-react'
import type {Product, Friend, FriendGroup, GiftAssignment} from './types'
import {SAMPLE_FRIENDS, getColorClasses} from './constants'
import {useAppState} from './hooks/useAppState'
import {useDragDrop} from './hooks/useDragDrop'
import {useBackendSync} from './hooks/useBackendSync'
import {SplashScreen} from './components/SplashScreen'
import {HomePage} from './components/HomePage'
import {AuraFarming} from './components/AuraFarming'
import {GroupsScreen} from './components/GroupsScreen'
import {CreateGroupScreen} from './components/CreateGroupScreen'
import {JoinGroupScreen} from './components/JoinGroupScreen'
import {ProfileScreen} from './components/ProfileScreen'
import {ContinuousAuraFarm} from './components/ContinuousAuraFarm'
import {ErrorBoundary} from './components/shared/ErrorBoundary'

export function App() {
  const {products} = usePopularProducts()
  const {createGroupWithSync, joinGroupWithSync, addPointsWithSync} = useBackendSync()
  const {
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
    holdProgress, setHoldProgress
  } = useAppState()

  const {
    dragPosition,
    dragStart,
    isDragging,
    dragTarget,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    clearDragTarget
  } = useDragDrop()

  const colors = useMemo(() => getColorClasses(colorScheme), [colorScheme])

  const [joinError, setJoinError] = useState<string | null>(null)
  const [previousScreen, setPreviousScreen] = useState<Screen>('splash')

  // Clear join error when navigating TO join-group screen (but not when already on it)
  useEffect(() => {
    if (currentScreen === 'join-group' && previousScreen !== 'join-group') {
      setJoinError(null)
    }
    setPreviousScreen(currentScreen)
  }, [currentScreen, previousScreen])

  const createGroup = useCallback((name: string) => {
    const newGroup: FriendGroup = {
      id: Date.now().toString(),
      name: name,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      members: [{id: userId, name: 'You', avatar: '👤', aura: userStats.aura, dailyComplete: userStats.dailyComplete}],
      createdAt: new Date()
    }
    setFriendGroups((prev: FriendGroup[]) => [...prev, newGroup])
    setCurrentGroup(newGroup)
    setGroupName('')
    setCurrentScreen('group-dashboard')
    
    // Sync to backend in background (doesn't affect UI)
    createGroupWithSync(name, () => {})
  }, [userId, userStats, setFriendGroups, setCurrentGroup, setGroupName, setCurrentScreen, createGroupWithSync])

  const joinGroup = useCallback((code: string) => {
    // Check if already in a group with this code
    const alreadyInGroup = friendGroups.some(g => g.code === code)
    if (alreadyInGroup) {
      setJoinError('Already in farm')
      return
    }
    // Check if a group with this code exists
    const existingGroup = friendGroups.find(g => g.code === code)
    if (!existingGroup) {
      setJoinError('No farm found with that code')
      return
    }
    // Add user to the existing group
    const updatedGroup = {
      ...existingGroup,
      members: [
        ...existingGroup.members,
        {id: userId, name: 'You', avatar: '👤', aura: userStats.aura, dailyComplete: userStats.dailyComplete}
      ]
    }
    setFriendGroups((prev: FriendGroup[]) =>
      prev.map(g => g.code === code ? updatedGroup : g)
    )
    setCurrentGroup(updatedGroup)
    setGroupCode('')
    setCurrentScreen('group-dashboard')
    setJoinError(null)
    
    // Sync to backend in background (doesn't affect UI)
    joinGroupWithSync(code, () => {})
  }, [userId, userStats, friendGroups, setFriendGroups, setCurrentGroup, setGroupCode, setCurrentScreen, joinGroupWithSync])

  const nextProduct = useCallback(() => {
    console.log('nextProduct called, current index:', currentProductIndex, 'isInfiniteMode:', isInfiniteMode, 'dailyComplete:', userStats.dailyComplete)
    
    if (products && currentProductIndex < products.length - 1) {
      // Move to next product in the list
      console.log('Moving to next product in list')
      setCurrentProductIndex(prev => prev + 1)
    } else if (!isInfiniteMode && !userStats.dailyComplete) {
      // Daily challenge completed - show completion modal
      console.log('Daily challenge completed, showing modal')
      setShowDailyComplete(true)
      
      const newAura = userStats.aura + 10
      const newPoints = userStats.points + 10
      const newStreak = userStats.streak + 1
      
      setUserStats({
        ...userStats, 
        dailyComplete: true,
        aura: newAura, 
        points: newPoints,
        streak: newStreak
      })
      
      // Check if user leveled up
      const currentLevel = Math.floor(userStats.aura / 20) + 1
      const newLevel = Math.floor(newAura / 20) + 1
      
      if (newLevel > currentLevel) {
        // Level up! Show celebration
        console.log(`🎉 Level up! You're now level ${newLevel}!`)
        // You could add a level up animation or notification here
      }
      
      // Don't call completeDailyAssignment here - let the user click the button
      // This prevents the double increment issue
    } else if (isInfiniteMode) {
      // In infinite mode, just cycle through products
      console.log('In infinite mode, cycling through products')
      setCurrentProductIndex(prev => (prev + 1) % (products?.length || 1))
    }
  }, [currentProductIndex, isInfiniteMode, userStats, products, setCurrentProductIndex, setShowDailyComplete, setUserStats])

  const assignGiftToFriend = useCallback((product: Product, friend: Friend) => {
    if (currentGroup) {
      const newAssignment: GiftAssignment = {
        id: Date.now().toString(),
        product,
        fromFriendId: userId,
        toFriendId: friend.id,
        groupId: currentGroup.id,
        createdAt: new Date(),
        revealed: false
      }
      setGiftAssignments([...giftAssignments, newAssignment])

      // REMOVE aura/points increment here!
      // setUserStats({
      //   ...userStats, 
      //   points: newPoints, 
      //   aura: newAura
      // })

      setShowFriendSelection(false)
      nextProduct()
    }
  }, [currentGroup, userId, setGiftAssignments, setShowFriendSelection, nextProduct])

  const assignGiftToContinuousFriend = useCallback((product: Product, friend: Friend) => {
    if (currentGroup) {
      const newAssignment: GiftAssignment = {
        id: Date.now().toString(),
        product,
        fromFriendId: userId,
        toFriendId: friend.id,
        groupId: currentGroup.id,
        createdAt: new Date(),
        revealed: false
      }
      setGiftAssignments([...giftAssignments, newAssignment])
      setUserStats({...userStats, points: userStats.points + 5, aura: userStats.aura + 1})
    }
  }, [currentGroup, userId, setGiftAssignments, setUserStats])

  const skipProduct = useCallback(() => {
    nextProduct()
  }, [nextProduct])

  const completeDailyAssignment = useCallback(() => {
    // Only increment aura/points here
    setUserStats(prev => ({
      ...prev,
      aura: prev.aura + 10,
      points: prev.points + 10,
      dailyComplete: true,
      streak: prev.streak + 1
    }))
    setCurrentProductIndex(0)
    setIsInfiniteMode(true)
    setShowDailyComplete(false)
  }, [setUserStats, setCurrentProductIndex, setIsInfiniteMode, setShowDailyComplete])

  const navigateHome = useCallback(() => {
    setCurrentScreen('home')
  }, [setCurrentScreen])


  if (currentScreen === 'splash') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <ErrorBoundary colorScheme={colorScheme}>
          <SplashScreen colorScheme={colorScheme} onStart={() => setCurrentScreen('home')} />
        </ErrorBoundary>
      </div>
    )
  }

  if (currentScreen === 'home') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <ErrorBoundary colorScheme={colorScheme}>
          <HomePage 
            colorScheme={colorScheme}
            userStats={userStats}
            friendGroups={friendGroups}
            onNavigate={setCurrentScreen}
            onToggleColorScheme={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
          />
        </ErrorBoundary>
      </div>
    )
  }

  if (currentScreen === 'groups') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <GroupsScreen
          colorScheme={colorScheme}
          friendGroups={friendGroups}
          onNavigate={setCurrentScreen}
          onSelectGroup={setCurrentGroup}
          onToggleColorScheme={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
        />
      </div>
    )
  }

  if (currentScreen === 'create-group') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <CreateGroupScreen
          colorScheme={colorScheme}
          onNavigate={setCurrentScreen}
          onCreateGroup={createGroup}
          onToggleColorScheme={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
        />
      </div>
    )
  }

  if (currentScreen === 'join-group') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <JoinGroupScreen
          colorScheme={colorScheme}
          onNavigate={setCurrentScreen}
          onJoinGroup={joinGroup}
          onToggleColorScheme={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
          joinError={joinError}
        />
      </div>
    )
  }

  if (currentScreen === 'profile') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <ProfileScreen
          colorScheme={colorScheme}
          userStats={userStats}
          giftAssignments={giftAssignments}
          userId={userId}
          onNavigate={setCurrentScreen}
          onToggleColorScheme={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
        />
      </div>
    )
  }

  if (currentScreen === 'group-dashboard') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8`}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button 
                onClick={() => setCurrentScreen('groups')}
                className={`${colors.textPrimary} mr-4 text-xl`}
              >
                ← 
              </button>
              <h1 className={`text-2xl font-black ${colors.textPrimary}`}>
                {currentGroup?.name || 'Group Dashboard'}
              </h1>
            </div>
            <button
              onClick={() => setColorScheme(colorScheme === 'default' ? 'colorblind' : 'default')}
              className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105`}
            >
              <span className="text-lg">{colorScheme === 'default' ? '👁️' : '🔵'}</span>
            </button>
          </div>

          {currentGroup ? (
            <div className="space-y-6">
              <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-black ${colors.textPrimary} mb-1`}>Farm Code</h2>
                    <p className={`text-2xl font-bold ${colors.textAccent} tracking-wider`}>{currentGroup.code}</p>
                  </div>
                  <div className={`text-4xl`}>🐓</div>
                </div>
                <p className={`${colors.textSecondary} text-sm`}>Share this code with friends to invite them</p>
              </div>

              <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
                <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>Farm Members ({currentGroup.members.length})</h3>
                <div className="space-y-3">
                  {currentGroup.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${colors.primaryGradient} rounded-full flex items-center justify-center text-lg`}>
                          {member.avatar}
                        </div>
                        <div>
                          <p className={`font-bold ${colors.textPrimary}`}>{member.name}</p>
                          <p className={`text-sm ${colors.textSecondary}`}>{member.aura} aura</p>
                        </div>
                      </div>
                      {/* REMOVE the green check mark below */}
                      {/* {member.dailyComplete && (
                        <span className="text-green-500 text-lg">✅</span>
                      )} */}
                    </div>
                  ))}
                </div>
              </div>

              {!userStats.dailyComplete ? (
                <button 
                  onClick={() => setCurrentScreen('aura-farming')}
                  className={`w-full ${colors.primaryGradient} text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 active:scale-95 text-base`}
                  type="button"
                >
                  🌱 Start Farming Aura
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentScreen('continuous-aura-farm')}
                  className={`w-full ${colors.primaryGradient} text-white font-medium py-3 px-6 rounded-xl shadow-lg transition-all duration-300 active:scale-95 text-base`}
                  type="button"
                >
                  🌟 Continue Aura Farming
                </button>
              )}

              <button 
                onClick={() => setCurrentScreen('profile')}
                className={`w-full ${colors.glass} ${colors.textPrimary} font-medium py-2 px-4 rounded-xl ${colors.hover} transition-all duration-300 active:scale-95 text-sm shadow-lg`}
              >
                👤 View Profile
              </button>
            </div>
          ) : (
            <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl text-center`}>
              <div className="text-6xl mb-4">🤔</div>
              <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3`}>No Group Selected</h2>
              <p className={`${colors.textSecondary} text-lg mb-6`}>
                Please select a group to view the dashboard
              </p>
              <button 
                onClick={() => setCurrentScreen('groups')}
                className={`${colors.primaryGradient} text-white font-medium py-2 px-4 rounded-xl text-sm transition-all duration-300 active:scale-95`}
              >
                Back to Groups
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    )
  }

  if (currentScreen === 'aura-farming') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <AuraFarming
          colorScheme={colorScheme}
          currentProductIndex={currentProductIndex}
          showFriendSelection={showFriendSelection}
          showDailyComplete={showDailyComplete}
          showProductInfo={showProductInfo}
          currentGroup={currentGroup}
          dragPosition={dragPosition}
          dragStart={dragStart}
          isDragging={isDragging}
          dragTarget={dragTarget}
          userId={userId}
          onBack={() => setCurrentScreen(currentGroup ? 'group-dashboard' : 'groups')}
          onSkipProduct={skipProduct}
          onShowProductInfo={() => setShowProductInfo(true)}
          onCloseProductInfo={() => setShowProductInfo(false)}
          onCloseFriendSelection={() => setShowFriendSelection(false)}
          onAssignGift={assignGiftToFriend}
          onCompleteDailyAssignment={completeDailyAssignment}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onClearDragTarget={clearDragTarget}
          onNavigateHome={navigateHome}
        />
      </div>
    )
  }

  if (currentScreen === 'continuous-aura-farm') {
    return (
      <div className="relative">
        <div className={`floating-dots ${colorScheme === 'colorblind' ? 'colorblind' : ''}`}>
          <div className="dot-1"></div>
          <div className="dot-2"></div>
          <div className="dot-3"></div>
          <div className="dot-4"></div>
          <div className="dot-5"></div>
        </div>
        <ContinuousAuraFarm
          colorScheme={colorScheme}
          currentGroup={currentGroup}
          dragPosition={dragPosition}
          dragStart={dragStart}
          isDragging={isDragging}
          dragTarget={dragTarget}
          userId={userId}
          onBack={() => setCurrentScreen(currentGroup ? 'group-dashboard' : 'home')}
          onSkipProduct={skipProduct}
          onAssignGift={assignGiftToContinuousFriend}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onClearDragTarget={clearDragTarget}
        />
      </div>
    )
  }

  // Placeholder for remaining screens
  return (
    <div className="relative">
      <div className="floating-dots">
        <div className="dot-1"></div>
        <div className="dot-2"></div>
        <div className="dot-3"></div>
        <div className="dot-4"></div>
        <div className="dot-5"></div>
      </div>
      <div className={`min-h-screen ${colors.background} flex items-center justify-center`}>
        <div className="text-center">
          <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-4`}>Screen: {currentScreen}</h2>
          <button 
            onClick={() => setCurrentScreen('home')}
            className={`${colors.primaryGradient} text-white font-medium py-2 px-4 rounded-xl text-sm`}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}