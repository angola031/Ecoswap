import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Términos y Condiciones - EcoSwap Colombia',
  description: 'Términos y condiciones de uso de la plataforma EcoSwap Colombia',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Introducción */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Términos y Condiciones de Uso de EcoSwap Colombia
            </h2>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-gray-600 mt-2">
              Al acceder y utilizar la plataforma EcoSwap Colombia, aceptas estar sujeto a estos términos y condiciones.
              Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestro servicio.
            </p>
          </div>

          {/* Secciones */}
          <div className="space-y-8">
            {/* 1. Definiciones */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                1. Definiciones
              </h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Plataforma:</strong> EcoSwap Colombia, sitio web y aplicación móvil.</p>
                <p><strong>Usuario:</strong> Cualquier persona que acceda o utilice la plataforma.</p>
                <p><strong>Producto:</strong> Bien o servicio ofrecido para intercambio o venta.</p>
                <p><strong>Intercambio:</strong> Transacción entre usuarios para intercambiar productos.</p>
                <p><strong>Contenido:</strong> Información, imágenes, descripciones y otros materiales publicados.</p>
              </div>
            </section>

            {/* 2. Uso de la Plataforma */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                2. Uso de la Plataforma
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Al usar EcoSwap Colombia, te comprometes a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Proporcionar información veraz y actualizada</li>
                  <li>Respetar los derechos de otros usuarios</li>
                  <li>No usar la plataforma para actividades ilegales</li>
                  <li>No publicar contenido ofensivo o inapropiado</li>
                  <li>Mantener la seguridad de tu cuenta</li>
                  <li>Reportar cualquier actividad sospechosa</li>
                </ul>
              </div>
            </section>

            {/* 3. Publicación de Productos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                3. Publicación de Productos
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Al publicar productos en la plataforma:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Debes ser el propietario legítimo del producto</li>
                  <li>Las descripciones deben ser precisas y honestas</li>
                  <li>Las imágenes deben ser del producto real</li>
                  <li>No puedes publicar productos prohibidos o ilegales</li>
                  <li>Debes mantener el producto disponible hasta completar el intercambio</li>
                  <li>Eres responsable de la calidad y estado del producto</li>
                </ul>
              </div>
            </section>

            {/* 4. Intercambios y Transacciones */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                4. Intercambios y Transacciones
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Los intercambios en la plataforma:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Se realizan directamente entre usuarios</li>
                  <li>EcoSwap no es parte de la transacción</li>
                  <li>Los usuarios son responsables de cumplir los acuerdos</li>
                  <li>Se recomienda reunirse en lugares públicos y seguros</li>
                  <li>Los términos del intercambio deben acordarse previamente</li>
                  <li>EcoSwap no garantiza la calidad de los productos</li>
                </ul>
              </div>
            </section>

            {/* 5. Prohibiciones */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-primary-600" />
                5. Actividades Prohibidas
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Está prohibido:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Publicar productos falsificados o robados</li>
                  <li>Usar la plataforma para estafas o fraudes</li>
                  <li>Publicar contenido pornográfico o violento</li>
                  <li>Spam o mensajes no solicitados</li>
                  <li>Suplantar la identidad de otros usuarios</li>
                  <li>Usar bots o automatización no autorizada</li>
                  <li>Vender productos regulados sin permisos</li>
                </ul>
              </div>
            </section>

            {/* 6. Responsabilidades */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                6. Responsabilidades y Limitaciones
              </h3>
              <div className="space-y-3 text-gray-700">
                <p><strong>Responsabilidades del Usuario:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verificar la identidad de otros usuarios</li>
                  <li>Evaluar la calidad de los productos antes del intercambio</li>
                  <li>Cumplir con las leyes locales aplicables</li>
                  <li>Resolver disputas directamente con otros usuarios</li>
                </ul>
                <p className="mt-4"><strong>Limitaciones de EcoSwap:</strong></p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>No somos responsables por la calidad de los productos</li>
                  <li>No garantizamos la veracidad de la información de usuarios</li>
                  <li>No intervenimos en disputas entre usuarios</li>
                  <li>No somos responsables por pérdidas o daños</li>
                </ul>
              </div>
            </section>

            {/* 7. Propiedad Intelectual */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                7. Propiedad Intelectual
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Al publicar contenido en la plataforma:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Conservas los derechos sobre tu contenido</li>
                  <li>Otorgas a EcoSwap licencia para usar el contenido en la plataforma</li>
                  <li>Garantizas que tienes derechos sobre el contenido publicado</li>
                  <li>No puedes publicar contenido que viole derechos de terceros</li>
                </ul>
              </div>
            </section>

            {/* 8. Privacidad */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                8. Privacidad y Datos Personales
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>El uso de tus datos personales se rige por nuestra Política de Privacidad,
                  que forma parte integral de estos términos. Al usar la plataforma,
                  aceptas el procesamiento de tus datos según dicha política.</p>
              </div>
            </section>

            {/* 9. Modificaciones */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-primary-600" />
                9. Modificaciones de los Términos
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>EcoSwap se reserva el derecho de modificar estos términos en cualquier momento.
                  Los cambios serán notificados a través de la plataforma o por email.
                  El uso continuado de la plataforma después de los cambios constituye
                  aceptación de los nuevos términos.</p>
              </div>
            </section>

            {/* 10. Terminación */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-primary-600" />
                10. Terminación de la Cuenta
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Podemos suspender o terminar tu cuenta por:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violación de estos términos</li>
                  <li>Actividad fraudulenta o sospechosa</li>
                  <li>Quejas múltiples de otros usuarios</li>
                  <li>Uso inapropiado de la plataforma</li>
                </ul>
                <p className="mt-4">También puedes cerrar tu cuenta en cualquier momento
                  desde la configuración de tu perfil.</p>
              </div>
            </section>

            {/* 11. Ley Aplicable */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                11. Ley Aplicable y Jurisdicción
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Estos términos se rigen por las leyes de Colombia.
                  Cualquier disputa será resuelta en los tribunales de Pereira, Risaralda,
                  salvo que la ley establezca otra jurisdicción obligatoria.</p>
              </div>
            </section>

            {/* 12. Contacto */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2 text-primary-600" />
                12. Contacto
              </h3>
              <div className="space-y-3 text-gray-700">
                <p>Si tienes preguntas sobre estos términos, contáctanos:</p>
                <ul className="list-none space-y-2 ml-4">
                  <li>📧 Email: legal@ecoswap.co</li>
                  <li>📱 Teléfono: +57 6 123 4567</li>
                  <li>📍 Dirección: Pereira, Risaralda, Colombia</li>
                  <li>🌐 Sitio web: https://ecoswap.co</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} EcoSwap Colombia. Todos los derechos reservados.
              </p>
              <div className="flex space-x-6">
                <Link
                  href="/politicas"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Política de Privacidad
                </Link>
                <Link
                  href="/"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
