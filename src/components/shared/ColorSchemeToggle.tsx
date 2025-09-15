import React from 'react'
import type {ColorScheme} from '../../types'
import {getColorClasses} from '../../constants'

interface ColorSchemeToggleProps {
  colorScheme: ColorScheme
  onToggle: () => void
  className?: string
}

export const ColorSchemeToggle = React.memo(function ColorSchemeToggle({
  colorScheme,
  onToggle,
  className = ''
}: ColorSchemeToggleProps) {
  const colors = getColorClasses(colorScheme)

  return (
    <button
      onClick={onToggle}
      className={`p-3 ${colors.glass} rounded-2xl shadow-lg transition-all duration-500 active:scale-95 hover:scale-105 ${className}`}
      aria-label={`Switch to ${colorScheme === 'default' ? 'colorblind-friendly' : 'default'} theme`}
    >
      <span className="text-lg" role="img" aria-label={colorScheme === 'default' ? 'Eye' : 'Blue circle'}>
        {colorScheme === 'default' ? '👁️' : '🔵'}
      </span>
    </button>
  )
})