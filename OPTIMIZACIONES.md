# Guía de Optimizaciones de Rendimiento

## Optimizaciones Implementadas ✅

### 1. Lazy Loading de Componentes Pesados
- **Archivo**: `app/page.tsx`
- **Cambio**: Componentes pesados (ChatModule, ProfileModule, InteractionsModule, ProposalsModule) ahora se cargan solo cuando se necesitan
- **Beneficio**: Reduce el bundle inicial en ~40-60%, mejorando el tiempo de carga inicial

### 2. Suspense Boundaries
- **Archivo**: `app/page.tsx`
- **Cambio**: Agregado `Suspense` con fallback de carga para componentes lazy
- **Beneficio**: Mejor experiencia de usuario durante la carga

## Optimizaciones Recomendadas (Pendientes)

### 3. Optimización de Imágenes con next/image
**Prioridad: Alta**

**Archivos afectados:**
- `components/products/ProductsModule.tsx`
- `components/profile/ProfileModule.tsx`
- `app/producto/[id]/page.tsx`
- `app/interaccion/[id]/page.tsx`

**Cambio sugerido:**
```tsx
// Antes
<img src={product.image} alt={product.title} />

// Después
import Image from 'next/image'
<Image 
  src={product.image} 
  alt={product.title}
  width={300}
  height={200}
  loading="lazy"
  placeholder="blur"
/>
```

**Beneficio**: 
- Reducción de 30-50% en tamaño de imágenes
- Lazy loading automático
- Mejor Core Web Vitals (LCP)

### 4. Reducir Consultas Redundantes
**Prioridad: Alta**

**Archivo**: `app/interaccion/[id]/page.tsx`

**Problema actual:**
- Se hace una consulta para obtener `user_id` antes de cargar la interacción
- Se podría incluir en la respuesta de la API

**Solución:**
- Modificar `/api/interactions/[id]` para incluir el `user_id` del usuario actual en la respuesta
- Eliminar la consulta separada a `usuario` table

**Beneficio**: Reducción de 1 consulta a la BD por carga de página

### 5. Implementar Paginación/Infinite Scroll
**Prioridad: Media**

**Archivo**: `components/products/ProductsModule.tsx`

**Problema actual:**
- Carga todos los productos de una vez (limit=20 pero podría ser más)

**Solución:**
```tsx
const [page, setPage] = useState(1)
const [hasMore, setHasMore] = useState(true)

const loadMore = async () => {
  const response = await fetch(`/api/products/public?limit=20&offset=${page * 20}`)
  // ... agregar a lista existente
}
```

**Beneficio**: 
- Carga inicial más rápida
- Mejor experiencia en dispositivos móviles

### 6. React.memo para Componentes Pesados
**Prioridad: Media**

**Archivos:**
- `components/products/ProductCard.tsx` (si existe)
- Componentes de lista que se re-renderizan frecuentemente

**Solución:**
```tsx
export default React.memo(ProductCard, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id
})
```

**Beneficio**: Reduce re-renders innecesarios

### 7. Optimizar Consultas de Base de Datos
**Prioridad: Alta**

**Archivos**: APIs en `app/api/`

**Recomendaciones:**
- Usar `select()` específico en lugar de `select('*')`
- Agregar índices en columnas frecuentemente consultadas:
  - `producto.estado_publicacion`
  - `producto.estado_validacion`
  - `intercambio.estado`
  - `usuario.auth_user_id`

**Ejemplo:**
```sql
CREATE INDEX idx_producto_publicacion ON producto(estado_publicacion, estado_validacion);
CREATE INDEX idx_intercambio_estado ON intercambio(estado);
```

### 8. Cachear Datos Estáticos
**Prioridad: Baja**

**Archivo**: `components/products/ProductsModule.tsx`

**Solución:**
- Cachear categorías (cambian raramente)
- Usar `localStorage` o `sessionStorage` para datos que no cambian frecuentemente

### 9. Code Splitting de Rutas
**Prioridad: Media**

**Archivos**: Páginas en `app/`

**Solución:**
- Asegurar que cada página solo carga lo necesario
- Usar dynamic imports para componentes específicos de página

### 10. Optimizar Bundle Size
**Prioridad: Media**

**Recomendaciones:**
- Analizar bundle con `npm run build` y revisar qué ocupa más espacio
- Considerar tree-shaking de librerías grandes (ej: framer-motion solo donde se usa)

## Métricas a Monitorear

1. **First Contentful Paint (FCP)**: < 1.8s
2. **Largest Contentful Paint (LCP)**: < 2.5s
3. **Time to Interactive (TTI)**: < 3.8s
4. **Total Blocking Time (TBT)**: < 200ms
5. **Cumulative Layout Shift (CLS)**: < 0.1

## Herramientas de Análisis

- `npm run build` - Ver tamaño de bundle
- Chrome DevTools Lighthouse - Análisis de rendimiento
- Next.js Analytics - Métricas en producción

## Próximos Pasos

1. ✅ Implementar lazy loading (COMPLETADO)
2. ⏳ Optimizar imágenes con next/image
3. ⏳ Reducir consultas redundantes en interaccion/[id]
4. ⏳ Implementar paginación en productos
5. ⏳ Agregar React.memo donde sea necesario

