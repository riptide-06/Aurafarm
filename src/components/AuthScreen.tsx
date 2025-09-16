import { useState } from 'react';
import type { ColorScheme } from '../types';
import { getColorClasses } from '../constants';

interface AuthScreenProps {
  colorScheme: ColorScheme;
  onAuthenticate: (userData: {
    shopifyCustomerId: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
  }) => Promise<void>;
  onToggleColorScheme: () => void;
  loading?: boolean;
  error?: string | null;
}

export function AuthScreen({ 
  colorScheme, 
  onAuthenticate, 
  onToggleColorScheme, 
  loading = false, 
  error = null 
}: AuthScreenProps) {
  const colors = getColorClasses(colorScheme);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    displayName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return;
    }

    // Generate a demo Shopify customer ID
    const shopifyCustomerId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await onAuthenticate({
      shopifyCustomerId,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: formData.displayName || `${formData.firstName} ${formData.lastName}`,
    });
  };

  return (
    <div className={`min-h-screen ${colors.background} pt-12 px-6 pb-8 transition-colors duration-500`}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className={`text-2xl font-black ${colors.textPrimary}`}>Welcome to AuraFarm</h1>
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
            <div className="text-6xl mb-4">🌱</div>
            <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3`}>Join the Farm</h2>
            <p className={`${colors.textSecondary} text-lg leading-relaxed`}>
              Create your account to start farming aura with friends
            </p>
          </div>

          {error && (
            <div className={`${colors.glass} rounded-2xl p-4 mb-6 border-l-4 border-red-500`}>
              <p className={`text-red-600 font-medium`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  className={`w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${
                    colorScheme === 'colorblind' 
                      ? 'focus:ring-violet-200 focus:border-violet-400' 
                      : 'focus:ring-blue-200 focus:border-blue-400'
                  } text-sm`}
                />
              </div>
              <div>
                <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  className={`w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${
                    colorScheme === 'colorblind' 
                      ? 'focus:ring-violet-200 focus:border-violet-400' 
                      : 'focus:ring-blue-200 focus:border-blue-400'
                  } text-sm`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className={`w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${
                  colorScheme === 'colorblind' 
                    ? 'focus:ring-violet-200 focus:border-violet-400' 
                    : 'focus:ring-blue-200 focus:border-blue-400'
                } text-sm`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold ${colors.textPrimary} mb-2`}>
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="How should others see you?"
                className={`w-full px-3 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 ${
                  colorScheme === 'colorblind' 
                    ? 'focus:ring-violet-200 focus:border-violet-400' 
                    : 'focus:ring-blue-200 focus:border-blue-400'
                } text-sm`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
              className={`w-full ${colors.primaryGradient} text-white font-medium py-3 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95 text-base ${colors.hover}`}
            >
              {loading ? 'Creating Account...' : 'Start Farming'}
            </button>
          </form>
        </div>

        <div className={`${colors.glass} rounded-3xl p-6 shadow-xl`}>
          <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>What is AuraFarm?</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>1</div>
              <p className={`${colors.textSecondary} font-medium`}>Create or join aura farms with friends</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>2</div>
              <p className={`${colors.textSecondary} font-medium`}>Farm aura by curating products together</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colors.primaryGradient} rounded-full flex items-center justify-center text-white text-sm font-bold`}>3</div>
              <p className={`${colors.textSecondary} font-medium`}>Build collective aura and level up together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
