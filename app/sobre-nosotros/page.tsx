'use client'

import { motion } from 'framer-motion'
import { 
  UserGroupIcon, 
  HeartIcon, 
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sobre Nosotros
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conoce la historia detrás de EcoSwap y nuestro compromiso con la economía circular en Colombia.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Nuestra Historia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nuestra Historia
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  EcoSwap nació en 2024 de la visión de tres estudiantes universitarios de Pereira, 
                  Colombia, quienes identificaron la necesidad de promover la economía circular 
                  en nuestro país.
                </p>
                <p>
                  Nuestra plataforma conecta personas que desean dar una segunda vida a sus 
                  productos con aquellos que buscan opciones sostenibles y económicas.
                </p>
                <p>
                  Creemos firmemente que cada intercambio contribuye a un futuro más sostenible 
                  y a construir comunidades más unidas.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <UserGroupIcon className="w-32 h-32 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nuestra Misión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <HeartIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Nuestra Misión
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Promover la economía circular y el consumo sostenible en Colombia, 
                facilitando el intercambio de productos de segunda mano y construyendo 
                comunidades más conscientes del impacto ambiental.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GlobeAltIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sostenibilidad
                </h3>
                <p className="text-gray-600">
                  Reducimos el desperdicio y promovemos la reutilización de productos.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Comunidad
                </h3>
                <p className="text-gray-600">
                  Conectamos personas con intereses comunes y valores compartidos.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Impacto Social
                </h3>
                <p className="text-gray-600">
                  Contribuimos al bienestar social y económico de nuestras comunidades.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ubicación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Desde el Corazón de Colombia
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="w-6 h-6" />
                    <span className="text-lg">Pereira, Risaralda, Colombia</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-6 h-6" />
                    <span className="text-lg">Fundada en 2024</span>
                  </div>
                </div>
                <p className="mt-6 text-lg opacity-90">
                  Operamos desde la hermosa ciudad de Pereira, conocida como la capital 
                  del Eje Cafetero, donde la tradición y la innovación se unen para 
                  crear un futuro más sostenible.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-video bg-white/20 rounded-xl flex items-center justify-center">
                  <MapPinIcon className="w-24 h-24 text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Equipo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nuestro Equipo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tres estudiantes universitarios apasionados por la tecnología y la sostenibilidad.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Fundador 1",
                role: "CEO & Co-fundador",
                description: "Especialista en tecnología y desarrollo de productos."
              },
              {
                name: "Fundador 2", 
                role: "CTO & Co-fundador",
                description: "Experto en arquitectura de software y sistemas escalables."
              },
              {
                name: "Fundador 3",
                role: "COO & Co-fundador", 
                description: "Especialista en operaciones y experiencia de usuario."
              }
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ')[0].charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-green-600 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-gray-600">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Únete a Nuestra Misión
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Cada intercambio cuenta. Cada producto reutilizado es un paso hacia 
              un futuro más sostenible. ¡Sé parte del cambio!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Comenzar a Intercambiar
              </a>
              <a
                href="/"
                className="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Explorar Productos
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
























