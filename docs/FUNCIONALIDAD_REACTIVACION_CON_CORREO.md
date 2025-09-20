# 📧 Funcionalidad de Reactivación con Correo - Ecoswap

## 🎯 **Descripción**

Cuando reactives un administrador desactivado, el sistema ahora:
1. ✅ **Reactiva** la cuenta del administrador
2. ✅ **Asigna** los roles seleccionados
3. ✅ **Envía** un correo de reactivación
4. ✅ **Incluye** enlace para establecer nueva contraseña
5. ✅ **Notifica** al super admin del éxito

## 🔧 **Archivos Modificados**

### **1. API de Reactivación**
**Archivo:** `app/api/admin/roles/[adminId]/reactivate/route.ts`

**Cambios:**
- ✅ Agregado envío de correo usando `supabaseAdmin.auth.admin.inviteUserByEmail`
- ✅ Incluido información de roles y motivo en el correo
- ✅ Manejo de errores sin fallar la operación
- ✅ Respuesta con confirmación de envío de correo

**Código agregado:**
```typescript
// Enviar correo de reactivación con enlace para establecer nueva contraseña
try {
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        user.email,
        {
            data: {
                name: `${user.nombre} ${user.apellido}`,
                roles: roleNamesList,
                reactivation: true,
                motivo: motivo || 'Reactivación de acceso administrativo'
            }
        }
    )
    // ... manejo de errores
} catch (emailError) {
    // ... manejo de errores
}
```

### **2. Componente de Gestión**
**Archivo:** `components/admin/AdminManagementModule.tsx`

**Cambios:**
- ✅ Mensaje de éxito mejorado con información del correo
- ✅ Confirmación visual de que se envió el correo
- ✅ Información sobre el proceso de establecimiento de contraseña

**Código agregado:**
```typescript
// Mostrar mensaje de éxito con información del correo
if (data.email_enviado) {
    alert(`✅ Administrador reactivado exitosamente!\n\n📧 Se ha enviado un correo a ${selectedAdmin.email} para establecer una nueva contraseña.\n\nEl administrador podrá acceder al sistema una vez que configure su contraseña.`)
} else {
    alert('✅ Administrador reactivado exitosamente!')
}
```

## 📧 **Configuración de Correos**

### **Plantilla de Correo**
**Archivo:** `supabase-email-templates-reactivation.md`

**Incluye:**
- ✅ Diseño HTML profesional
- ✅ Información personalizada del administrador
- ✅ Lista de roles asignados
- ✅ Motivo de reactivación
- ✅ Enlace para establecer contraseña
- ✅ Instrucciones claras
- ✅ Versión en texto plano

### **Variables Disponibles en el Correo:**
- `{{ .Name }}` - Nombre completo del administrador
- `{{ .Email }}` - Email del administrador
- `{{ .ConfirmationURL }}` - Enlace para establecer contraseña
- `{{ .Data.roles }}` - Roles asignados
- `{{ .Data.motivo }}` - Motivo de reactivación
- `{{ .Data.reactivation }}` - Indica que es una reactivación

## 🚀 **Flujo Completo de Reactivación**

### **1. Desde el Panel de Administración:**
1. **Super admin** ve lista de administradores inactivos
2. **Hace clic** en "Reactivar" para un administrador
3. **Selecciona** roles a asignar
4. **Escribe** motivo de reactivación (opcional)
5. **Confirma** la reactivación

### **2. Procesamiento en el Backend:**
1. **Valida** permisos de super admin
2. **Verifica** que el usuario existe
3. **Reactiva** la cuenta (`activo = true`, `es_admin = true`)
4. **Asigna** los roles seleccionados
5. **Envía** correo de reactivación
6. **Crea** notificación en el sistema
7. **Retorna** confirmación de éxito

### **3. Correo al Administrador:**
1. **Recibe** correo personalizado
2. **Ve** información de su cuenta
3. **Hace clic** en enlace para establecer contraseña
4. **Establece** nueva contraseña
5. **Confirma** su cuenta
6. **Accede** al sistema normalmente

### **4. Confirmación al Super Admin:**
1. **Ve** mensaje de éxito
2. **Confirma** que se envió el correo
3. **Lista** se actualiza automáticamente
4. **Administrador** aparece como activo

## 📋 **Casos de Uso**

### **Caso 1: Administrador Despedido Temporalmente**
- **Situación:** Admin suspendido por mal comportamiento
- **Acción:** Super admin lo reactiva después de período de suspensión
- **Resultado:** Admin recibe correo, establece nueva contraseña, vuelve a trabajar

