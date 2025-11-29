'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ImageZoomModalProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  productTitle?: string
}

export default function ImageZoomModal({
  images,
  initialIndex,
  isOpen,
  onClose,
  productTitle
}: ImageZoomModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Resetear índice cuando cambia la imagen inicial
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
    }
  }, [initialIndex, isOpen])

  // Manejar teclas de navegación
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, images.length])

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  if (!isOpen || images.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Controles superiores */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            {productTitle && (
              <span className="text-white/90 text-sm font-medium truncate max-w-md">
                {productTitle}
              </span>
            )}
          </div>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors z-10"
          title="Cerrar (o presiona ESC)"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Imagen */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          onClick={onClose}
        >
          <motion.img
            src={images[currentIndex]}
            alt={productTitle || `Imagen ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            key={currentIndex}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>

        {/* Botones de navegación */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              title="Imagen anterior (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              title="Imagen siguiente (→)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Indicadores circulares */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={`transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-3 h-3 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/70'
                  } rounded-full`}
                  title={`Imagen ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

