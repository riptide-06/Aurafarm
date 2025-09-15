import React, {useState, useCallback} from 'react'
import {
  TrackingProvider,
  useTracking,
  TrackedButton,
  TrackedForm,
  TrackedInput
} from './TrackingProvider'
import {UserAnalyticsDashboard} from './UserAnalyticsDashboard'
import {PersonalizedRecommendations} from './PersonalizedRecommendations'
import {getColorClasses} from '../constants'
import type {ColorScheme} from '../types'

interface TrackingDemoProps {
  colorScheme: ColorScheme
}

// Example component using the useTracking hook
function TrackingExample({colorScheme}: {colorScheme: ColorScheme}) {
  const colors = getColorClasses(colorScheme)
  const {trackButton, trackForm, trackError} = useTracking('tracking-example')
  const [formData, setFormData] = useState({name: '', email: ''})
  const [showError, setShowError] = useState(false)

  const handleCustomTracking = useCallback(() => {
    trackButton('custom-button', 'Custom Tracked Button', 'demo')
  }, [trackButton])

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      setShowError(true)
      trackError('Form validation failed', 'validation_error', 'demo-form')
      return
    }
    
    trackForm('demo-form', 'form', 'submit')
    setShowError(false)
    setFormData({name: '', email: ''})
  }, [formData, trackForm, trackError])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}))
  }, [])

  return (
    <div className={`${colors.cardBg} rounded-2xl p-6`}>
      <h3 className={`text-lg font-bold ${colors.textPrimary} mb-4`}>
        🎯 Tracking Example Component
      </h3>
      
      <div className="space-y-4">
        {/* Custom tracked button */}
        <TrackedButton
          buttonId="custom-tracked-button"
          buttonText="Custom Tracked Button"
          context="demo"
          onClick={handleCustomTracking}
          className={`${colors.primaryGradient} text-white px-4 py-2 rounded-xl font-medium`}
        >
          Click to Track
        </TrackedButton>

        {/* Manual tracking button */}
        <button
          onClick={handleCustomTracking}
          className={`${colors.cardBg} ${colors.textPrimary} px-4 py-2 rounded-xl font-medium border ${colors.border}`}
        >
          Manual Tracking
        </button>

        {/* Tracked form */}
        <TrackedForm
          formId="demo-form"
          onSubmit={handleFormSubmit}
          className="space-y-4"
        >
          <div>
            <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
              Name
            </label>
            <TrackedInput
              formId="demo-form"
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 rounded-xl ${colors.cardBg} ${colors.textPrimary} border ${colors.border}`}
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
              Email
            </label>
            <TrackedInput
              formId="demo-form"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 rounded-xl ${colors.cardBg} ${colors.textPrimary} border ${colors.border}`}
              placeholder="Enter your email"
            />
          </div>

          {showError && (
            <div className={`text-red-500 text-sm p-3 ${colors.cardBg} rounded-xl`}>
              Please fill in all fields
            </div>
          )}

          <TrackedButton
            buttonId="submit-form"
            buttonText="Submit Form"
            context="demo-form"
            type="submit"
            className={`w-full ${colors.primaryGradient} text-white py-2 rounded-xl font-medium`}
          >
            Submit
          </TrackedButton>
        </TrackedForm>
      </div>
    </div>
  )
}