### **Caso 2: Administrador que Olvidó su Contraseña**
- **Situación:** Admin no puede acceder, contraseña perdida
- **Acción:** Super admin lo desactiva y reactiva para forzar cambio de contraseña
- **Resultado:** Admin recibe correo, establece nueva contraseña, accede normalmente

### **Caso 3: Cambio de Roles**
- **Situación:** Admin necesita diferentes permisos
- **Acción:** Super admin lo desactiva, cambia roles, lo reactiva
- **Resultado:** Admin recibe correo con nuevos roles, establece contraseña

### **Caso 4: Reactivación Después de Vacaciones**
- **Situación:** Admin desactivado durante ausencia prolongada
- **Acción:** Super admin lo reactiva al regreso
- **Resultado:** Admin recibe correo, establece contraseña, vuelve a trabajar

## ⚙️ **Configuración Técnica**

### **Requisitos:**
- ✅ Supabase Auth configurado
- ✅ Plantillas de correo personalizadas
- ✅ Permisos de super admin
- ✅ Sistema de notificaciones activo

### **Configuración en Supabase:**
1. **Dashboard > Authentication > Email Templates**
2. **Seleccionar** template "invite"
3. **Copiar** contenido de `supabase-email-templates-reactivation.md`
4. **Guardar** cambios
5. **Probar** con un administrador de prueba

### **Configuración de Tiempo de Expiración:**
- **JWT expiry:** 3600 segundos (1 hora)
- **Email confirmation expiry:** 86400 segundos (24 horas)

## 🔍 **Verificación y Testing**

### **Pasos para Probar:**
1. **Crear** un administrador de prueba
2. **Desactivar** el administrador
3. **Reactivar** con roles específicos
4. **Verificar** que se envía el correo
5. **Abrir** el enlace del correo
6. **Establecer** nueva contraseña
7. **Probar** login con nueva contraseña
8. **Verificar** que los roles están asignados

### **Logs a Revisar:**
```bash
# En la consola del servidor
✅ Correo de reactivación enviado a admin@ejemplo.com
✅ Administrador reactivado exitosamente
```

### **Verificaciones en Supabase:**
- **Auth > Users:** Usuario aparece como activo
- **Database > usuario:** `activo = true`, `es_admin = true`
- **Database > usuario_rol:** Roles asignados correctamente
- **Database > notificacion:** Notificación creada

## 🎯 **Beneficios**

### **Para Super Admins:**
- ✅ **Proceso simple** de reactivación
- ✅ **Confirmación visual** de envío de correo
- ✅ **Trazabilidad** de acciones realizadas
- ✅ **Control total** sobre el proceso

### **Para Administradores Reactivados:**
- ✅ **Correo profesional** y claro
- ✅ **Información completa** de su cuenta
- ✅ **Proceso seguro** de establecimiento de contraseña
- ✅ **Acceso inmediato** después de configurar contraseña

### **Para el Sistema:**
- ✅ **Seguridad mejorada** con contraseñas nuevas
- ✅ **Auditoría completa** de acciones
- ✅ **Comunicación automática** con usuarios
- ✅ **Experiencia de usuario** mejorada

## 🚨 **Consideraciones Importantes**

### **Seguridad:**
- ✅ **Enlaces temporales** (24 horas de validez)
- ✅ **Contraseñas nuevas** obligatorias
- ✅ **Verificación de email** requerida
- ✅ **Logs de auditoría** completos

### **Manejo de Errores:**
- ✅ **Correo falla** → Operación continúa, se notifica
- ✅ **Usuario no existe** → Error claro al super admin
- ✅ **Roles inválidos** → Validación antes de procesar
- ✅ **Permisos insuficientes** → Acceso denegado

### **Rendimiento:**
- ✅ **Operación asíncrona** para envío de correo
- ✅ **No bloquea** la reactivación si falla el correo
- ✅ **Logs detallados** para debugging
- ✅ **Respuesta rápida** al super admin

## ✅ **Estado Final**

**¡La funcionalidad de reactivación con correo está completamente implementada!**

- ✅ **API actualizada** con envío de correo
- ✅ **UI mejorada** con confirmaciones
- ✅ **Plantillas de correo** personalizadas
- ✅ **Documentación completa** del proceso
- ✅ **Manejo de errores** robusto
- ✅ **Experiencia de usuario** optimizada

**El sistema está listo para reactivar administradores con envío automático de correos para establecer nuevas contraseñas.** 🎉
