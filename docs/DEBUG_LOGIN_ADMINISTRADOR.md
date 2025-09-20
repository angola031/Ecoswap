# 🔍 Debug del Login de Administradores

## 🎯 **Problema:**
El login de administradores no redirige al dashboard `/admin/verificaciones`.

## ✅ **Solución Implementada:**

### **1. Logs de Debug Agregados**
He agregado logs detallados en el login para identificar exactamente qué está pasando:

```typescript
console.log('✅ Autenticación exitosa, verificando tipo de usuario...')
console.log('📊 Datos del usuario:', userData)
console.log('❌ Error al obtener datos del usuario:', userError)
console.log('🔑 Usuario es administrador activo, redirigiendo...')
```

### **2. Redirección Mejorada**
Cambié de `router.push()` a `window.location.href` para evitar conflictos con el middleware:

```typescript
// Antes
router.push('/admin/verificaciones')

// Después
window.location.href = '/admin/verificaciones'
```

## 🔍 **Pasos para Debuggear:**

### **1. Abrir la Consola del Navegador:**
1. **Presiona** `F12` o `Ctrl+Shift+I`
2. **Ve** a la pestaña "Console"
3. **Intenta** hacer login como administrador
4. **Observa** los logs que aparecen

### **2. Verificar los Logs:**
Deberías ver algo como:
```
✅ Autenticación exitosa, verificando tipo de usuario...
📊 Datos del usuario: {es_admin: true, activo: true, nombre: "...", apellido: "..."}
❌ Error al obtener datos del usuario: null
🔑 Usuario es administrador activo, redirigiendo...
```

### **3. Posibles Problemas y Soluciones:**

#### **❌ Problema: "Error al verificar permisos"**
**Causa:** Error al consultar la tabla `usuario`
**Solución:**
- Verificar que la tabla `usuario` existe
- Verificar que el usuario tiene permisos para leer la tabla
- Verificar que el email existe en la tabla

#### **❌ Problema: "Tu cuenta no está activa o no tienes permisos"**
**Causa:** `es_admin` es `false` o `activo` es `false`
**Solución:**
- Verificar en la base de datos que `es_admin = true`
- Verificar en la base de datos que `activo = true`

#### **❌ Problema: No aparece ningún log**
**Causa:** Error en la autenticación
**Solución:**
- Verificar que las credenciales son correctas
- Verificar que el usuario existe en Supabase Auth

## 🔧 **Verificación en Base de Datos:**

### **1. Verificar Usuario en Tabla `usuario`:**
```sql
SELECT user_id, email, es_admin, activo, nombre, apellido 
FROM usuario 
WHERE email = 'tu-email@ejemplo.com';
```

### **2. Verificar Usuario en Supabase Auth:**
1. **Ve** al Dashboard de Supabase
2. **Sección** "Authentication" > "Users"
3. **Busca** tu email
4. **Verifica** que el usuario existe y está activo

## 🚀 **Prueba Paso a Paso:**

### **1. Limpiar Sesión:**
1. **Cerrar** el navegador completamente
2. **Abrir** una ventana de incógnito
3. **Ir** a `/login`

### **2. Hacer Login:**
1. **Ingresar** email de administrador
2. **Ingresar** contraseña
3. **Hacer clic** en "Iniciar Sesión"
4. **Observar** la consola del navegador

### **3. Verificar Redirección:**
1. **Debería** redirigir a `/admin/verificaciones`
2. **Debería** mostrar el dashboard de administradores
3. **No debería** mostrar errores en la consola

## 📊 **Logs Esperados:**

### **✅ Login Exitoso:**
```
✅ Autenticación exitosa, verificando tipo de usuario...
📊 Datos del usuario: {
  es_admin: true,
  activo: true,
  nombre: "Admin",
  apellido: "User"
}
❌ Error al obtener datos del usuario: null
🔑 Usuario es administrador activo, redirigiendo...
```

### **❌ Login Fallido:**
```
✅ Autenticación exitosa, verificando tipo de usuario...
📊 Datos del usuario: null
❌ Error al obtener datos del usuario: {
  code: "PGRST116",
  details: "The result contains 0 rows",
  hint: null,
  message: "JSON object requested, multiple (or no) rows returned"
}
```

## 🔧 **Si el Problema Persiste:**

### **1. Verificar Configuración de Supabase:**
- **URL** de Supabase correcta
- **Anon Key** correcta
- **Tabla** `usuario` existe y tiene los campos correctos

### **2. Verificar Permisos RLS:**
```sql
-- Verificar políticas de RLS
SELECT * FROM pg_policies WHERE tablename = 'usuario';
```

### **3. Verificar Usuario en Auth:**
- **Usuario** existe en Supabase Auth
- **Email** confirmado
- **Contraseña** correcta

## ✅ **Estado Actual:**

**¡El sistema de debug está configurado!**

- ✅ **Logs detallados** agregados
- ✅ **Redirección mejorada** con `window.location.href`
- ✅ **Manejo de errores** mejorado
- ✅ **Guía de debugging** completa

**¡Ahora puedes ver exactamente qué está pasando en la consola del navegador!** 🎉

