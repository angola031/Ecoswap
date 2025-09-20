# 🚫 Guía para Evitar Error de Relaciones Múltiples - Supabase

## ❌ **Error Común:**
```
Could not embed because more than one relationship was found for 'usuario' and 'usuario_rol'
```

## 🔍 **Causa del Error:**
La tabla `usuario_rol` tiene **dos foreign keys** hacia `usuario`:
1. `usuario_id` → `usuario(user_id)` (usuario que tiene el rol)
2. `asignado_por` → `usuario(user_id)` (usuario que asignó el rol)

## ✅ **Solución: Especificar la Relación Exacta**

### **❌ INCORRECTO:**
```javascript
const { data } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol (
      rol_id,
      activo,
      rol_usuario (
        nombre
      )
    )
  `)
```

### **✅ CORRECTO:**
```javascript
const { data } = await supabase
  .from('usuario')
  .select(`
    *,
    usuario_rol!usuario_rol_usuario_id_fkey (
      rol_id,
      activo,
      rol_usuario (
        nombre
      )
    )
  `)
```

## 🎯 **Relaciones Disponibles:**

### **1. Para obtener el usuario que tiene el rol:**
```javascript
usuario_rol!usuario_rol_usuario_id_fkey
```

### **2. Para obtener quién asignó el rol:**
```javascript
usuario_rol!usuario_rol_asignado_por_fkey
```

### **3. Para obtener el rol asignado:**
```javascript
usuario_rol!usuario_rol_rol_id_fkey
```

## 📝 **Ejemplos Prácticos:**

### **Ejemplo 1: Usuario con sus roles**
```javascript
const { data } = await supabase
  .from('usuario')
  .select(`
    user_id,
    nombre,
    email,
    usuario_rol!usuario_rol_usuario_id_fkey (
      rol_id,
      activo,
      rol_usuario (
        nombre,
        descripcion
      )
    )
  `)
```

### **Ejemplo 2: Usuario con roles y quién los asignó**
```javascript
const { data } = await supabase
  .from('usuario')
  .select(`
    user_id,
    nombre,
    email,
    usuario_rol!usuario_rol_usuario_id_fkey (
      rol_id,
      activo,
      rol_usuario (
        nombre,
        descripcion
      ),
      asignado_por:usuario!usuario_rol_asignado_por_fkey (
        nombre,
        email
      )
    )
  `)
```

### **Ejemplo 3: Solo quién asignó cada rol**
```javascript
const { data } = await supabase
  .from('usuario_rol')
  .select(`
    rol_id,
    fecha_asignacion,
    usuario!usuario_rol_asignado_por_fkey (
      nombre,
      email
    )
  `)
```

## 🔧 **Verificación Rápida:**

Antes de usar `usuario_rol` en una consulta, pregúntate:

1. **¿Qué relación necesito?**
   - Usuario que tiene el rol → `usuario_rol!usuario_rol_usuario_id_fkey`
   - Usuario que asignó el rol → `usuario_rol!usuario_rol_asignado_por_fkey`

2. **¿Estoy especificando la relación?**
   - ✅ `usuario_rol!usuario_rol_usuario_id_fkey`
   - ❌ `usuario_rol`

3. **¿Necesito ambas relaciones?**
   - Sí → Usar ambas en la misma consulta
   - No → Usar solo la que necesitas

## 🚨 **Errores Comunes a Evitar:**

### **1. No especificar la relación:**
```javascript
// ❌ MALO
usuario_rol (
  rol_id,
  activo
)
```

### **2. Usar sintaxis incorrecta:**
```javascript
// ❌ MALO
usuario_rol.usuario_id_fkey
```

### **3. Mezclar sintaxis:**
```javascript
// ❌ MALO
usuario_rol!usuario_rol_usuario_id_fkey (
  asignado_por:usuario!usuario_rol_asignado_por_fkey
)
```

## ✅ **Patrón Correcto:**

```javascript
// ✅ BUENO
usuario_rol!usuario_rol_usuario_id_fkey (
  rol_id,
  activo,
  fecha_asignacion,
  rol_usuario (
    nombre,
    descripcion
  ),
  asignado_por:usuario!usuario_rol_asignado_por_fkey (
    nombre,
    email
  )
)
```

## 🔍 **Cómo Verificar si tu Consulta es Correcta:**

1. **Busca `usuario_rol`** en tu consulta
2. **Verifica que tenga `!`** después del nombre
3. **Confirma que especifique la foreign key** completa
4. **Prueba la consulta** en Supabase Dashboard

## 📚 **Archivos que ya están corregidos:**

- ✅ `app/api/admin/roles/route.ts`
- ✅ `app/api/admin/roles/[adminId]/route.ts`
- ✅ `app/api/admin/roles/[adminId]/reactivate/route.ts`
- ✅ `app/api/admin/roles/inactive/route.ts`
- ✅ `app/api/admin/roles/[adminId]/invite/route.ts`
- ✅ `lib/admin-queries.ts`

## 🎯 **Resumen:**

**SIEMPRE especifica la relación exacta cuando uses `usuario_rol`:**

- `usuario_rol!usuario_rol_usuario_id_fkey` - Para el usuario que tiene el rol
- `usuario_rol!usuario_rol_asignado_por_fkey` - Para quién asignó el rol

**¡Con esto evitarás el error de relaciones múltiples!** 🎉
