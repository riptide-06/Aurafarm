import type {ColorScheme, FriendGroup} from '../types'
import {getColorClasses} from '../constants'

interface GroupsScreenProps {
  colorScheme: ColorScheme
  friendGroups: FriendGroup[]
  onNavigate: (screen: 'home' | 'create-group' | 'join-group' | 'group-dashboard') => void
  onSelectGroup: (group: FriendGroup) => void
  onToggleColorScheme: () => void
}

export function GroupsScreen({colorScheme, friendGroups, onNavigate, onSelectGroup, onToggleColorScheme}: GroupsScreenProps) {
  const colors = getColorClasses(colorScheme)

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
            <h1 className={`text-2xl font-black ${colors.textPrimary}`}>Aura Farms</h1>
          </div>
          <button
            onClick={onToggleColorScheme}
            className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105`}
          >
            <span className="text-lg">{colorScheme === 'default' ? '👁️' : '🔵'}</span>
          </button>
        </div>

        <div className="space-y-5 mb-8">
          <button 
            onClick={() => onNavigate('create-group')}
            onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
            onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
            className={`w-full ${colors.primaryGradient} text-white font-bold py-6 px-8 rounded-3xl shadow-xl transition-all duration-500 active:scale-95 ${colors.hover} text-xl`}
          >
            🐓 Create New Farm
          </button>
          
          <button 
            onClick={() => onNavigate('join-group')}
            onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
            onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
            className={`w-full ${colors.glass} ${colors.textPrimary} font-bold py-6 px-8 rounded-3xl ${colors.hover} transition-all duration-500 active:scale-95 text-xl shadow-xl`}
          >
            🔗 Join Farm with Code
          </button>
        </div>

        {friendGroups.length === 0 ? (
          <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl text-center transition-all duration-500`}>
            <div className="text-6xl mb-4">👥</div>
            <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3 transition-colors duration-500`}>No Farms Yet</h2>
            <p className={`${colors.textSecondary} text-lg mb-6 leading-relaxed transition-colors duration-500`}>
              Create or join an aura farm to cultivate aura together with your friends
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => onNavigate('create-group')}
                className={`w-full ${colors.primaryGradient} text-white font-bold py-4 px-6 rounded-2xl text-lg ${colors.hover} transition-all duration-500`}
              >
                Start Your First Farm
              </button>
              <p className="text-gray-500 text-sm">or ask a friend for their farm code</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className={`text-xl font-black ${colors.textPrimary} mb-4`}>Your Farms</h2>
            {friendGroups.map(group => (
              <button
                key={group.id}
                onClick={() => {
                  onSelectGroup(group)
                  onNavigate('group-dashboard')
                }}
                className={`w-full ${colors.glass} rounded-3xl p-6 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 active:scale-98 hover:scale-102`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xl font-black ${colors.textPrimary}`}>{group.name}</span>
                  <span className={`text-sm ${colors.textSecondary} font-bold`}>{group.members.length} members</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${colors.textSecondary} font-semibold`}>Code: {group.code}</span>
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map(member => (
                      <div key={member.id} className={`w-8 h-8 ${colors.primaryGradient} rounded-full flex items-center justify-center text-sm border-3 border-white font-bold`}>
                        {member.avatar}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}