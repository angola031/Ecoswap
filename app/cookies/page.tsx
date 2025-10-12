import { Suspense } from 'react'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Política de Cookies
          </h1>
          
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              En EcoSwap utilizamos cookies para mejorar tu experiencia en nuestra plataforma.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              ¿Qué son las cookies?
            </h2>
            <p className="mb-4">
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo 
              cuando visitas nuestro sitio web.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Tipos de cookies que utilizamos
            </h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Cookies esenciales para el funcionamiento del sitio</li>
              <li>Cookies de autenticación y sesión</li>
              <li>Cookies de preferencias de usuario</li>
              <li>Cookies de análisis y rendimiento</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              Gestión de cookies
            </h2>
            <p className="mb-4">
              Puedes gestionar las cookies desde la configuración de tu navegador. 
              Sin embargo, deshabilitar ciertas cookies puede afectar el funcionamiento del sitio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
