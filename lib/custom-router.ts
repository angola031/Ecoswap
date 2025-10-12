// Sistema de navegación personalizado para evitar ActionQueueContext
'use client'

import { useState, useEffect, useCallback } from 'react'

interface RouterState {
  pathname: string
  search: string
  hash: string
}

class CustomRouter {
  private listeners: Set<() => void> = new Set()
  private state: RouterState = {
    pathname: '/',
    search: '',
    hash: ''
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.updateState()
      window.addEventListener('popstate', this.handlePopState)
    }
  }

  private updateState = () => {
    if (typeof window === 'undefined') return
    
    this.state = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    }
  }

  private handlePopState = () => {
    this.updateState()
    this.notifyListeners()
  }

  private notifyListeners = () => {
    this.listeners.forEach(listener => listener())
  }

  push = (url: string) => {
    if (typeof window === 'undefined') return
    
    window.history.pushState({}, '', url)
    this.updateState()
    this.notifyListeners()
  }

  replace = (url: string) => {
    if (typeof window === 'undefined') return
    
    window.history.replaceState({}, '', url)
    this.updateState()
    this.notifyListeners()
  }

  back = () => {
    if (typeof window === 'undefined') return
    window.history.back()
  }

  forward = () => {
    if (typeof window === 'undefined') return
    window.history.forward()
  }

  refresh = () => {
    if (typeof window === 'undefined') return
    window.location.reload()
  }

  get pathname() {
    return this.state.pathname
  }

  get search() {
    return this.state.search
  }

  get hash() {
    return this.state.hash
  }

  get query() {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(this.state.search)
  }

  get asPath() {
    return this.state.pathname + this.state.search + this.state.hash
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState)
    }
    this.listeners.clear()
  }
}

// Instancia global del router personalizado
const customRouter = new CustomRouter()

// Hook personalizado para usar el router
export function useCustomRouter() {
  const [state, setState] = useState({
    pathname: customRouter.pathname,
    search: customRouter.search,
    hash: customRouter.hash
  })

  useEffect(() => {
    const unsubscribe = customRouter.subscribe(() => {
      setState({
        pathname: customRouter.pathname,
        search: customRouter.search,
        hash: customRouter.hash
      })
    })

    return unsubscribe
  }, [])

  return {
    push: customRouter.push,
    replace: customRouter.replace,
    back: customRouter.back,
    forward: customRouter.forward,
    refresh: customRouter.refresh,
    pathname: state.pathname,
    search: state.search,
    hash: state.hash,
    query: customRouter.query,
    asPath: customRouter.asPath
  }
}

// Hook para search params
export function useCustomSearchParams() {
  const { search } = useCustomRouter()
  return new URLSearchParams(search)
}

// Hook para pathname
export function useCustomPathname() {
  const { pathname } = useCustomRouter()
  return pathname
}

export default customRouter
