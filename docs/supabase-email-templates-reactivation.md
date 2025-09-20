# 📧 Plantillas de Correo para Reactivación de Administradores

## 🎯 **Configuración de Plantillas en Supabase**

Para personalizar los correos de reactivación, ve a **Supabase Dashboard > Authentication > Email Templates** y configura las siguientes plantillas:

### **1. Plantilla de Invitación (Reutilizada para Reactivación)**

**Template ID:** `invite`
**Subject:** `Tu acceso de administrador ha sido reactivado - Ecoswap`

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso de Administrador Reactivado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #059669; }
        .info-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Acceso Reactivado</h1>
            <p>Tu cuenta de administrador ha sido reactivada</p>
        </div>
        
        <div class="content">
            <h2>¡Hola {{ .Name }}!</h2>
            
            <p>Te informamos que tu acceso como administrador en <strong>Ecoswap</strong> ha sido reactivado exitosamente.</p>
            
            <div class="info-box">
                <h3>📋 Información de tu cuenta:</h3>
                <ul>
                    <li><strong>Email:</strong> {{ .Email }}</li>
                    <li><strong>Roles asignados:</strong> {{ .Data.roles }}</li>
                    <li><strong>Motivo de reactivación:</strong> {{ .Data.motivo }}</li>
                </ul>
            </div>
            
            <p>Para acceder a tu cuenta, necesitas establecer una nueva contraseña haciendo clic en el botón de abajo:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">
                    🔐 Establecer Nueva Contraseña
                </a>
            </div>
            
            <div class="info-box">
                <h3>⚠️ Importante:</h3>
                <ul>
                    <li>Este enlace es válido por 24 horas</li>
                    <li>Una vez establecida la contraseña, podrás acceder normalmente</li>
                    <li>Si no solicitaste esta reactivación, contacta al soporte</li>
                </ul>
            </div>
            
            <p>Si tienes problemas para acceder, no dudes en contactar al equipo de soporte.</p>
            
            <p>¡Bienvenido de vuelta al equipo de administración!</p>
        </div>
        
        <div class="footer">
            <p>Este correo fue enviado por Ecoswap - Sistema de Gestión</p>
            <p>Si no solicitaste esta reactivación, ignora este correo.</p>
        </div>
    </div>
</body>
</html>
```

### **2. Plantilla de Texto Plano (Alternativa)**

**Text Template:**
```
🔄 ACCESO DE ADMINISTRADOR REACTIVADO - ECOSWAP

¡Hola {{ .Name }}!

Tu acceso como administrador en Ecoswap ha sido reactivado exitosamente.

📋 INFORMACIÓN DE TU CUENTA:
- Email: {{ .Email }}
- Roles asignados: {{ .Data.roles }}
- Motivo de reactivación: {{ .Data.motivo }}

🔐 ESTABLECER NUEVA CONTRASEÑA:
Para acceder a tu cuenta, necesitas establecer una nueva contraseña.

Haz clic en el siguiente enlace:
{{ .ConfirmationURL }}

⚠️ IMPORTANTE:
- Este enlace es válido por 24 horas
- Una vez establecida la contraseña, podrás acceder normalmente
- Si no solicitaste esta reactivación, contacta al soporte

¡Bienvenido de vuelta al equipo de administración!

---
Ecoswap - Sistema de Gestión
Si no solicitaste esta reactivación, ignora este correo.
```

## 🔧 **Configuración Adicional**

### **Variables Disponibles:**
- `{{ .Name }}` - Nombre del administrador
- `{{ .Email }}` - Email del administrador
- `{{ .ConfirmationURL }}` - Enlace para establecer contraseña
- `{{ .Data.roles }}` - Roles asignados (array)
- `{{ .Data.motivo }}` - Motivo de reactivación
- `{{ .Data.reactivation }}` - Indica si es una reactivación (true)

### **Personalización del Enlace:**
El enlace `{{ .ConfirmationURL }}` llevará al administrador a una página donde podrá:
1. Establecer su nueva contraseña
2. Confirmar su cuenta
3. Acceder al sistema

### **Configuración de Tiempo de Expiración:**
En Supabase Dashboard > Authentication > Settings, puedes configurar:
- **JWT expiry limit:** 3600 (1 hora)
- **Email confirmation expiry:** 86400 (24 horas)

## 📱 **Notificaciones Push (Opcional)**

Si tienes notificaciones push configuradas, también se enviará una notificación con el mensaje:

```json
{
  "title": "Acceso de Administrador Reactivado",
  "body": "Tu cuenta ha sido reactivada. Establece tu nueva contraseña para acceder.",
  "data": {
    "type": "admin_reactivated",
    "email": "{{ .Email }}",
    "roles": "{{ .Data.roles }}"
  }
}
```

## ✅ **Verificación**

Para verificar que todo funciona:

1. **Reactivar un administrador** desde el panel
2. **Verificar en logs** que el correo se envió
3. **Revisar el correo** del administrador
4. **Probar el enlace** para establecer contraseña
5. **Verificar login** con la nueva contraseña

## 🎯 **Resultado Final**

Con esta configuración, cuando reactives un administrador:

1. ✅ **Se reactiva** su cuenta en la base de datos
2. ✅ **Se asignan** los roles correspondientes
3. ✅ **Se envía** un correo personalizado
4. ✅ **Se incluye** enlace para establecer contraseña
5. ✅ **Se muestra** información de roles y motivo
6. ✅ **Se notifica** al super admin del éxito

**¡El administrador podrá acceder al sistema con su nueva contraseña!** 🎉
