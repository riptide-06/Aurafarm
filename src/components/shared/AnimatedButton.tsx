import React from 'react'

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const AnimatedButton = React.memo(function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  onMouseDown,
  onAnimationEnd,
  ...props
}: AnimatedButtonProps) {
  const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.add('animate-click')
    onMouseDown?.(e)
  }, [onMouseDown])

  const handleAnimationEnd = React.useCallback((e: React.AnimationEvent<HTMLButtonElement>) => {
    e.currentTarget.classList.remove('animate-click')
    onAnimationEnd?.(e)
  }, [onAnimationEnd])

  const baseClasses = 'font-bold rounded-2xl shadow-xl transition-all duration-500 active:scale-95'
  
  const variantClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    glass: 'backdrop-blur-lg'
  }
  
  const sizeClasses = {
    sm: 'py-3 px-4 text-sm',
    md: 'py-4 px-6 text-lg',
    lg: 'py-6 px-8 text-xl'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onAnimationEnd={handleAnimationEnd}
      {...props}
    >
      {children}
    </button>
  )
})