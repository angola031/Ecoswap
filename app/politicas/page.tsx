import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon, EyeIcon, LockClosedIcon, UserIcon, GlobeAltIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Política de Privacidad - EcoSwap Colombia',
  description: 'Política de privacidad y protección de datos personales de EcoSwap Colombia',
}

export default function PoliticasPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Política de Privacidad</h1>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Introducción */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Política de Privacidad de EcoSwap Colombia
            </h2>
            <p className="text-gray-600">
              Última actualización: {new Date().toLocaleDateString('es-CO', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-gray-600 mt-2">
              En EcoSwap Colombia, valoramos y protegemos tu privacidad. Esta política describe cómo recopilamos, 
              usamos, almacenamos y protegemos tu información personal cuando utilizas nuestra plataforma.
            </p>
          </div>

          {/* Secciones */}
          <div className="space-y-8">
            {/* 1. Información que Recopilamos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <EyeIcon className="w-5 h-5 mr-2 text-primary-600" />
                1. Información que Recopilamos
              </h3>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información Personal:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nombre completo y apellidos</li>
                    <li>Dirección de correo electrónico</li>
                    <li>Número de teléfono</li>
                    <li>Dirección física y ubicación</li>
                    <li>Fecha de nacimiento (opcional)</li>
                    <li>Información de identificación</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información del Perfil:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Foto de perfil</li>
                    <li>Biografía y descripción personal</li>
                    <li>Preferencias e intereses</li>
                    <li>Redes sociales vinculadas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información de Uso:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Productos publicados y visualizados</li>
                    <li>Interacciones con otros usuarios</li>
                    <li>Mensajes y conversaciones</li>
                    <li>Actividad en la plataforma</li>
                    <li>Preferencias de búsqueda</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información Técnica:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Dirección IP y ubicación geográfica</li>
                    <li>Tipo de dispositivo y navegador</li>
                    <li>Sistema operativo</li>
                    <li>Cookies y tecnologías similares</li>
                    <li>Registros de acceso y uso</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Cómo Usamos tu Información */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
                2. Cómo Usamos tu Información
              </h3>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Para Proporcionar el Servicio:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Crear y gestionar tu cuenta de usuario</li>
                    <li>Facilitar la publicación de productos</li>
                    <li>Conectar usuarios para intercambios</li>
                    <li>Proporcionar funcionalidades de chat</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Para Mejorar la Plataforma:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Analizar el uso y rendimiento</li>
                    <li>Desarrollar nuevas funcionalidades</li>
                    <li>Personalizar la experiencia del usuario</li>
                    <li>Optimizar la interfaz y navegación</li>
                    <li>Prevenir fraudes y abusos</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Para Comunicación:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Enviar notificaciones importantes</li>
                    <li>Informar sobre actualizaciones</li>
                    <li>Responder consultas y soporte</li>
                    <li>Enviar newsletters (con consentimiento)</li>
                    <li>Notificar sobre cambios en términos</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. Compartir Información */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-primary-600" />
                3. Compartir tu Información
              </h3>
              <div className="space-y-4 text-gray-700">
                <p><strong>No vendemos, alquilamos ni intercambiamos tu información personal con terceros.</strong></p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Información Pública:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nombre de usuario y foto de perfil</li>
                    <li>Productos publicados</li>
                    <li>Reseñas y calificaciones</li>
                    <li>Ubicación general (ciudad, región)</li>
                    <li>Información del perfil público</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Compartir con Otros Usuarios:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Información de contacto durante intercambios</li>
                    <li>Mensajes en conversaciones privadas</li>
                    <li>Detalles de productos en transacciones</li>
                    <li>Ubicación para encuentros (con consentimiento)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Proveedores de Servicios:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Hosting y almacenamiento en la nube</li>
                    <li>Análisis y métricas de uso</li>
                    <li>Servicios de email y notificaciones</li>
                    <li>Soporte técnico y atención al cliente</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requerimientos Legales:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Cumplimiento de leyes y regulaciones</li>
                    <li>Órdenes judiciales o gubernamentales</li>
                    <li>Protección de derechos y seguridad</li>
                    <li>Investigación de actividades fraudulentas</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Seguridad de Datos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LockClosedIcon className="w-5 h-5 mr-2 text-primary-600" />
                4. Seguridad y Protección de Datos
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Medidas de Seguridad:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Encriptación SSL/TLS para transmisión de datos</li>
                    <li>Almacenamiento seguro en servidores protegidos</li>
                    <li>Acceso restringido a información personal</li>
                    <li>Monitoreo continuo de seguridad</li>
                    <li>Copias de seguridad regulares</li>
                    <li>Auditorías de seguridad periódicas</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Acceso y Control:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Contraseñas seguras y autenticación de dos factores</li>
                    <li>Sesión automática después de inactividad</li>
                    <li>Registro de accesos y actividades</li>
                    <li>Notificaciones de acceso sospechoso</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Tus Derechos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
                5. Tus Derechos y Control
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Tienes los siguientes derechos sobre tu información personal:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Derechos del Usuario:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Acceso:</strong> Ver qué información tenemos sobre ti</li>
                    <li><strong>Rectificación:</strong> Corregir información incorrecta</li>
                    <li><strong>Eliminación:</strong> Solicitar la eliminación de tus datos</li>
                    <li><strong>Portabilidad:</strong> Obtener una copia de tus datos</li>
                    <li><strong>Limitación:</strong> Restringir el procesamiento</li>
                    <li><strong>Oposición:</strong> Oponerte al procesamiento</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Control de tu Cuenta:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Actualizar información del perfil</li>
                    <li>Cambiar configuraciones de privacidad</li>
                    <li>Gestionar preferencias de notificaciones</li>
                    <li>Descargar tus datos personales</li>
                    <li>Eliminar tu cuenta permanentemente</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. Cookies y Tecnologías Similares */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-primary-600" />
                6. Cookies y Tecnologías Similares
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Utilizamos cookies y tecnologías similares para mejorar tu experiencia:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tipos de Cookies:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Esenciales:</strong> Necesarias para el funcionamiento básico</li>
                    <li><strong>Funcionales:</strong> Mejoran la funcionalidad y personalización</li>
                    <li><strong>Analíticas:</strong> Nos ayudan a entender el uso de la plataforma</li>
                    <li><strong>Publicitarias:</strong> Muestran contenido relevante (con consentimiento)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Control de Cookies:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Configurar preferencias en tu navegador</li>
                    <li>Eliminar cookies existentes</li>
                    <li>Configurar alertas de cookies</li>
                    <li>Usar modo incógnito/privado</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. Retención de Datos */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LockClosedIcon className="w-5 h-5 mr-2 text-primary-600" />
                7. Retención y Almacenamiento de Datos
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Conservamos tu información personal solo el tiempo necesario:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Períodos de Retención:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Cuenta activa:</strong> Mientras mantengas tu cuenta abierta</li>
                    <li><strong>Después del cierre:</strong> 30 días para recuperación</li>
                    <li><strong>Datos de transacciones:</strong> 5 años por requerimientos legales</li>
                    <li><strong>Logs de seguridad:</strong> 12 meses para auditoría</li>
                    <li><strong>Cookies:</strong> Según la política de cookies</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Eliminación de Datos:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Eliminación automática después del período de retención</li>
                    <li>Eliminación manual a solicitud del usuario</li>
                    <li>Eliminación por inactividad prolongada</li>
                    <li>Eliminación por violación de términos</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8. Transferencias Internacionales */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-primary-600" />
                8. Transferencias Internacionales
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Tu información puede ser procesada en diferentes países:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ubicaciones de Procesamiento:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Colombia:</strong> Servidores principales y operaciones</li>
                    <li><strong>Estados Unidos:</strong> Servicios de hosting y análisis</li>
                    <li><strong>Unión Europea:</strong> Servicios de email y notificaciones</li>
                    <li><strong>Otros países:</strong> Solo cuando sea necesario</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Protecciones Aplicadas:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Acuerdos de procesamiento de datos</li>
                    <li>Certificaciones de seguridad internacionales</li>
                    <li>Cumplimiento con regulaciones locales</li>
                    <li>Transferencias solo a países con protección adecuada</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 9. Menores de Edad */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-primary-600" />
                9. Protección de Menores de Edad
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Nuestra plataforma no está dirigida a menores de 18 años:</p>
                
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No recopilamos intencionalmente información de menores</li>
                  <li>Si eres menor de edad, no uses la plataforma</li>
                  <li>Si eres padre/tutor y descubres uso por un menor, contáctanos</li>
                  <li>Eliminaremos inmediatamente la información de menores</li>
                  <li>Implementamos verificaciones de edad cuando sea posible</li>
                </ul>
              </div>
            </section>

            {/* 10. Cambios en la Política */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-primary-600" />
                10. Cambios en esta Política
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Podemos actualizar esta política de privacidad:</p>
                
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Para reflejar cambios en nuestras prácticas</li>
                  <li>Para cumplir con nuevas regulaciones</li>
                  <li>Para mejorar la protección de datos</li>
                  <li>Para agregar nuevas funcionalidades</li>
                </ul>
                
                <p className="mt-4">Te notificaremos sobre cambios importantes:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Por email a tu dirección registrada</li>
                  <li>Por notificación en la plataforma</li>
                  <li>Con al menos 30 días de anticipación</li>
                  <li>Con fecha de entrada en vigor</li>
                </ul>
              </div>
            </section>

            {/* 11. Contacto */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
                11. Contacto y Consultas
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>Para consultas sobre privacidad y protección de datos:</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Oficial de Protección de Datos:</h4>
                  <ul className="list-none space-y-2 ml-4">
                    <li>📧 Email: ecoswap03@gmail.com</li>
                    <li>📱 Teléfono: 3239163129</li>
                    <li>📍 Dirección: Pereira, Risaralda, Colombia</li>
                  </ul>
                </div>
                
                <p className="mt-4">Responderemos a todas las consultas en un plazo máximo de 15 días hábiles.</p>
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
                  href="/terminos" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Términos y Condiciones
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
