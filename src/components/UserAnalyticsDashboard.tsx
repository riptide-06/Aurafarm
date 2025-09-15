import React, {useState, useCallback} from 'react'
import {useUserAnalytics} from '../hooks'
import {getColorClasses} from '../constants'
import type {ColorScheme} from '../types'

interface UserAnalyticsDashboardProps {
  colorScheme: ColorScheme
  showDetailedStats?: boolean
  showSessionData?: boolean
}

export function UserAnalyticsDashboard({
  colorScheme,
  showDetailedStats = true,
  showSessionData = true
}: UserAnalyticsDashboardProps) {
  const colors = getColorClasses(colorScheme)
  const {
    currentSession,
    analyticsSummary,
    clearAnalytics,
    isTracking
  } = useUserAnalytics()
  
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'events'>('overview')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const formatDuration = useCallback((milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }, [])

  const formatPercentage = useCallback((value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }, [])

  const handleClearAnalytics = useCallback(() => {
    clearAnalytics()
    setShowConfirmation(false)
  }, [clearAnalytics])

  if (!isTracking) {
    return (
      <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl text-center`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className={`text-xl font-bold ${colors.textPrimary} mb-2`}>
          Analytics Not Available
        </h3>
        <p className={`${colors.textSecondary}`}>
          Start interacting with the app to see your analytics data.
        </p>
      </div>
    )
  }

  return (
    <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-black ${colors.textPrimary} mb-1`}>
            📊 Your Analytics
          </h3>
          <p className={`text-sm ${colors.textSecondary}`}>
            Track your app usage and behavior patterns
          </p>
        </div>
        
        <button
          onClick={() => setShowConfirmation(true)}
          className={`p-2 ${colors.cardBg} rounded-xl ${colors.textSecondary} hover:${colors.primaryGradient} hover:text-white transition-all duration-200`}
          aria-label="Clear analytics data"
        >
          🗑️
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {['overview', 'sessions', 'events'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? `${colors.primaryGradient} text-white`
                : `${colors.cardBg} ${colors.textSecondary} hover:${colors.primaryGradient} hover:text-white`
            }`}
          >
            {tab === 'overview' && '📈 Overview'}
            {tab === 'sessions' && '⏱️ Sessions'}
            {tab === 'events' && '🎯 Events'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`${colors.cardBg} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${colors.textAccent}`}>
                {analyticsSummary.totalSessions}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Total Sessions</div>
            </div>
            
            <div className={`${colors.cardBg} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${colors.textAccent}`}>
                {analyticsSummary.totalEvents}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Total Events</div>
            </div>
            
            <div className={`${colors.cardBg} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${colors.textAccent}`}>
                {formatDuration(analyticsSummary.averageSessionDuration)}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Avg Session</div>
            </div>
            
            <div className={`${colors.cardBg} rounded-2xl p-4 text-center`}>
              <div className={`text-2xl font-bold ${colors.textAccent}`}>
                {formatPercentage(analyticsSummary.conversionRate)}
              </div>
              <div className={`text-xs ${colors.textSecondary}`}>Conversion</div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className={`${colors.cardBg} rounded-2xl p-4`}>
            <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Engagement Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Average Scroll Depth</span>
                <span className={`font-bold ${colors.textAccent}`}>
                  {Math.round(analyticsSummary.averageScrollDepth)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Average Time Spent</span>
                <span className={`font-bold ${colors.textAccent}`}>
                  {formatDuration(analyticsSummary.averageTimeSpent)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-sm ${colors.textSecondary}`}>Error Rate</span>
                <span className={`font-bold ${colors.textAccent}`}>
                  {formatPercentage(analyticsSummary.errorRate)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          {analyticsSummary.mostViewedCategories.length > 0 && (
            <div className={`${colors.cardBg} rounded-2xl p-4`}>
              <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Most Viewed Categories</h4>
              <div className="space-y-2">
                {analyticsSummary.mostViewedCategories.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-sm ${colors.textSecondary}`}>{category.category}</span>
                    <span className={`font-bold ${colors.textAccent}`}>{category.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performing Screens */}
          {analyticsSummary.topPerformingScreens.length > 0 && (
            <div className={`${colors.cardBg} rounded-2xl p-4`}>
              <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Top Performing Screens</h4>
              <div className="space-y-2">
                {analyticsSummary.topPerformingScreens.map((screen, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-sm ${colors.textSecondary}`}>{screen.screenName}</span>
                    <span className={`font-bold ${colors.textAccent}`}>{screen.engagement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && showSessionData && (
        <div className="space-y-4">
          {/* Current Session */}
          {currentSession && (
            <div className={`${colors.cardBg} rounded-2xl p-4`}>
              <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Current Session</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Session ID:</span>
                  <span className={colors.textPrimary}>{currentSession.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Started:</span>
                  <span className={colors.textPrimary}>
                    {currentSession.startTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Time Spent:</span>
                  <span className={colors.textAccent}>
                    {formatDuration(currentSession.totalTimeSpent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Scroll Depth:</span>
                  <span className={colors.textAccent}>
                    {currentSession.totalScrollDepth}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.textSecondary}>Events:</span>
                  <span className={colors.textPrimary}>
                    {currentSession.events.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Session History */}
          <div className={`${colors.cardBg} rounded-2xl p-4`}>
            <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Recent Sessions</h4>
            <div className="space-y-3">
              {analyticsSummary.totalSessions > 0 ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">📱</div>
                  <p className={`${colors.textSecondary} text-sm`}>
                    {analyticsSummary.totalSessions} sessions tracked
                  </p>
                  <p className={`${colors.textSecondary} text-xs`}>
                    Detailed session data available in localStorage
                  </p>
                </div>
              ) : (
                <p className={`${colors.textSecondary} text-center py-4`}>
                  No completed sessions yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className={`${colors.cardBg} rounded-2xl p-4`}>
          <h4 className={`font-bold ${colors.textPrimary} mb-3`}>Event Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${colors.textSecondary}`}>Total Events</span>
              <span className={`font-bold ${colors.textAccent}`}>
                {analyticsSummary.totalEvents}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${colors.textSecondary}`}>Events This Session</span>
              <span className={`font-bold ${colors.textAccent}`}>
                {currentSession?.events.length || 0}
              </span>
            </div>
            
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎯</div>
              <p className={`${colors.textSecondary} text-sm`}>
                Events are automatically tracked as you use the app
              </p>
              <p className={`${colors.textSecondary} text-xs`}>
                Including clicks, views, cart actions, and more
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clear Analytics Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${colors.cardBg} rounded-3xl p-6 max-w-sm w-full`}>
            <h4 className={`text-lg font-bold ${colors.textPrimary} mb-4`}>
              Clear Analytics Data?
            </h4>
            <p className={`${colors.textSecondary} mb-6`}>
              This will permanently delete all your analytics data including sessions, events, and preferences. This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className={`flex-1 py-3 px-4 ${colors.cardBg} ${colors.textSecondary} rounded-xl font-medium`}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAnalytics}
                className={`flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium`}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
