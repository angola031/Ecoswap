# 🚀 Promover Usuario a Super Admin

## 📋 Problema Identificado

El usuario `c.angola@utp.edu.co` (ID: 20) **NO es Super Admin**, por eso no aparece el botón "Nuevo Administrador" en la sección de Gestión de Administradores.

### 🔍 Estado Actual del Usuario:
- ✅ **Es admin**: `es_admin = true`
- ✅ **Tiene roles**: `admin_soporte`, `moderador`, `admin_validacion`
- ❌ **NO es Super Admin**: No tiene rol `super_admin`

## 🛠️ Soluciones

### Opción 1: Manual en Supabase Dashboard (Recomendado)

1. **Ve a Supabase Dashboard**:
   - URL: https://supabase.com/dashboard
   - Selecciona tu proyecto EcoSwap

2. **Ve a Table Editor**:
   - Navega a la tabla `usuario_rol`

3. **Insertar nuevo registro**:
   ```sql
   INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
   VALUES (20, 1, true, now());
   ```

4. **Verificar**:
   - `usuario_id`: 20 (ID del usuario c.angola@utp.edu.co)
   - `rol_id`: 1 (ID del rol super_admin)
   - `activo`: true
   - `fecha_asignacion`: fecha actual

### Opción 2: Usando SQL Editor en Supabase

1. **Ve a SQL Editor** en Supabase Dashboard
2. **Ejecuta esta consulta**:
   ```sql
   INSERT INTO usuario_rol (usuario_id, rol_id, activo, fecha_asignacion)
   VALUES (20, 1, true, now());
   ```

### Opción 3: Script en Vercel (Requiere Service Role Key)

1. **Agregar Service Role Key a .env.local** (solo para desarrollo):
   ```bash
   # En .env.local
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

2. **Ejecutar script**:
   ```bash
   node scripts/assign-super-admin-role.js
   ```

## ✅ Verificación

Después de asignar el rol, verifica que funcione:

1. **Recarga la página** de Gestión de Administradores
2. **Verifica en consola** el log:
   ```
   ✅ Verificación de permisos completada: {
     isSuperAdmin: true,
     userEmail: "c.angola@utp.edu.co",
     roles: ["admin_soporte", "moderador", "admin_validacion", "super_admin"]
   }
   ```
3. **Confirma que aparece** el botón "Nuevo Administrador"

## 🔍 Consultas de Verificación

### Verificar usuario actual:
```sql
SELECT u.user_id, u.email, u.es_admin, u.activo
FROM usuario u
WHERE u.email = 'c.angola@utp.edu.co';
```

### Verificar roles del usuario:
```sql
SELECT ur.rol_id, ur.activo, ru.nombre
FROM usuario_rol ur
JOIN rol_usuario ru ON ur.rol_id = ru.rol_id
JOIN usuario u ON ur.usuario_id = u.user_id
WHERE u.email = 'c.angola@utp.edu.co' AND ur.activo = true;
```

### Verificar si es super admin:
```sql
SELECT ur.usuario_id, ur.rol_id, ur.activo
FROM usuario_rol ur
JOIN usuario u ON ur.usuario_id = u.user_id
WHERE u.email = 'c.angola@utp.edu.co' 
  AND ur.rol_id = 1 
  AND ur.activo = true;
```

## 🎯 Resultado Esperado

Después de asignar el rol `super_admin`:

- ✅ El usuario verá el botón "Nuevo Administrador"
- ✅ Podrá crear nuevos administradores
- ✅ Podrá reactivar administradores inactivos
- ✅ Tendrá acceso completo a la gestión de administradores

## 🚨 Notas Importantes

- **Solo Super Admins** pueden crear nuevos administradores
- **El rol super_admin** es el más privilegiado del sistema
- **Una vez asignado**, el usuario tendrá acceso completo a todas las funciones de administración
- **Se recomienda** tener al menos 2 Super Admins para redundancia
