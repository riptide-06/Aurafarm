import {useState} from 'react'
import type {ColorScheme} from '../types'
import {getColorClasses} from '../constants'

interface CreateGroupScreenProps {
  colorScheme: ColorScheme
  onNavigate: (screen: 'groups') => void
  onCreateGroup: (name: string) => void
  onToggleColorScheme: () => void
}

export function CreateGroupScreen({colorScheme, onNavigate, onCreateGroup, onToggleColorScheme}: CreateGroupScreenProps) {
  const colors = getColorClasses(colorScheme)
  const [groupName, setGroupName] = useState('')

  return (
    <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8 transition-colors duration-500`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('groups')}
              className={`${colors.textPrimary} mr-4 text-xl`}
            >
              ←
            </button>
            <h1 className={`text-2xl font-black ${colors.textPrimary}`}>Create Group</h1>
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
            <div className="text-6xl mb-4">🐓</div>
            <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3`}>Create an Aura Farm</h2>
            <p className={`${colors.textSecondary} text-lg leading-relaxed`}>
              Start a farm where you and your friends can cultivate aura together through daily product curation
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block text-lg font-bold ${colors.textPrimary} mb-3`}>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Squad Goals, Best Friends, etc."
                className={`w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${colorScheme === 'colorblind' ? 'focus:ring-violet-200 focus:border-violet-400' : 'focus:ring-blue-200 focus:border-blue-400'} text-base font-medium`}
              />
            </div>

            <button
              onClick={() => groupName.trim() && onCreateGroup(groupName)}
              onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
              onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
              disabled={!groupName.trim()}
              className={`w-full ${colors.primaryGradient} text-white font-medium py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 text-base ${colors.hover}`}
            >
              Create Farm & Invite Friends
            </button>
          </div>
        </div>

        <div className={`${colors.glass} rounded-3xl p-6 shadow-xl`}>
          <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>How it works:</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>1</div>
              <p className={`${colors.textSecondary} font-medium`}>Share your farm code with friends</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>2</div>
              <p className={`${colors.textSecondary} font-medium`}>Farm aura together by curating products</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>3</div>
              <p className={`${colors.textSecondary} font-medium`}>Build collective aura and level up together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}