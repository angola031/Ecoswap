# 🚀 Instrucciones de Configuración para EcoSwap con Supabase

## 📋 Pasos para Configurar la Autenticación

### 1. **Configurar Variables de Entorno**

Crea un archivo `.env.local` en la raíz de tu proyecto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vaqdzualcteljmivtoka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Para obtener las claves:**
1. Ve a tu proyecto de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. **Ejecutar Script SQL en Supabase**

1. Ve a tu dashboard de Supabase
2. Ve a **SQL Editor**
3. Ejecuta el script `supabase-simple-setup.sql` que creamos

Este script:
- ✅ Habilita RLS (Row Level Security) en las tablas
- ✅ Crea políticas de seguridad básicas
- ✅ Agrega índices para mejor rendimiento
- ✅ Configura permisos para usuarios

### 3. **Configurar URLs de Redirección**

En tu dashboard de Supabase:

1. Ve a **Authentication** > **Settings**
2. Configura:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: 
     - `http://localhost:3000/verificacion`
     - `http://localhost:3000/auth/callback`

### 4. **Personalizar Plantillas de Email**

1. Ve a **Authentication** > **Email Templates**
2. Personaliza las plantillas usando el archivo `supabase-email-templates.md`

### 5. **Instalar Dependencias y Ejecutar**

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## 🔄 **Flujo de Registro y Autenticación**

### **Registro de Usuario:**
1. Usuario llena el formulario de registro
2. Se crea cuenta en Supabase Auth
3. Se envía email de confirmación automáticamente
4. Usuario hace clic en el enlace del email
5. Se verifica la cuenta y se crea perfil en tabla `USUARIO`
6. Se crean registros en `UBICACION` y `CONFIGURACION_USUARIO`

### **Login de Usuario:**
1. Usuario ingresa email y contraseña
2. Supabase Auth valida las credenciales
3. Se busca el perfil en la tabla `USUARIO` por email
4. Se actualiza `ultima_conexion`
5. Se inicia sesión exitosamente

## 📊 **Estructura de Datos**

### **Tabla USUARIO:**
- `user_id` (SERIAL PRIMARY KEY) - ID numérico único
- `nombre` - Nombre del usuario
- `apellido` - Apellido del usuario
- `email` - Email (único, usado para login)
- `telefono` - Teléfono del usuario
- `password_hash` - Marcador "supabase_auth"
- `verificado` - Estado de verificación
- `activo` - Estado de la cuenta
- `ultima_conexion` - Última vez que inició sesión

### **Tabla UBICACION:**
- Se crea automáticamente con la ubicación del usuario
- `es_principal = true` para la ubicación principal

### **Tabla CONFIGURACION_USUARIO:**
- Se crea automáticamente con configuración por defecto
- Notificaciones habilitadas por defecto

## 🛠️ **Funcionalidades Implementadas**

### ✅ **Autenticación Completa:**
- Registro con verificación de email
- Login con validación
- Logout seguro
- Verificación de sesión automática

### ✅ **Integración con Base de Datos:**
- Creación automática de perfiles
- Sincronización con Supabase Auth
- Manejo de ubicaciones y configuraciones

### ✅ **Interfaz de Usuario:**
- Formularios de registro y login
- Pantalla de verificación de email
- Mensajes de error y éxito
- Reenvío de emails de confirmación

## 🐛 **Solución de Problemas**

### **Error: "Invalid API key"**
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el archivo `.env.local` esté en la raíz

### **Error: "relation does not exist"**
- Ejecuta el script SQL en Supabase
- Verifica que las tablas se crearon correctamente

### **Error: "permission denied"**
- Ejecuta el script `supabase-simple-setup.sql`
- Verifica que las políticas RLS estén activas

### **Email no llega:**
- Verifica la configuración de URLs de redirección
- Revisa la carpeta de spam
- Usa el botón "Reenviar Email de Verificación"

## 🎯 **Próximos Pasos**

1. **Probar el registro** - Crea una cuenta de prueba
2. **Verificar email** - Confirma que llega el email
3. **Probar login** - Inicia sesión después de verificar
4. **Personalizar plantillas** - Modifica los emails según tu marca

## 📞 **Soporte**

Si tienes problemas:
1. Verifica que Supabase esté funcionando (dashboard verde)
2. Revisa la consola del navegador para errores
3. Verifica que las variables de entorno estén configuradas
4. Asegúrate de que el script SQL se ejecutó correctamente

¡Tu sistema de autenticación está listo para usar! 🎉
