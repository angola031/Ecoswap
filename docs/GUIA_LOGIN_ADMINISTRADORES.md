# 🔐 Guía de Login para Administradores - EcoSwap

## 📋 **Proceso de Creación y Login de Administradores**

### **1. Creación de Administrador (Super Admin)**

Cuando un Super Admin crea un nuevo administrador:

1. **Se crea el usuario** en Supabase Auth
2. **Se envía un email de invitación** (si está habilitado)
3. **El usuario recibe un email** con un enlace para configurar su contraseña

### **2. Proceso de Login para el Nuevo Administrador**

#### **Opción A: Con Email de Invitación (Recomendado)**
1. **Revisar el email** enviado a la dirección del administrador
2. **Hacer clic en el enlace** del email
3. **Configurar la contraseña** en la página que se abre
4. **Iniciar sesión** con email y contraseña

#### **Opción B: Sin Email de Invitación**
Si no se envió el email o no llegó:

1. **Ir a la página de login** de EcoSwap
2. **Hacer clic en "¿Olvidaste tu contraseña?"**
3. **Ingresar el email** del administrador
4. **Revisar el email** para el enlace de restablecimiento
5. **Configurar la contraseña** y hacer login

### **3. Configuración de Supabase Auth**

Para que funcione correctamente, asegúrate de que en Supabase:

#### **Authentication > Settings:**
- ✅ **Enable email confirmations** - Activado
- ✅ **Enable email invitations** - Activado
- ✅ **Site URL** - `http://localhost:3000` (desarrollo) o tu dominio
- ✅ **Redirect URLs** - Incluir `http://localhost:3000/auth/callback`

#### **Authentication > Email Templates:**
- ✅ **Confirm signup** - Personalizado para administradores
- ✅ **Invite user** - Personalizado para invitaciones de admin

### **4. Solución de Problemas**

#### **Problema: No llega el email de invitación**
**Solución:**
1. Verificar que `enviarInvitacion: true` en el formulario
2. Revisar la carpeta de spam
3. Usar la función de reenvío de invitación

#### **Problema: El enlace del email no funciona**
**Solución:**
1. Verificar que las URLs de redirección estén configuradas en Supabase
2. Asegurarse de que el sitio esté funcionando
3. Probar con "¿Olvidaste tu contraseña?"

#### **Problema: Error al configurar contraseña**
**Solución:**
1. Verificar que el token no haya expirado (válido por 24 horas)
2. Solicitar un nuevo enlace de restablecimiento
3. Contactar al Super Admin para reenviar invitación

### **5. Funciones Disponibles**

#### **Para Super Admins:**

1. **Crear administrador con invitación:**
```javascript
// En el formulario de creación
{
  email: "admin@ejemplo.com",
  nombre: "Juan",
  apellido: "Pérez",
  roles: [1, 2], // IDs de roles
  enviarInvitacion: true // ← Importante
}
```

2. **Reenviar invitación:**
```javascript
// POST /api/admin/roles/[adminId]/invite
// Reenvía el email de invitación a un administrador existente
```

3. **Verificar estado del administrador:**
```javascript
// GET /api/admin/roles/[adminId]
// Obtiene información del administrador incluyendo si está verificado
```

### **6. Flujo Completo de Ejemplo**

#### **Paso 1: Super Admin crea administrador**
```javascript
// POST /api/admin/roles
{
  "email": "nuevo.admin@ecoswap.com",
  "nombre": "María",
  "apellido": "García",
  "telefono": "+57 300 123 4567",
  "roles": [2, 3], // admin_validacion, admin_soporte
  "enviarInvitacion": true
}
```

#### **Paso 2: Sistema envía email**
- ✅ Usuario creado en Supabase Auth
- ✅ Email de invitación enviado
- ✅ Notificación creada en la base de datos

#### **Paso 3: Nuevo administrador recibe email**
- 📧 Email con enlace para configurar contraseña
- 🔗 Enlace válido por 24 horas
- 📱 Información sobre sus roles asignados

#### **Paso 4: Configuración de contraseña**
- 🌐 Hace clic en el enlace del email
- 🔐 Configura su contraseña
- ✅ Cuenta verificada automáticamente

#### **Paso 5: Login exitoso**
- 🚀 Puede hacer login con email y contraseña
- 👤 Acceso completo según sus roles
- 📊 Aparece en el panel de administración

### **7. URLs Importantes**

- **Login:** `http://localhost:3000/login`
- **Restablecer contraseña:** `http://localhost:3000/forgot-password`
- **Callback de Supabase:** `http://localhost:3000/auth/callback`
- **Panel de administración:** `http://localhost:3000/admin`

### **8. Verificación de Configuración**

Para verificar que todo está configurado correctamente:

1. **Crear un administrador de prueba**
2. **Verificar que llega el email**
3. **Probar el proceso de configuración de contraseña**
4. **Verificar que puede hacer login**
5. **Confirmar que tiene los permisos correctos**

### **9. Notas Importantes**

- ⚠️ **Los emails de invitación expiran en 24 horas**
- ⚠️ **Solo Super Admins pueden crear otros administradores**
- ⚠️ **Los administradores necesitan verificar su email antes de poder hacer login**
- ⚠️ **Si no llega el email, usar la función de reenvío**

### **10. Contacto de Soporte**

Si tienes problemas con el proceso de login de administradores:

1. Verificar la configuración de Supabase Auth
2. Revisar los logs del servidor
3. Probar con un email diferente
4. Usar la función de reenvío de invitación

¡Con esta configuración, el proceso de creación y login de administradores debería funcionar perfectamente! 🎉
