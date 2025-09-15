import React, {useEffect, useCallback, ReactNode} from 'react'
import {useUserAnalytics} from '../hooks'

interface TrackingProviderProps {
  children: ReactNode
  screenName?: string
  trackPageView?: boolean
  trackScroll?: boolean
  trackPerformance?: boolean
  className?: string
}

export function TrackingProvider({
  children,
  screenName,
  trackPageView = true,
  trackScroll = true,
  trackPerformance = true,
  className = ''
}: TrackingProviderProps) {
  const {
    trackScreenView,
    trackPageView: trackPageViewFn,
    trackPerformance: trackPerformanceFn
  } = useUserAnalytics()

  // Track screen view when component mounts
  useEffect(() => {
    if (screenName) {
      trackScreenView(screenName)
    }
  }, [screenName, trackScreenView])

  // Track page view
  useEffect(() => {
    if (trackPageView && screenName) {
      trackPageViewFn(screenName)
    }
  }, [trackPageView, screenName, trackPageViewFn])

  // Track performance metrics
  useEffect(() => {
    if (trackPerformance) {
      // Track initial load time
      const loadTime = performance.now()
      
      // Track when component is fully rendered
      const renderTime = performance.now() - loadTime
      
      trackPerformanceFn({
        loadTime,
        renderTime
      })

      // Track interaction time (time to first meaningful interaction)
      const trackInteractionTime = () => {
        const interactionTime = performance.now() - loadTime
        trackPerformanceFn({
          interactionTime
        })
        // Remove listener after first interaction
        document.removeEventListener('click', trackInteractionTime)
        document.removeEventListener('touchstart', trackInteractionTime)
      }

      document.addEventListener('click', trackInteractionTime)
      document.addEventListener('touchstart', trackInteractionTime)

      return () => {
        document.removeEventListener('click', trackInteractionTime)
        document.removeEventListener('touchstart', trackInteractionTime)
      }
    }
  }, [trackPerformance, trackPerformanceFn])

  return (
    <div className={className}>
      {children}
    </div>
  )
}

// Higher-order component for easy tracking integration
export function withTracking<P extends object>(
  Component: React.ComponentType<P>,
  trackingConfig: Omit<TrackingProviderProps, 'children'>
) {
  return function TrackedComponent(props: P) {
    return (
      <TrackingProvider {...trackingConfig}>
        <Component {...props} />
      </TrackingProvider>
    )
  }
}

// Hook for easy tracking in functional components
export function useTracking(screenName?: string) {
  const {
    trackScreenView,
    trackPageView,
    trackButtonClick,
    trackFormInteraction,
    trackError,
    trackPerformance
  } = useUserAnalytics()

  const trackScreen = useCallback(() => {
    if (screenName) {
      trackScreenView(screenName)
    }
  }, [screenName, trackScreenView])

  const trackPage = useCallback(() => {
    if (screenName) {
      trackPageView(screenName)
    }
  }, [screenName, trackPageView])

  const trackButton = useCallback((
    buttonId: string,
    buttonText?: string,
    context?: string
  ) => {
    trackButtonClick(buttonId, buttonText, context)
  }, [trackButtonClick])

  const trackForm = useCallback((
    formId: string,
    fieldName: string,
    action: 'focus' | 'blur' | 'change' | 'submit'
  ) => {
    trackFormInteraction(formId, fieldName, action)
  }, [trackFormInteraction])

  const trackErrorEvent = useCallback((
    errorMessage: string,
    errorType: string,
    context?: string
  ) => {
    trackError(errorMessage, errorType, context)
  }, [trackError])

  const trackPerf = useCallback((
    metrics: {loadTime?: number, renderTime?: number, interactionTime?: number}
  ) => {
    trackPerformance(metrics)
  }, [trackPerformance])

  // Auto-track screen view on mount
  useEffect(() => {
    trackScreen()
  }, [trackScreen])

  return {
    trackScreen,
    trackPage,
    trackButton,
    trackForm,
    trackError: trackErrorEvent,
    trackPerformance: trackPerf
  }
}

// Utility components for common tracking patterns
export function TrackedButton({
  children,
  buttonId,
  buttonText,
  context,
  onClick,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  buttonId: string
  buttonText?: string
  context?: string
}) {
  const {trackButton} = useTracking()

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    trackButton(buttonId, buttonText, context)
    onClick?.(e)
  }, [trackButton, buttonId, buttonText, context, onClick])

  return (
    <button
      {...props}
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  )
}

export function TrackedForm({
  children,
  formId,
  onSubmit,
  className = '',
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & {
  formId: string
}) {
  const {trackForm} = useTracking()

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    trackForm(formId, 'form', 'submit')
    onSubmit?.(e)
  }, [trackForm, formId, onSubmit])

  const handleFocus = useCallback((e: React.FocusEvent<HTMLFormElement>) => {
    const target = e.target as HTMLInputElement
    if (target.name) {
      trackForm(formId, target.name, 'focus')
    }
  }, [trackForm, formId])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLFormElement>) => {
    const target = e.target as HTMLInputElement
    if (target.name) {
      trackForm(formId, target.name, 'blur')
    }
  }, [trackForm, formId])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLFormElement>) => {
    const target = e.target as HTMLInputElement
    if (target.name) {
      trackForm(formId, target.name, 'change')
    }
  }, [trackForm, formId])

  return (
    <form
      {...props}
      onSubmit={handleSubmit}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    >
      {children}
    </form>
  )
}

export function TrackedInput({
  name,
  formId,
  onFocus,
  onBlur,
  onChange,
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  formId: string
}) {
  const {trackForm} = useTracking()

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    trackForm(formId, name || 'unknown', 'focus')
    onFocus?.(e)
  }, [trackForm, formId, name, onFocus])

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    trackForm(formId, name || 'unknown', 'blur')
    onBlur?.(e)
  }, [trackForm, formId, name, onBlur])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    trackForm(formId, name || 'unknown', 'change')
    onChange?.(e)
  }, [trackForm, formId, name, onChange])

  return (
    <input
      {...props}
      name={name}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  )
}
