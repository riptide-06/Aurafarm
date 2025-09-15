import type {ColorScheme} from '../types'
import {getColorClasses} from '../constants'

interface SplashScreenProps {
  colorScheme: ColorScheme
  onStart: () => void
}

export function SplashScreen({colorScheme, onStart}: SplashScreenProps) {
  const colors = getColorClasses(colorScheme)

  return (
    <div className={`min-h-screen ${colors.background} flex items-center justify-center relative overflow-hidden transition-colors duration-500`}>
      <div className="text-center animate-bounce-in z-10 relative">
        <div className="mb-16">
          <h1 className={`text-7xl font-black bg-gradient-to-r ${colors.logoGradient} bg-clip-text text-transparent mb-8`}>
            AuraFarm
          </h1>
          <p className={`${colors.textSecondary} text-2xl font-bold transition-colors duration-500 mb-8`}>Farm aura, gift friends</p>
        </div>
        
        {/* Feature showcase */}
        <div className="mb-16 flex justify-center space-x-8">
          <div className="text-center p-4 animate-float" style={{animationDelay: '0s'}}>
            <div className="text-3xl mb-2">🎁</div>
            <div className={`text-sm font-bold ${colors.textPrimary}`}>Gift</div>
          </div>
          <div className="text-center p-4 animate-float" style={{animationDelay: '0.3s'}}>
            <div className="text-3xl mb-2">👥</div>
            <div className={`text-sm font-bold ${colors.textPrimary}`}>Friends</div>
          </div>
          <div className="text-center p-4 animate-float" style={{animationDelay: '0.6s'}}>
            <div className="text-3xl mb-2">✨</div>
            <div className={`text-sm font-bold ${colors.textPrimary}`}>Aura</div>
          </div>
        </div>
        
        <button
          onClick={onStart}
          onMouseDown={(e) => e.currentTarget.classList.add('animate-click')}
          onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-click')}
          className={`${colors.primaryGradient} text-white font-black py-8 px-16 rounded-full shadow-2xl transition-all duration-500 active:scale-95 hover:scale-110 text-2xl border border-white/30 relative overflow-hidden group`}
        >
          <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <span className="relative z-10">Start AuraFarming ✨</span>
        </button>
        
        <div className={`mt-8 ${colors.textSecondary} text-sm font-medium opacity-70`}>
          Swipe • Drag • Gift • Earn
        </div>
      </div>
    </div>
  )
}