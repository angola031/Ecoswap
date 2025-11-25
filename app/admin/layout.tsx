import { Suspense } from 'react'

export const metadata = {
  title: 'Admin - EcoSwap Colombia',
  description: 'Panel de administración'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      {children}
    </Suspense>
  )
}

