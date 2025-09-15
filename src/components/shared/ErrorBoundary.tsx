import React from 'react'
import type {ColorScheme} from '../../types'
import {getColorClasses} from '../../constants'

interface ErrorBoundaryProps {
  children: React.ReactNode
  colorScheme: ColorScheme
  fallback?: React.ComponentType<{error: Error; retry: () => void}>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('VibeBarn Error Boundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      const colors = getColorClasses(this.props.colorScheme)
      
      return (
        <div className={`min-h-screen ${colors.background} flex items-center justify-center p-6`}>
          <div className={`${colors.glass} rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-auto`}>
            <div className="text-6xl mb-4">😵</div>
            <h2 className={`text-2xl font-black ${colors.textPrimary} mb-3`}>
              Oops! Something went wrong
            </h2>
            <p className={`${colors.textSecondary} text-lg mb-6 leading-relaxed`}>
              Don't worry, your aura is still safe. Let's try again!
            </p>
            <button
              onClick={this.retry}
              className={`${colors.primaryGradient} text-white font-bold py-4 px-6 rounded-2xl transition-all duration-500 active:scale-95 hover:scale-105`}
            >
              🔄 Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}