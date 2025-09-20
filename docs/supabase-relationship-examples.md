# 🔗 Ejemplos de Uso de Relaciones en Supabase - EcoSwap

## ❌ **Problema Identificado**

El error que estás viendo:
```
Could not embed because more than one relationship was found for 'usuario' and 'usuario_rol'
```

Ocurre porque la tabla `usuario_rol` tiene **dos** foreign keys hacia la tabla `usuario`:
1. `usuario_id` → `usuario(user_id)` (usuario que tiene el rol)
2. `asignado_por` → `usuario(user_id)` (usuario que asignó el rol)

## ✅ **Soluciones**

### **Solución 1: Especificar la Relación Explícitamente**

En lugar de usar:
```javascript
// ❌ Esto causa el error
const { data, error } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol(*)
  `)
```

Usa:
```javascript
// ✅ Especificar la relación exacta
const { data, error } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol!usuario_rol_usuario_id_fkey(*)
  `)
```

### **Solución 2: Usar las Vistas Creadas**

```javascript
// ✅ Usar la vista que ya maneja las relaciones
const { data, error } = await supabase
  .from('vista_usuario_roles')
  .select('*')
  .eq('email', 'ecoswap03@gmail.com')
```

### **Solución 3: Consultas Específicas por Relación**

#### **Para obtener el usuario con sus roles:**
```javascript
const { data, error } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol!usuario_rol_usuario_id_fkey(
      *,
      rol_usuario(*)
    )
  `)
  .eq('email', 'ecoswap03@gmail.com')
```

#### **Para obtener quién asignó cada rol:**
```javascript
const { data, error } = await supabase
  .from('usuario_rol')
  .select(`
    *,
    usuario!usuario_rol_asignado_por_fkey(*)
  `)
  .eq('usuario_id', userId)
```

## 🎯 **Ejemplos Prácticos para EcoSwap**

### **1. Obtener Usuario con Información de Admin**

```javascript
// Función para obtener usuario con roles de admin
async function getUsuarioConRoles(email) {
  const { data, error } = await supabase
    .from('usuario')
    .select(`
      user_id,
      nombre,
      apellido,
      email,
      es_admin,
      admin_desde,
      usuario_rol!usuario_rol_usuario_id_fkey(
        activo,
        fecha_asignacion,
        rol_usuario(
          nombre,
          descripcion,
          permisos
        )
      )
    `)
    .eq('email', email)
    .eq('usuario_rol.activo', true)
    .single()

  if (error) {
    console.error('Error:', error)
    return null
  }

  return data
}
```

### **2. Verificar si un Usuario es Super Admin**

```javascript
async function esSuperAdmin(email) {
  const { data, error } = await supabase
    .from('usuario')
    .select(`
      usuario_rol!usuario_rol_usuario_id_fkey(
        rol_usuario!inner(nombre)
      )
    `)
    .eq('email', email)
    .eq('usuario_rol.activo', true)
    .eq('usuario_rol.rol_usuario.nombre', 'super_admin')
    .single()

  return !error && data && data.usuario_rol.length > 0
}
```

### **3. Obtener Todos los Administradores**

```javascript
async function getTodosLosAdmins() {
  const { data, error } = await supabase
    .from('usuario')
    .select(`
      user_id,
      nombre,
      apellido,
      email,
      es_admin,
      admin_desde,
      usuario_rol!usuario_rol_usuario_id_fkey(
        fecha_asignacion,
        rol_usuario(
          nombre,
          descripcion
        )
      )
    `)
    .eq('es_admin', true)
    .eq('usuario_rol.activo', true)

  return data || []
}
```

### **4. Obtener Historial de Asignaciones de Roles**

```javascript
async function getHistorialAsignaciones() {
  const { data, error } = await supabase
    .from('usuario_rol')
    .select(`
      fecha_asignacion,
      usuario!usuario_rol_usuario_id_fkey(
        nombre,
        email
      ),
      rol_usuario(
        nombre,
        descripcion
      ),
      usuario!usuario_rol_asignado_por_fkey(
        nombre,
        email
      )
    `)
    .order('fecha_asignacion', { ascending: false })

  return data || []
}
```

## 🔧 **Configuración en Supabase Dashboard**

1. **Ve a Database > Tables**
2. **Selecciona la tabla `usuario_rol`**
3. **Ve a la pestaña "Relationships"**
4. **Verifica que las foreign keys estén correctamente configuradas:**
   - `usuario_id` → `usuario(user_id)`
   - `asignado_por` → `usuario(user_id)`

## 🚨 **Notas Importantes**

1. **Siempre especifica la relación** cuando hay múltiples foreign keys
2. **Usa las vistas** para consultas complejas frecuentes
3. **Verifica los nombres de las foreign keys** en el dashboard de Supabase
4. **Usa `!inner`** para joins obligatorios
5. **Usa `!left`** para joins opcionales (LEFT JOIN)

## 📝 **Nombres de Relaciones Disponibles**

Después de ejecutar el script de corrección, tendrás estas relaciones:

- `usuario_rol!usuario_rol_usuario_id_fkey` - Usuario que tiene el rol
- `usuario_rol!usuario_rol_asignado_por_fkey` - Usuario que asignó el rol
- `usuario_rol!usuario_rol_rol_id_fkey` - Rol asignado

## 🎉 **Resultado Esperado**

Después de aplicar estas soluciones, podrás hacer consultas como:

```javascript
// ✅ Esto funcionará correctamente
const { data } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol!usuario_rol_usuario_id_fkey(
      *,
      rol_usuario(*)
    )
  `)
```
