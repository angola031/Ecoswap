import { Suspense } from 'react'

export default function EventosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Eventos EcoSwap
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Participa en nuestros eventos de intercambio sostenible
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Esta página está en desarrollo. Próximamente podrás ver todos los eventos disponibles.
          </p>
        </div>
      </div>
    </div>
  )
}
