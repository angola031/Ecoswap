// Utilidad para suprimir warnings de hidratación de extensiones del navegador
export const suppressHydrationWarning = (element) => {
  if (typeof window !== 'undefined') {
    // Solo en el cliente, agregar supresión de warnings de hidratación
    return {
      ...element,
      suppressHydrationWarning: true
    }
  }
  return element
}

// Configuración para elementos que comúnmente causan warnings de hidratación
export const hydrationSafeProps = {
  suppressHydrationWarning: true
}
