// Fallback para Link de Next.js cuando está deshabilitado
import React from 'react'
import customRouter from './custom-router'

interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  target?: string
  rel?: string
  replace?: boolean
}

export default function Link({ href, children, className, onClick, target, rel, replace = false }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick()
    }
    
    // Si es un enlace externo o tiene target, permitir comportamiento normal
    if (target || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }
    
    // Prevenir comportamiento por defecto y navegar manualmente
    e.preventDefault()
    
    if (replace) {
      customRouter.replace(href)
    } else {
      customRouter.push(href)
    }
  }

  return (
    <a 
      href={href} 
      className={className}
      onClick={handleClick}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  )
}
