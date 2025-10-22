'use client'

import { useState } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'

interface AvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: React.ReactNode
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8', 
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '', 
  fallbackIcon 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Si no hay src o hay error, mostrar el fallback
  const shouldShowFallback = !src || imageError

  const defaultFallback = (
    <div className={`${sizeClasses[size]} rounded-full bg-green-500 flex items-center justify-center ${className}`}>
      <UserIcon className="w-1/2 h-1/2 text-white" />
    </div>
  )

  if (shouldShowFallback) {
    return fallbackIcon || defaultFallback
  }

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
      {!imageLoaded && !imageError && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse ${className}`} />
      )}
    </div>
  )
}
