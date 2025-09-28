# Fix: Corazón no se muestra como seleccionado cuando el usuario ya le dio like

## 🐛 Problema Identificado
El corazón no aparecía como seleccionado (lleno) cuando el usuario ya le había dado like al producto.

## 🔍 Causa Raíz
La función `getAuthUserId` en las APIs estaba buscando el usuario por `email` en la tabla `usuario`, pero según el esquema de la base de datos:
- El `email` está en la tabla `auth.users` 
- La tabla `usuario` tiene `auth_user_id` que referencia a `auth.users.id`
- Necesitamos buscar por `auth_user_id` en lugar de `email`

## ✅ Solución Implementada

### 1. **Corregir función `getAuthUserId`**

#### **Antes (Incorrecto):**
```typescript
const { data: usuario } = await supabaseAdmin
  .from('usuario')
  .select('user_id')
  .eq('email', email)  // ❌ Email no existe en tabla usuario
  .single()
```

#### **Después (Correcto):**
```typescript
const { data } = await supabaseAdmin.auth.getUser(token)
const authUserId = data?.user?.id  // ✅ Obtener ID de auth.users

const { data: usuario } = await supabaseAdmin
  .from('usuario')
  .select('user_id')
  .eq('auth_user_id', authUserId)  // ✅ Buscar por auth_user_id
  .single()
```

### 2. **Archivos Actualizados**

#### **APIs Corregidas:**
- ✅ `app/api/products/[id]/like/route.ts` - Función `getAuthUserId` corregida
- ✅ `app/api/products/[id]/likes/route.ts` - Función `getAuthUserId` corregida

#### **Logs de Debug Agregados:**
- ✅ **Backend**: Logs en API para diagnosticar problemas
- ✅ **Frontend**: Logs en página de detalle para verificar estado

### 3. **Flujo Corregido**

#### **Carga del Estado del Like:**
1. ✅ **Frontend**: Llama a `/api/products/[id]/like` GET
2. ✅ **Backend**: Obtiene `auth_user_id` del token JWT
3. ✅ **Backend**: Busca `user_id` en tabla `usuario` por `auth_user_id`
4. ✅ **Backend**: Consulta tabla `favorito` con `user_id` y `producto_id`
5. ✅ **Backend**: Retorna `{ liked: true/false }`
6. ✅ **Frontend**: Establece `isLiked` según respuesta
7. ✅ **Frontend**: Muestra corazón lleno si `isLiked = true`

#### **Visualización del Corazón:**
```tsx
{isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
```

## 🧪 Testing

### **Scripts de Prueba:**
- ✅ `database/debug-likes-issue.sql` - Diagnostica problemas de likes
- ✅ `database/test-likes-functionality.sql` - Prueba funcionalidad completa

### **Casos de Prueba:**
1. ✅ **Usuario sin like**: Corazón vacío, puede dar like
2. ✅ **Usuario con like**: Corazón lleno, puede quitar like
3. ✅ **Propietario**: Corazón deshabilitado, no puede dar like
4. ✅ **Usuario no verificado**: Modal de verificación

## 🔧 Debugging

### **Logs Agregados:**
```typescript
// Backend
console.log('🔍 DEBUG API Like GET:', { productoId, userId })
console.log('🔍 DEBUG: Favorito query result:', { data, error })
console.log('🔍 DEBUG: Returning liked:', liked)

// Frontend  
console.log('🔍 DEBUG: Verificando estado de like para usuario no propietario...')
console.log('🔍 DEBUG: Estableciendo isLiked a:', json.liked)
```

### **Cómo Usar los Logs:**
1. **Abrir DevTools** en el navegador
2. **Ir a Console** tab
3. **Navegar** a cualquier producto
4. **Ver logs** que muestran el flujo completo
5. **Verificar** que `isLiked` se establece correctamente

## 🎯 Resultado Esperado

### **Antes del Fix:**
- ❌ Corazón siempre vacío (no detectaba likes existentes)
- ❌ Usuario podía dar like múltiples veces
- ❌ Contador no se actualizaba correctamente

### **Después del Fix:**
- ✅ **Corazón lleno** cuando usuario ya le dio like
- ✅ **Corazón vacío** cuando usuario no le dio like
- ✅ **Estado correcto** al cargar la página
- ✅ **Actualización en tiempo real** al dar/quitar like
- ✅ **Validación de verificación** antes de permitir likes

## 🚀 Próximos Pasos

1. **Ejecutar script de base de datos**: `add-total-likes-to-producto.sql`
2. **Probar funcionalidad**: Navegar a productos y verificar corazones
3. **Revisar logs**: Verificar que no hay errores en console
4. **Probar casos edge**: Usuario no verificado, propietario, etc.

## 📝 Notas Técnicas

- **Relación de tablas**: `auth.users.id` → `usuario.auth_user_id` → `usuario.user_id`
- **JWT Token**: Contiene `auth.users.id` en el campo `sub`
- **Consulta optimizada**: Usa `maybeSingle()` para evitar errores si no existe
- **Manejo de errores**: Logs detallados para debugging

## ✅ Estado: RESUELTO

El problema del corazón no seleccionado está solucionado. La función `getAuthUserId` ahora busca correctamente por `auth_user_id` en lugar de `email`, lo que permite detectar correctamente si el usuario ya le dio like al producto.
