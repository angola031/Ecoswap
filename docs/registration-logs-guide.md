# 📋 Guía de Logs de Registro - EcoSwap

## 🔍 Logs del Frontend (Consola del Navegador)

### ✅ **Registro Exitoso**
```
📱 Campo teléfono cambiado: 3001234567
📱 Formato válido: true
📱 Teléfono limpio: 3001234567 Longitud: 10
📱 Llamando validatePhone...
🔍 Validando teléfono: 3001234567
✅ Formato válido, verificando en BD...
📞 Resultado de verificación: {exists: false, message: ""}
✅ Teléfono disponible
```

### ❌ **Error de Validación de Teléfono**
```
📱 Campo teléfono cambiado: 2001234567
📱 Formato válido: false
📱 Formato inválido, mostrando error
❌ Formato de teléfono inválido
```

### ❌ **Teléfono Ya Registrado**
```
📱 Campo teléfono cambiado: 3001234567
📱 Formato válido: true
📱 Teléfono limpio: 3001234567 Longitud: 10
📱 Llamando validatePhone...
🔍 Validando teléfono: 3001234567
✅ Formato válido, verificando en BD...
📞 Resultado de verificación: {exists: true, message: "Este número de teléfono ya está registrado."}
⚠️ Teléfono ya existe
```

### ❌ **Error de Conexión API**
```
📱 Campo teléfono cambiado: 3001234567
📱 Formato válido: true
📱 Teléfono limpio: 3001234567 Longitud: 10
📱 Llamando validatePhone...
🔍 Validando teléfono: 3001234567
✅ Formato válido, verificando en BD...
❌ Error en validación de teléfono: TypeError: Failed to fetch
```

---

## 🔍 Logs del Backend (Consola del Servidor)

### ✅ **Registro Exitoso**
```
📞 API check-phone recibió: 3001234567
📞 Teléfono limpio: 3001234567
📞 Consultando BD...
📞 Resultado de BD: {existingUsers: [], count: 0, error: null}
📞 Teléfono no encontrado, disponible

👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
✅ Usuario creado exitosamente: {user_id: 15, nombre: "Juan", ...}
✅ Ubicación creada exitosamente
✅ Configuración creada exitosamente
```

### ❌ **Error de Base de Datos - Campo Faltante**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "null value in column \"fecha_registro\" violates not-null constraint",
  code: "23502",
  details: "Failing row contains (15, Juan, Pérez, juan@email.com, 3001234567, supabase_auth, null, null, null, 0, 0, 0, null, true, true, null, null, null, null, null, 123e4567-e89b-12d3-a456-426614174000)."
}
```

### ❌ **Error de Base de Datos - Foreign Key**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "insert or update on table \"usuario\" violates foreign key constraint \"usuario_auth_user_id_fkey\"",
  code: "23503",
  details: "Key (auth_user_id)=(123e4567-e89b-12d3-a456-426614174000) is not present in table \"users\"."
}
```

### ❌ **Error de Base de Datos - Email Duplicado**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "duplicate key value violates unique constraint \"usuario_email_key\"",
  code: "23505",
  details: "Key (email)=(juan@email.com) already exists."
}
```

### ❌ **Error de Base de Datos - Teléfono Duplicado**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "duplicate key value violates unique constraint \"usuario_telefono_key\"",
  code: "23505",
  details: "Key (telefono)=(3001234567) already exists."
}
```

### ❌ **Error de Base de Datos - Permisos**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "permission denied for table usuario",
  code: "42501",
  details: null
}
```

### ❌ **Error de Base de Datos - Tabla No Existe**
```
👤 Creando usuario: {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@email.com",
  telefono: "3001234567",
  password_hash: "supabase_auth",
  verificado: true,
  activo: true,
  auth_user_id: "123e4567-e89b-12d3-a456-426614174000"
}
❌ Error al crear perfil de usuario: {
  message: "relation \"public.usuario\" does not exist",
  code: "42P01",
  details: null
}
```

### ❌ **Error de Ubicación**
```
✅ Usuario creado exitosamente: {user_id: 15, nombre: "Juan", ...}
❌ Error al crear ubicación: {
  message: "insert or update on table \"ubicacion\" violates foreign key constraint \"ubicacion_user_id_fkey\"",
  code: "23503",
  details: "Key (user_id)=(15) is not present in table \"usuario\"."
}
```

### ❌ **Error de Configuración**
```
✅ Usuario creado exitosamente: {user_id: 15, nombre: "Juan", ...}
✅ Ubicación creada exitosamente
❌ Error al crear configuración: {
  message: "insert or update on table \"configuracion_usuario\" violates foreign key constraint \"configuracion_usuario_usuario_id_fkey\"",
  code: "23503",
  details: "Key (usuario_id)=(15) is not present in table \"usuario\"."
}
```

---

## 🔍 Logs de Supabase Auth

### ✅ **OTP Enviado Exitosamente**
```
✅ OTP enviado a juan@email.com
✅ Usuario creado en auth.users: 123e4567-e89b-12d3-a456-426614174000
```

### ❌ **Error de OTP**
```
❌ Error enviando OTP de registro: {
  message: "Email rate limit exceeded",
  code: "too_many_requests"
}
```

### ❌ **Error de Verificación OTP**
```
❌ Error verificando OTP: {
  message: "Invalid token",
  code: "invalid_grant"
}
```

---

## 🚨 Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `23502` | NOT NULL constraint violation | Campo requerido está NULL |
| `23503` | Foreign key constraint violation | Referencia a registro inexistente |
| `23505` | Unique constraint violation | Valor duplicado (email, teléfono) |
| `42501` | Permission denied | Sin permisos en la tabla |
| `42P01` | Table does not exist | Tabla no existe |
| `too_many_requests` | Rate limit exceeded | Demasiadas solicitudes |
| `invalid_grant` | Invalid token | Código OTP inválido |

---

## 🔧 Cómo Diagnosticar

1. **Abre la consola del navegador** (F12)
2. **Intenta registrar un usuario**
3. **Copia todos los logs** que aparezcan
4. **Compara con los ejemplos** de arriba
5. **Identifica el código de error** específico
6. **Usa la tabla de códigos** para entender el problema

---

## 📞 Para Obtener Ayuda

Cuando reportes un problema, incluye:
- ✅ **Logs completos** del navegador y servidor
- ✅ **Código de error** específico
- ✅ **Datos que intentaste insertar**
- ✅ **Resultado del script de diagnóstico**
