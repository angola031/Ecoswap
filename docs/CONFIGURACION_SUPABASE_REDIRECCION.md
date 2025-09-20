# 🔧 Configuración de Redirección en Supabase

## 🎯 **Problema Identificado:**

El correo de Supabase está redirigiendo a la página por defecto de Supabase en lugar de tu aplicación personalizada.

## ✅ **Solución Completa:**

### **1. Configuración en Supabase Dashboard:**

#### **Paso 1: Ir a Authentication Settings**
1. **Abre** Supabase Dashboard
2. **Ve** a **Authentication** → **Settings**
3. **Busca** la sección **"URL Configuration"**

#### **Paso 2: Configurar URLs**
```
Site URL: http://localhost:3000
Redirect URLs:
- http://localhost:3000/auth/supabase-redirect
- http://localhost:3000/auth/callback
- http://localhost:3000/auth/reset-password
- http://localhost:3000/dashboard
- http://localhost:3000/
```

#### **Paso 3: Configurar Email Templates**
1. **Ve** a **Authentication** → **Email Templates**
2. **Selecciona** "Reset Password"
3. **Copia** tu plantilla personalizada:

```html
<title>Restablecer contraseña - EcoSwap Colombia</title>
<style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .btn:hover { background: #059669; }
    .logo { font-size: 24px; margin-bottom: 10px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
</style>
<div class="container">
    <div class="header">
        <div class="logo">🌱 EcoSwap Colombia</div>
        <h1>Restablecer contraseña</h1>
    </div>
    
    <div class="content">
        <h2>Hola,</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>EcoSwap Colombia</strong>.</p>
        
        <div style="text-align: center;">
            <a href="{{ .ConfirmationURL }}" class="btn">Restablecer mi contraseña</a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
                <li>Este enlace expira en 24 horas</li>
                <li>Solo puedes usarlo una vez</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
            </ul>
        </div>
        
        <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu cuenta permanecerá protegida.</p>
        
        <p>Saludos,<br>
        <strong>El equipo de EcoSwap Colombia</strong></p>
    </div>
    
    <div class="footer">
        <p>Este email fue enviado desde EcoSwap Colombia</p>
        <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #10b981;">{{ .ConfirmationURL }}</p>
    </div>
</div>
```

### **2. Código Actualizado:**

#### **API de Reactivación:**
```typescript
// En app/api/admin/roles/[adminId]/reactivate/route.ts
const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
    user.email,
    {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/supabase-redirect?type=recovery&next=/auth/reset-password`
    }
)
```

#### **Página de Redirección:**
```typescript
// En app/auth/supabase-redirect/page.tsx
// Maneja la redirección desde Supabase y procesa los tokens
```

### **3. Flujo Completo:**

#### **1. Usuario Recibe Correo:**
- **Correo** con plantilla personalizada
- **Enlace** apunta a `/auth/supabase-redirect?type=recovery&next=/auth/reset-password`
- **Supabase** agrega tokens automáticamente

#### **2. Usuario Hace Clic:**
- **URL final:** `https://tu-dominio.com/auth/supabase-redirect?type=recovery&next=/auth/reset-password&access_token=...&refresh_token=...`
- **Página** procesa los tokens
- **Establece** sesión automáticamente

#### **3. Redirección:**
- **Si es recovery:** Va a `/auth/reset-password?reactivation=true`
- **Si es admin:** Va a `/dashboard`
- **Si es cliente:** Va a `/`

## 🔧 **Configuración de Variables de Entorno:**

### **Archivo `.env.local`:**
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## 🚀 **Pasos para Probar:**

### **1. Configurar Supabase:**
1. **Actualiza** las URLs en Supabase Dashboard
2. **Guarda** la plantilla de correo personalizada
3. **Verifica** que las URLs estén correctas

### **2. Probar Reactivación:**
1. **Reactivar** un administrador desde el panel
2. **Verificar** que se envía el correo
3. **Abrir** el enlace del correo
4. **Confirmar** que va a `/auth/supabase-redirect`
5. **Verificar** que es redirigido a `/auth/reset-password?reactivation=true`

### **3. Probar Reset de Contraseña:**
1. **Establecer** nueva contraseña
2. **Confirmar** que es redirigido al dashboard
3. **Verificar** que puede acceder normalmente

## 🎯 **URLs del Flujo:**

### **Correo Enviado:**
```
https://tu-dominio.com/auth/supabase-redirect?type=recovery&next=/auth/reset-password
```

### **URL Real (con tokens):**
```
https://tu-dominio.com/auth/supabase-redirect?type=recovery&next=/auth/reset-password&access_token=eyJ...&refresh_token=eyJ...
```

### **Redirección Final:**
```
https://tu-dominio.com/auth/reset-password?reactivation=true
```

## ✅ **Ventajas de esta Solución:**

### **✅ Compatibilidad:**
- **Funciona** con la plantilla personalizada de Supabase
- **Mantiene** el diseño del correo
- **Procesa** tokens automáticamente

### **✅ Flexibilidad:**
- **Maneja** diferentes tipos de redirección
- **Detecta** tipo de usuario automáticamente
- **Redirige** según el contexto

### **✅ Experiencia:**
- **Correo** con diseño personalizado
- **Redirección** transparente
- **Proceso** fluido para el usuario

## 🚨 **Troubleshooting:**

### **Si el correo sigue redirigiendo mal:**
1. **Verifica** que las URLs estén configuradas en Supabase
2. **Confirma** que `NEXT_PUBLIC_SITE_URL` esté correcta
3. **Revisa** los logs de la consola para errores

### **Si no se establece la sesión:**
1. **Verifica** que los tokens estén llegando
2. **Confirma** que la página de redirección esté funcionando
3. **Revisa** la configuración de Supabase

## ✅ **Estado Final:**

**¡La redirección está completamente configurada!**

- ✅ **Correo** con plantilla personalizada
- ✅ **Redirección** a página personalizada
- ✅ **Procesamiento** automático de tokens
- ✅ **Sesión** establecida correctamente
- ✅ **Experiencia** de usuario optimizada

**¡Ahora el correo de Supabase redirigirá correctamente a tu página de reset de contraseña!** 🎉
