# Sistema de Validación de Productos - Ecoswap

## Descripción General

Se ha implementado un sistema completo de validación de productos donde los administradores pueden aprobar o rechazar productos que suben usuarios verificados antes de que se publiquen en la plataforma.

## Características Principales

### 1. Estados de Validación
- **Pending**: Producto esperando validación (estado inicial)
- **Approved**: Producto aprobado y visible públicamente
- **Rejected**: Producto rechazado (no visible públicamente)

### 2. Flujo de Trabajo
1. Usuario verificado sube un producto → Estado: `pending`
2. Administrador revisa el producto
3. Administrador aprueba o rechaza el producto
4. Usuario recibe notificación del resultado
5. Solo productos aprobados aparecen en la plataforma pública

## Archivos Modificados/Creados

### Base de Datos
- `database/create-product-validation-system.sql` - Script completo de la base de datos

### APIs
- `app/api/products/validate/route.ts` - API para validación de productos
- `app/api/products/public/route.ts` - API para productos públicos (solo aprobados)
- `app/api/notifications/route.ts` - API para notificaciones

### Componentes
- `components/admin/ProductsSection.tsx` - Interfaz de administrador actualizada
- `components/admin/ProductValidationModal.tsx` - Modal para validar productos
- `components/products/ProductsModule.tsx` - Módulo de productos actualizado

### Páginas
- `app/agregar-producto/page.tsx` - Formulario de productos actualizado

## Instalación

### 1. Ejecutar Script de Base de Datos
```sql
-- Ejecutar en Supabase SQL Editor
\i database/create-product-validation-system.sql
```

### 2. Verificar Permisos
Asegúrate de que los administradores tengan el rol correcto en la tabla `USUARIO_ROL`.

## Uso

### Para Usuarios
1. Subir producto normalmente desde `/agregar-producto`
2. El producto queda en estado "pending" hasta ser validado
3. Recibir notificación cuando el producto sea aprobado/rechazado

### Para Administradores
1. Ir al dashboard de administración
2. Navegar a la sección "Productos"
3. Ver productos pendientes de validación
4. Hacer clic en "Aprobar" o "Rechazar"
5. Agregar comentarios opcionales al rechazar

## Estructura de la Base de Datos

### Tabla PRODUCTO (nuevos campos)
```sql
ALTER TABLE PRODUCTO ADD COLUMN:
- estado_validacion VARCHAR(20) DEFAULT 'pending'
- fecha_validacion TIMESTAMP WITH TIME ZONE
- validado_por INTEGER (FK a USUARIO)
- comentarios_validacion TEXT
- fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### Funciones Creadas
- `validate_product()` - Valida un producto (solo administradores)
- `get_pending_products()` - Obtiene productos pendientes
- `update_product_timestamp()` - Actualiza timestamp automáticamente

### Vista Creada
- `PRODUCTOS_PUBLICOS` - Vista que muestra solo productos aprobados

## Políticas RLS

### Productos
- Solo productos con `estado_validacion = 'approved'` son visibles públicamente
- Usuarios solo pueden editar sus propios productos en estado "pending"
- Administradores pueden validar cualquier producto

### Notificaciones
- Usuarios solo pueden ver sus propias notificaciones
- Sistema puede crear notificaciones para cualquier usuario

## APIs Disponibles

### GET /api/products/public
Obtiene productos públicos (solo aprobados)
- Parámetros: page, limit, category, search, tipo_transaccion, min_price, max_price, ciudad

### GET /api/products/validate
Obtiene productos pendientes de validación (solo administradores)

### POST /api/products/validate
Valida un producto (solo administradores)
- Body: { producto_id, estado_validacion, comentarios }

### GET /api/notifications
Obtiene notificaciones del usuario actual

### PUT /api/notifications
Marca notificaciones como leídas/no leídas

## Notificaciones

El sistema crea automáticamente notificaciones cuando:
- Un producto es aprobado
- Un producto es rechazado

Las notificaciones incluyen:
- Título descriptivo
- Mensaje con detalles
- Comentarios del administrador (si los hay)

## Consideraciones de Seguridad

1. **Autenticación**: Todas las APIs requieren token válido
2. **Autorización**: Solo administradores pueden validar productos
3. **RLS**: Políticas de seguridad a nivel de fila implementadas
4. **Validación**: Validación de datos en frontend y backend

## Monitoreo y Estadísticas

El sistema permite a los administradores:
- Ver cantidad de productos por estado
- Filtrar productos por estado de validación
- Buscar productos específicos
- Ver historial de validaciones

## Mantenimiento

### Limpieza de Datos
- Considerar archivar productos rechazados antiguos
- Limpiar notificaciones leídas antiguas

### Optimización
- Índices creados para mejorar rendimiento
- Vista materializada para productos públicos

## Troubleshooting

### Problemas Comunes

1. **Productos no aparecen públicamente**
   - Verificar que `estado_validacion = 'approved'`
   - Verificar que `estado_publicacion = 'activo'`

2. **Error de permisos en validación**
   - Verificar que el usuario tenga rol de administrador
   - Verificar que el rol esté activo

3. **Notificaciones no se crean**
   - Verificar que la función `validate_product` se ejecute correctamente
   - Verificar permisos en la tabla `NOTIFICACION`

### Logs a Revisar
- Console del navegador para errores de frontend
- Logs de Supabase para errores de base de datos
- Network tab para errores de API

## Futuras Mejoras

1. **Validación Automática**: Implementar reglas automáticas para productos
2. **Historial de Validaciones**: Mantener historial completo de cambios
3. **Plantillas de Rechazo**: Comentarios predefinidos para rechazos comunes
4. **Estadísticas Avanzadas**: Dashboard con métricas de validación
5. **Notificaciones Push**: Implementar notificaciones en tiempo real
6. **Validación por Lotes**: Permitir validar múltiples productos a la vez
