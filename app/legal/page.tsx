import { Suspense } from 'react'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Información Legal
          </h1>
          
          <div className="prose prose-lg text-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Términos de Servicio
            </h2>
            <p className="mb-4">
              Al usar EcoSwap, aceptas nuestros términos de servicio y políticas de uso.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Política de Privacidad
            </h2>
            <p className="mb-4">
              Respetamos tu privacidad y protegemos tus datos personales según las mejores prácticas de seguridad.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Responsabilidad
            </h2>
            <p className="mb-4">
              Los usuarios son responsables de sus intercambios y de verificar la calidad de los productos.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Contacto Legal
            </h2>
            <p className="mb-4">
              Para consultas legales, puedes contactarnos a través de nuestra página de contacto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