// Main demo component
export function TrackingDemo({colorScheme}: TrackingDemoProps) {
  const colors = getColorClasses(colorScheme)
  const [activeSection, setActiveSection] = useState<'overview' | 'components' | 'analytics' | 'recommendations'>('overview')

  const sections = [
    {id: 'overview', label: '📊 Overview', icon: '📊'},
    {id: 'components', label: '🎯 Components', icon: '🎯'},
    {id: 'analytics', label: '📈 Analytics', icon: '📈'},
    {id: 'recommendations', label: '🌟 Recommendations', icon: '🌟'}
  ]

  return (
    <TrackingProvider screenName="tracking-demo" trackPageView={true}>
      <div className="min-h-screen p-4 space-y-6">
        {/* Header */}
        <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
          <h1 className={`text-3xl font-black ${colors.textPrimary} mb-2`}>
            🚀 Tracking & Analytics Demo
          </h1>
          <p className={`${colors.textSecondary}`}>
            Explore the comprehensive tracking system and personalized recommendations
          </p>
        </div>

        {/* Navigation */}
        <div className={`${colors.glass} rounded-3xl p-4 shadow-2xl`}>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeSection === section.id
                    ? `${colors.primaryGradient} text-white`
                    : `${colors.cardBg} ${colors.textSecondary} hover:${colors.primaryGradient} hover:text-white`
                }`}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
            <h2 className={`text-2xl font-bold ${colors.textPrimary} mb-4`}>
              🎯 What's Being Tracked
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${colors.cardBg} rounded-2xl p-4`}>
                <h3 className={`font-bold ${colors.textPrimary} mb-3`}>User Interactions</h3>
                <ul className={`${colors.textSecondary} space-y-2 text-sm`}>
                  <li>• Button clicks and form interactions</li>
                  <li>• Product views and cart actions</li>
                  <li>• Screen views and page navigation</li>
                  <li>• Scroll behavior and time spent</li>
                  <li>• Search queries and category browsing</li>
                </ul>
              </div>
              
              <div className={`${colors.cardBg} rounded-2xl p-4`}>
                <h3 className={`font-bold ${colors.textPrimary} mb-3`}>Performance Metrics</h3>
                <ul className={`${colors.textSecondary} space-y-2 text-sm`}>
                  <li>• Page load times</li>
                  <li>• Component render times</li>
                  <li>• Time to first interaction</li>
                  <li>• Session duration tracking</li>
                  <li>• Error rates and debugging</li>
                </ul>
              </div>
              
              <div className={`${colors.cardBg} rounded-2xl p-4`}>
                <h3 className={`font-bold ${colors.textPrimary} mb-3`}>Personalization</h3>
                <ul className={`${colors.textSecondary} space-y-2 text-sm`}>
                  <li>• Purchase history analysis</li>
                  <li>• Category preferences</li>
                  <li>• Price range preferences</li>
                  <li>• Brand preferences</li>
                  <li>• Shopping frequency patterns</li>
                </ul>
              </div>
              
              <div className={`${colors.cardBg} rounded-2xl p-4`}>
                <h3 className={`font-bold ${colors.textPrimary} mb-3`}>Analytics Features</h3>
                <ul className={`${colors.textSecondary} space-y-2 text-sm`}>
                  <li>• Real-time session tracking</li>
                  <li>• Comprehensive event logging</li>
                  <li>• User behavior insights</li>
                  <li>• Conversion rate analysis</li>
                  <li>• Mobile-optimized dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'components' && (
          <div className="space-y-6">
            <TrackingExample colorScheme={colorScheme} />
            
            <div className={`${colors.glass} rounded-3xl p-6 shadow-2xl`}>
              <h3 className={`text-lg font-bold ${colors.textPrimary} mb-4`}>
                🔧 How to Use Tracking
              </h3>
              
              <div className="space-y-4">
                <div className={`${colors.cardBg} rounded-2xl p-4`}>
                  <h4 className={`font-bold ${colors.textPrimary} mb-2`}>1. Wrap with TrackingProvider</h4>
                  <pre className={`text-xs ${colors.textSecondary} bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto`}>
{`<TrackingProvider screenName="my-screen">
  <MyComponent />
</TrackingProvider>`}
                  </pre>
                </div>
                
                <div className={`${colors.cardBg} rounded-2xl p-4`}>
                  <h4 className={`font-bold ${colors.textPrimary} mb-2`}>2. Use the useTracking hook</h4>
                  <pre className={`text-xs ${colors.textSecondary} bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto`}>
{`const { trackButton, trackForm } = useTracking('my-screen')

const handleClick = () => {
  trackButton('my-button', 'Click Me', 'demo')
}`}
                  </pre>
                </div>
                
                <div className={`${colors.cardBg} rounded-2xl p-4`}>
                  <h4 className={`font-bold ${colors.textPrimary} mb-2`}>3. Use pre-built tracked components</h4>
                  <pre className={`text-xs ${colors.textSecondary} bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto`}>
{`<TrackedButton
  buttonId="submit"
  buttonText="Submit"
  context="form"
  onClick={handleSubmit}
>
  Submit
</TrackedButton>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'analytics' && (
          <UserAnalyticsDashboard 
            colorScheme={colorScheme}
            showDetailedStats={true}
            showSessionData={true}
          />
        )}

        {activeSection === 'recommendations' && (
          <PersonalizedRecommendations
            colorScheme={colorScheme}
            maxItems={4}
            showReasons={true}
            showFilters={true}
          />
        )}
      </div>
    </TrackingProvider>
  )
}
