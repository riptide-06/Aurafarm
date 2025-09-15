import type { ColorScheme, UserStats, FriendGroup, Screen } from "../types";
import { getColorClasses } from "../constants";
import { useState, useEffect } from "react";

interface HomePageProps {
  colorScheme: ColorScheme;
  userStats: UserStats;
  friendGroups: FriendGroup[];
  onNavigate: (screen: Screen) => void;
  onToggleColorScheme: () => void;
}

export function HomePage({
  colorScheme,
  userStats,
  friendGroups,
  onNavigate,
  onToggleColorScheme,
}: HomePageProps) {
  const colors = getColorClasses(colorScheme)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(Math.floor(userStats.aura / 20) + 1)
  
  // Check for level up
  useEffect(() => {
    const newLevel = Math.floor(userStats.aura / 20) + 1
    if (newLevel > currentLevel) {
      setCurrentLevel(newLevel)
      setShowLevelUp(true)
      // Hide level up celebration after 3 seconds
      setTimeout(() => setShowLevelUp(false), 3000)
    }
  }, [userStats.aura, currentLevel])

  return (
    <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8 transition-colors duration-500`}>
      <div className="max-w-md mx-auto">
        {/* Level Up Celebration */}
        {showLevelUp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl animate-bounce-in mx-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Level Up!</h2>
              <p className="text-xl text-gray-600 font-bold">You're now Level {currentLevel}!</p>
              <div className="mt-4 text-sm text-gray-500">Keep farming aura to level up more!</div>
            </div>
          </div>
        )}
        <div className="text-center mb-12">
          <h1
            className={`text-4xl font-black bg-gradient-to-r ${colors.logoGradient} bg-clip-text text-transparent mb-3 transition-all duration-500`}
          >
            AuraFarm
          </h1>
          <p
            className={`${colors.textSecondary} text-lg font-medium transition-colors duration-500`}
          >
            Farm aura, gift friends
          </p>
        </div>

        <div className="absolute top-4 right-6">
          <button
            onClick={onToggleColorScheme}
            className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105`}
          >
            <span className="text-lg">
              {colorScheme === "default" ? "👁️" : "🔵"}
            </span>
          </button>
        </div>

        <div
          className={`${colors.glass} rounded-3xl p-6 mb-8 shadow-2xl transition-all duration-500`}
        >
          <div className="flex justify-between items-center mb-4">
            <span
              className={`text-lg font-bold ${colors.textPrimary} transition-colors duration-500`}
            >
              Your Aura
            </span>
            <span
              className={`text-sm ${colors.textSecondary} font-semibold transition-colors duration-500`}
            >
              {userStats.points} pts
            </span>
          </div>
          
          {/* Progress Section - Left side */}
          <div className="flex items-center space-x-6">
            <div className="flex-1">
              <div
                className={`flex justify-between text-sm ${colors.textSecondary} mb-2 font-medium transition-colors duration-500`}
              >
                <span>Level {currentLevel}</span>
                <span>{userStats.aura % 20}/20 to next level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                <div
                  className={`${colors.primaryGradient} h-4 rounded-full transition-all duration-700`}
                  style={{ width: `${Math.min((userStats.aura % 20) * 5, 100)}%` }}
                ></div>
                {/* Level markers */}
                <div className="absolute inset-0 flex justify-between items-center px-1">
                  {[0, 5, 10, 15, 20].map((mark) => (
                    <div 
                      key={mark}
                      className={`w-1 h-2 rounded-full ${
                        userStats.aura % 20 >= mark ? 'bg-white' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Streak Section - Right side with proper spacing */}
            <div className="text-center flex-shrink-0 ml-4">
              <div
                className={`text-2xl font-black ${colors.textAccent} transition-colors duration-500`}
              >
                {userStats.streak}
              </div>
              <div
                className={`text-xs ${colors.textSecondary} font-semibold transition-colors duration-500`}
              >
                STREAK
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {!userStats.dailyComplete ? (
            <button
              onClick={() => onNavigate("aura-farming")}
              onMouseDown={(e) =>
                e.currentTarget.classList.add("animate-click")
              }
              onAnimationEnd={(e) =>
                e.currentTarget.classList.remove("animate-click")
              }
              className={`w-full ${colors.secondaryGradient} text-white font-bold py-6 px-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 active:scale-95 ${colors.hover} text-xl`}
            >
              ✨ Daily Aura Farming
            </button>
          ) : (
            <button
              onClick={() => onNavigate("continuous-aura-farm")}
              onMouseDown={(e) =>
                e.currentTarget.classList.add("animate-click")
              }
              onAnimationEnd={(e) =>
                e.currentTarget.classList.remove("animate-click")
              }
              className={`w-full ${colors.accentGradient} text-white font-bold py-6 px-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 active:scale-95 hover:from-pink-500 hover:to-orange-500 text-xl`}
            >
              🌟 Aura Farm
            </button>
          )}

          <button
            onClick={() => onNavigate("groups")}
            onMouseDown={(e) => e.currentTarget.classList.add("animate-click")}
            onAnimationEnd={(e) =>
              e.currentTarget.classList.remove("animate-click")
            }
            className={`w-full ${colors.primaryGradient} text-white font-bold py-6 px-8 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 active:scale-95 ${colors.hover} text-xl`}
          >
            🐓 Aura Farms
          </button>

          <button
            onClick={() => onNavigate("profile")}
            onMouseDown={(e) => e.currentTarget.classList.add("animate-click")}
            onAnimationEnd={(e) =>
              e.currentTarget.classList.remove("animate-click")
            }
            className={`w-full ${colors.glass} ${colors.textPrimary} font-bold py-6 px-8 rounded-3xl border-3 ${colors.border} ${colors.hover} transition-all duration-500 active:scale-95 text-xl shadow-xl`}
          >
            👤 Profile
          </button>
        </div>

        <div className="mt-12 text-center">
          <div
            className={`${colors.textSecondary} text-sm font-medium transition-colors duration-500`}
          >
            {friendGroups.length > 0
              ? `${friendGroups.length} farms joined`
              : "Join your first farm to start cultivating aura"}
          </div>
        </div>
      </div>
    </div>
  );
}
