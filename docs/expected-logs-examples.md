# 📋 Ejemplos de Logs Esperados - Registro de Usuarios

## 🎯 Escenario 1: Registro Exitoso

### Frontend (Consola del Navegador):
```
📱 Campo teléfono cambiado: 3001234567
📱 Formato válido: true
📱 Teléfono limpio: 3001234567 Longitud: 10
📱 Llamando validatePhone...
🔍 Validando teléfono: 3001234567
✅ Formato válido, verificando en BD...
📞 Resultado de verificación: {exists: false, message: ""}
✅ Teléfono disponible

📧 Campo email cambiado: juan@email.com
📧 Formato válido: true
📧 Llamando validateEmail...
📧 Resultado de verificación: {exists: false, message: ""}
✅ Email disponible

🚀 Enviando formulario de registro...
✅ Usuario registrado exitosamente
```

### Backend (Consola del Servidor):
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
✅ Usuario creado exitosamente: {user_id: 15, nombre: "Juan", apellido: "Pérez", ...}
✅ Ubicación creada exitosamente
✅ Configuración creada exitosamente
```

---

## 🚨 Escenario 2: Error de Teléfono Duplicado

### Frontend:
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

### Backend:
```
📞 API check-phone recibió: 3001234567
📞 Teléfono limpio: 3001234567
📞 Consultando BD...
📞 Resultado de BD: {existingUsers: [{user_id: 10, telefono: "3001234567", activo: true}], count: 1, error: null}
📞 Teléfonos encontrados: 1
📞 Usuario activo encontrado: {user_id: 10, telefono: "3001234567", activo: true}
```

---

## 🚨 Escenario 3: Error de Base de Datos - Campo Faltante

### Backend:
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

### Frontend:
```
🚀 Enviando formulario de registro...
❌ Error: Database error saving new user
```

---

## 🚨 Escenario 4: Error de Foreign Key

### Backend:
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

---

## 🚨 Escenario 5: Error de Permisos

### Backend:
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

---

## 🚨 Escenario 6: Error de Conexión

### Frontend:
```
📱 Campo teléfono cambiado: 3001234567
📱 Formato válido: true
📱 Teléfono limpio: 3001234567 Longitud: 10
📱 Llamando validatePhone...
🔍 Validando teléfono: 3001234567
✅ Formato válido, verificando en BD...
❌ Error en validación de teléfono: TypeError: Failed to fetch
```

### Backend:
```
❌ Error in check-phone API: Error: Connection timeout
```

---

## 🚨 Escenario 7: Error de Validación de Email

### Frontend:
```
📧 Campo email cambiado: juan@email.com
📧 Formato válido: true
📧 Llamando validateEmail...
📧 Resultado de verificación: {exists: true, message: "Este correo ya está registrado y verificado. Inicia sesión en su lugar."}
⚠️ Email ya existe
```

---

## 🚨 Escenario 8: Error de OTP

### Backend:
```
❌ Error enviando OTP de registro: {
  message: "Email rate limit exceeded",
  code: "too_many_requests"
}
```

### Frontend:
```
🚀 Enviando formulario de registro...
❌ Error: Email rate limit exceeded
```

---

## 🔍 Cómo Interpretar los Logs

### ✅ **Logs de Éxito:**
- `✅ Usuario creado exitosamente`
- `✅ Ubicación creada exitosamente`
- `✅ Configuración creada exitosamente`
- `✅ Teléfono disponible`
- `✅ Email disponible`

### ❌ **Logs de Error:**
- `❌ Error al crear perfil de usuario`
- `❌ Error en validación de teléfono`
- `❌ Error in check-phone API`
- `❌ Error enviando OTP de registro`

### 🔍 **Logs de Debug:**
- `📱 Campo teléfono cambiado`
- `📞 API check-phone recibió`
- `👤 Creando usuario`
- `📞 Consultando BD...`

---

## 🚀 Pasos para Diagnosticar

1. **Abre la consola del navegador** (F12)
2. **Intenta registrar un usuario**
3. **Copia TODOS los logs** que aparezcan
4. **Compara con estos ejemplos**
5. **Identifica el patrón de error**
6. **Usa el código de error** para encontrar la solución

---

## 📞 Códigos de Error Comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `23502` | Campo requerido está NULL | Agregar campo faltante |
| `23503` | Foreign key inválida | Verificar que el registro referenciado existe |
| `23505` | Valor duplicado | Usar valor único |
| `42501` | Sin permisos | Verificar permisos de la aplicación |
| `42P01` | Tabla no existe | Verificar que la tabla existe |
| `too_many_requests` | Demasiadas solicitudes | Esperar y reintentar |
| `invalid_grant` | Token inválido | Verificar código OTP |
