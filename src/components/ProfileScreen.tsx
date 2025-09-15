import type {ColorScheme, UserStats, GiftAssignment} from '../types'
import {getColorClasses} from '../constants'

interface ProfileScreenProps {
  colorScheme: ColorScheme
  userStats: UserStats
  giftAssignments: GiftAssignment[]
  userId: string
  onNavigate: (screen: 'home' | 'aura-farming') => void
  onToggleColorScheme: () => void
}

export function ProfileScreen({colorScheme, userStats, giftAssignments, userId, onNavigate, onToggleColorScheme}: ProfileScreenProps) {
  const colors = getColorClasses(colorScheme)
  const level = Math.floor(userStats.aura / 20) + 1

  return (
    <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8 transition-colors duration-500`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('home')}
              className={`${colors.textPrimary} mr-4 text-xl`}
            >
              ←
            </button>
            <h1 className={`text-2xl font-black ${colors.textPrimary}`}>Profile</h1>
          </div>
          <button
            onClick={onToggleColorScheme}
            className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105`}
          >
            <span className="text-lg">{colorScheme === 'default' ? '👁️' : '🔵'}</span>
          </button>
        </div>

        <div className={`${colors.glass} rounded-3xl p-8 mb-6 shadow-2xl text-center`}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-4xl shadow-lg">
              👤
            </div>
            <div>
              <h2 className={`text-2xl font-black ${colors.textPrimary}`}>{userStats.badges?.includes('New Member') ? 'New Member' : 'Member'}</h2>
              <p className={`text-lg ${colors.textSecondary}`}>Level {level}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={`text-sm ${colors.textSecondary}`}>Points</p>
              <p className={`text-2xl font-bold ${colors.textAccent}`}>{userStats.aura}</p>
            </div>
            <div>
              <p className={`text-sm ${colors.textSecondary}`}>Streak</p>
              <p className={`text-2xl font-bold ${colors.textAccent}`}>{userStats.streak} days</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border-2 border-gray-200">
            <div className={`text-lg font-black ${colors.textPrimary} mb-3`}>Aura Progress</div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className={`${colors.primaryGradient} h-3 rounded-full transition-all duration-700`}
                style={{width: `${(userStats.aura % 20) * 5}%`}}
              ></div>
            </div>
            <div className={`text-sm ${colors.textAccent} font-bold mt-2`}>{userStats.aura % 20}/20 to next level</div>
          </div>
        </div>

        {/* Badge Collection and Today's Challenge sections removed */}
      </div>
    </div>
  )
}