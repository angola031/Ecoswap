'use client'

import { CheckBadgeIcon } from '@heroicons/react/24/solid'

interface FoundationBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export default function FoundationBadge({ size = 'md', showText = true, className = '' }: FoundationBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      <CheckBadgeIcon className={`${sizeClasses[size]} text-purple-600 dark:text-purple-400`} />
      {showText && (
        <span className={`${textSizeClasses[size]} font-medium text-purple-600 dark:text-purple-400`}>
          Fundación Verificada
        </span>
      )}
    </div>
  )
}

export function FoundationBadgeTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        Fundación Verificada para Niños
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  )
}

