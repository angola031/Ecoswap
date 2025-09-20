# Plantillas de Email para Supabase Auth

## 📧 Configuración de Plantillas de Email

Para personalizar los emails de verificación en Supabase, ve a tu dashboard y configura las siguientes plantillas:

### 1. **Email de Confirmación de Registro**

**Ruta en Supabase**: Authentication > Email Templates > Confirm signup

**Asunto del Email**:
```
¡Bienvenido a EcoSwap Colombia! Confirma tu cuenta
```

**Contenido del Email** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmar cuenta - EcoSwap Colombia</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .btn:hover { background: #059669; }
        .logo { font-size: 24px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌱 EcoSwap Colombia</div>
            <h1>¡Bienvenido a la comunidad!</h1>
        </div>
        
        <div class="content">
            <h2>¡Hola!</h2>
            <p>Gracias por registrarte en <strong>EcoSwap Colombia</strong>, la plataforma líder de intercambio sostenible.</p>
            
            <p>Para completar tu registro y comenzar a intercambiar productos, necesitas confirmar tu dirección de email.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="btn">Confirmar mi cuenta</a>
            </div>
            
            <p><strong>¿Qué puedes hacer en EcoSwap?</strong></p>
            <ul>
                <li>🔄 Intercambiar productos de segunda mano</li>
                <li>💰 Vender artículos que ya no necesitas</li>
                <li>🎁 Donar objetos a personas que los necesiten</li>
                <li>🌱 Contribuir a la economía circular</li>
                <li>📍 Conectar con personas de tu ciudad</li>
            </ul>
            
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
            
            <p>¡Esperamos verte pronto en la plataforma!</p>
            
            <p>Saludos,<br>
            <strong>El equipo de EcoSwap Colombia</strong></p>
        </div>
        
        <div class="footer">
            <p>Este email fue enviado desde EcoSwap Colombia</p>
            <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #10b981;">{{ .ConfirmationURL }}</p>
        </div>
    </div>
</body>
</html>
```

### 2. **Email de Recuperación de Contraseña**

**Ruta en Supabase**: Authentication > Email Templates > Reset password

**Asunto del Email**:
```
Restablece tu contraseña - EcoSwap Colombia
```

**Contenido del Email** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
</head>
<body>
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
</body>
</html>
```

### 3. **Email de Cambio de Email**

**Ruta en Supabase**: Authentication > Email Templates > Change email address

**Asunto del Email**:
```
Confirma tu nuevo email - EcoSwap Colombia
```

**Contenido del Email** (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmar nuevo email - EcoSwap Colombia</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
        .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .btn:hover { background: #059669; }
        .logo { font-size: 24px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌱 EcoSwap Colombia</div>
            <h1>Confirmar nuevo email</h1>
        </div>
        
        <div class="content">
            <h2>Hola,</h2>
            <p>Recibimos una solicitud para cambiar la dirección de email de tu cuenta en <strong>EcoSwap Colombia</strong>.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="btn">Confirmar nuevo email</a>
            </div>
            
            <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
            
            <p>Saludos,<br>
            <strong>El equipo de EcoSwap Colombia</strong></p>
        </div>
        
        <div class="footer">
            <p>Este email fue enviado desde EcoSwap Colombia</p>
            <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #10b981;">{{ .ConfirmationURL }}</p>
        </div>
    </div>
</body>
</html>
```

## 🔧 Configuración en Supabase

### Pasos para configurar las plantillas:

1. **Ve a tu dashboard de Supabase**
2. **Selecciona tu proyecto**
3. **Ve a Authentication > Email Templates**
4. **Selecciona la plantilla que quieres personalizar**
5. **Copia y pega el contenido HTML correspondiente**
6. **Guarda los cambios**

### Variables disponibles en las plantillas:

- `{{ .ConfirmationURL }}` - URL de confirmación
- `{{ .Email }}` - Email del usuario
- `{{ .Token }}` - Token de verificación
- `{{ .SiteURL }}` - URL de tu sitio

### Configuración adicional recomendada:

1. **URL de redirección**: Configura `http://localhost:3000/verificacion` para desarrollo
2. **URL de redirección de producción**: Configura tu dominio de producción
3. **Límite de envíos**: Configura límites para evitar spam
4. **Dominio personalizado**: Configura un dominio personalizado para los emails

## 📱 Personalización adicional

Puedes personalizar aún más las plantillas agregando:
- Logo de tu empresa
- Colores de marca
- Enlaces a redes sociales
- Información de contacto
- Términos y condiciones
