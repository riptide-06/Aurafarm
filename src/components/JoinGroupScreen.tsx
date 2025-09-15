import {useState, useEffect} from 'react'
import type {ColorScheme} from '../types'
import {getColorClasses} from '../constants'

interface JoinGroupScreenProps {
  colorScheme: ColorScheme
  onNavigate: (screen: 'groups') => void
  onJoinGroup: (code: string) => void
  onToggleColorScheme: () => void
  joinError?: string
}

export function JoinGroupScreen({colorScheme, onNavigate, onJoinGroup, onToggleColorScheme, joinError}: JoinGroupScreenProps) {
  const colors = getColorClasses(colorScheme)
  const [groupCode, setGroupCode] = useState('')
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [showErrorPopup, setShowErrorPopup] = useState(!!joinError)

  // Show popup when joinError changes
  useEffect(() => {
    setShowErrorPopup(!!joinError)
  }, [joinError])

  return (
    <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8 transition-colors duration-500`}>
      <div className="max-w-md mx-auto relative">
        {/* Error Popup Modal */}
        {showErrorPopup && joinError && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setShowErrorPopup(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl px-6 py-6 relative max-w-xs w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowErrorPopup(false)}
                aria-label="Close"
              >
                ×
              </button>
              <div className="text-red-500 text-center font-bold text-lg">
                {joinError}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('groups')}
              className={`${colors.textPrimary} mr-4 text-xl`}
            >
              ←
            </button>
            <h1 className={`text-2xl font-black ${colors.textPrimary}`}>Join Group</h1>
          </div>
          <button
            onClick={onToggleColorScheme}
            className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105`}
          >
            <span className="text-lg">{colorScheme === 'default' ? '👁️' : '🔵'}</span>
          </button>
        </div>

        <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl mb-6`}>
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3`}>Join with Code</h2>
            <p className={`${colors.textSecondary} text-lg leading-relaxed`}>
              Enter the 6-letter code your friend shared with you
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block text-lg font-bold ${colors.textPrimary} mb-3`}>Group Code</label>
              <input
                type="text"
                value={groupCode}
                onChange={(e) => {
                  // Only allow letters and numbers
                  const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                  setGroupCode(filtered)
                }}
                placeholder="ABC123"
                maxLength={6}
                className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${colorScheme === 'colorblind' ? 'focus:ring-violet-200 focus:border-violet-400' : 'focus:ring-blue-200 focus:border-blue-400'} text-center text-lg font-bold tracking-widest`}
              />
            </div>

            <div className="relative">
              <button
                onMouseDown={() => {
                  if (groupCode.length === 6) {
                    setIsHolding(true)
                    setHoldProgress(0)
                    const interval = setInterval(() => {
                      setHoldProgress(prev => {
                        if (prev >= 100) {
                          clearInterval(interval)
                          setIsHolding(false)
                          onJoinGroup(groupCode)
                          return 0
                        }
                        return prev + 6.67
                      })
                    }, 100)
                  }
                }}
                onMouseUp={() => {
                  setIsHolding(false)
                  setHoldProgress(0)
                }}
                onMouseLeave={() => {
                  setIsHolding(false)
                  setHoldProgress(0)
                }}
                disabled={groupCode.length !== 6}
                className={`w-full ${colors.primaryGradient} text-white font-medium py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 text-base ${colors.hover} ${holdProgress > 80 ? 'animate-buzz' : ''} relative overflow-hidden`}
              >
                <div 
                  className={`absolute inset-0 ${colors.accentGradient} transition-all duration-100`}
                  style={{width: `${holdProgress}%`}}
                ></div>
                <span className="relative z-10">
                  {groupCode.length === 6 ? (isHolding ? 'Hold to Join...' : 'Hold to Join Squad') : 'Enter 6-Letter Code'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`${colors.glass} rounded-3xl p-6 shadow-xl`}>
          <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>Join a Group</h3>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👥</div>
            <p className={`${colors.textSecondary} text-lg`}>
              Enter a group code to join your friends' farm
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}