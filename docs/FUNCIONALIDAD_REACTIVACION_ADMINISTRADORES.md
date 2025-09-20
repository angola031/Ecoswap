# 🔄 Funcionalidad de Reactivación de Administradores - EcoSwap

## 📋 **Resumen de la Funcionalidad**

Se ha implementado un sistema completo de **soft delete** (eliminación suave) para administradores, permitiendo desactivarlos y reactivarlos posteriormente sin perder su información.

## ✨ **Características Implementadas**

### **1. Soft Delete (Eliminación Suave)**
- ✅ **No se elimina físicamente** el usuario de la base de datos
- ✅ **Se marca como inactivo** (`es_admin: false`, `activo: false`)
- ✅ **Se conserva el historial** de roles y asignaciones
- ✅ **Se registra el motivo** de desactivación
- ✅ **Se guarda quién desactivó** al administrador

### **2. Reactivación Completa**
- ✅ **Reactivar administradores** desactivados
- ✅ **Reasignar roles** durante la reactivación
- ✅ **Registrar motivo** de reactivación
- ✅ **Notificaciones automáticas** al usuario reactivado
- ✅ **Actualización de fechas** de desbloqueo

### **3. Interfaz de Usuario**
- ✅ **Botón "Ver Inactivos"** en el panel de administración
- ✅ **Lista de administradores inactivos** con información detallada
- ✅ **Modal de reactivación** con selección de roles
- ✅ **Indicadores visuales** para distinguir activos/inactivos

## 🔧 **APIs Implementadas**

### **1. Desactivar Administrador**
```http
DELETE /api/admin/roles/[adminId]
```
**Funcionalidad:**
- Desactiva un administrador (soft delete)
- Desactiva todos sus roles
- Registra motivo y fecha de desactivación
- Envía notificación al usuario

### **2. Reactivar Administrador**
```http
POST /api/admin/roles/[adminId]/reactivate
```
**Body:**
```json
{
  "roles": [1, 2, 3],
  "motivo": "Motivo de la reactivación"
}
```
**Funcionalidad:**
- Reactiva el usuario como administrador
- Asigna nuevos roles
- Registra motivo de reactivación
- Envía notificación al usuario

### **3. Listar Administradores Inactivos**
```http
GET /api/admin/roles/inactive
```
**Funcionalidad:**
- Obtiene lista de administradores desactivados
- Incluye información de roles anteriores
- Muestra motivo y fecha de desactivación

## 🎯 **Flujo de Uso**

### **Paso 1: Desactivar Administrador**
1. **Super Admin** va al panel de administración
2. **Hace clic en "Eliminar"** en un administrador
3. **Sistema desactiva** al administrador (soft delete)
4. **Usuario recibe notificación** de desactivación

### **Paso 2: Ver Administradores Inactivos**
1. **Super Admin** hace clic en **"Ver Inactivos"**
2. **Sistema muestra lista** de administradores desactivados
3. **Se ve información** de cuándo y por qué fue desactivado

### **Paso 3: Reactivar Administrador**
1. **Super Admin** hace clic en **"Reactivar"** en un administrador inactivo
2. **Se abre modal** para seleccionar roles
3. **Se asigna motivo** de reactivación (opcional)
4. **Sistema reactiva** al administrador
5. **Usuario recibe notificación** de reactivación

## 📊 **Datos que se Conservan**

### **Al Desactivar:**
- ✅ **Información personal** (nombre, email, etc.)
- ✅ **Historial de roles** anteriores
- ✅ **Fecha de desactivación**
- ✅ **Motivo de desactivación**
- ✅ **Quién desactivó** al administrador

### **Al Reactivar:**
- ✅ **Se restaura** `es_admin: true`
- ✅ **Se restaura** `activo: true`
- ✅ **Se asignan** nuevos roles
- ✅ **Se registra** fecha de desbloqueo
- ✅ **Se conserva** historial anterior

## 🎨 **Interfaz de Usuario**

### **Panel Principal:**
- **Botón "Ver Inactivos"** - Alterna entre activos e inactivos
- **Contador** de administradores inactivos
- **Indicadores visuales** para distinguir estados

### **Lista de Inactivos:**
- **Fondo rojo claro** para distinguir inactivos
- **Badge "Inactivo"** en cada tarjeta
- **Información de desactivación** (fecha, motivo)
- **Botón "Reactivar"** en cada tarjeta

### **Modal de Reactivación:**
- **Selección de roles** con checkboxes
- **Campo de motivo** (opcional)
- **Validación** de al menos un rol
- **Botones** de cancelar y reactivar

## 🔍 **Estados de Administradores**

### **Activo:**
- `es_admin: true`
- `activo: true`
- Roles activos asignados
- Puede hacer login y usar el sistema

### **Inactivo:**
- `es_admin: false`
- `activo: false`
- Roles desactivados
- No puede hacer login
- Aparece en lista de inactivos

### **Reactivado:**
- `es_admin: true` (restaurado)
- `activo: true` (restaurado)
- Nuevos roles asignados
- Puede hacer login nuevamente

## 📧 **Notificaciones Automáticas**

### **Al Desactivar:**
- **Tipo:** `admin_deactivated`
- **Título:** "Acceso de Administrador Desactivado"
- **Mensaje:** Información sobre la desactivación y contacto

### **Al Reactivar:**
- **Tipo:** `admin_reactivated`
- **Título:** "Acceso de Administrador Reactivado"
- **Mensaje:** Roles asignados y motivo de reactivación

## 🛡️ **Seguridad y Permisos**

### **Solo Super Admins pueden:**
- ✅ Desactivar administradores
- ✅ Ver lista de inactivos
- ✅ Reactivar administradores
- ✅ Asignar roles durante reactivación

### **Validaciones:**
- ✅ Verificar que el usuario existe
- ✅ Verificar que era administrador
- ✅ Validar al menos un rol en reactivación
- ✅ Registrar quién realiza la acción

## 📈 **Beneficios del Sistema**

1. **🔄 Flexibilidad** - Puedes deshacer eliminaciones
2. **📊 Historial** - Se conserva toda la información
3. **🛡️ Seguridad** - Soft delete previene pérdida de datos
4. **👥 Gestión** - Control total sobre administradores
5. **📧 Comunicación** - Notificaciones automáticas
6. **🎯 Precisión** - Reasignación de roles específicos

## 🚀 **Casos de Uso Comunes**

### **Desactivación Temporal:**
- Administrador en vacaciones
- Suspensión por investigación
- Cambio temporal de responsabilidades

### **Reactivación:**
- Regreso de vacaciones
- Resolución de investigación
- Cambio de roles o responsabilidades

### **Gestión de Roles:**
- Cambiar roles sin crear nuevo usuario
- Actualizar permisos específicos
- Reorganización del equipo

## 🔧 **Configuración Requerida**

### **Base de Datos:**
- ✅ Columna `motivo_suspension` en tabla `usuario`
- ✅ Columna `fecha_suspension` en tabla `usuario`
- ✅ Columna `suspendido_por` en tabla `usuario`
- ✅ Columna `fecha_desbloqueo` en tabla `usuario`

### **APIs:**
- ✅ Rutas implementadas y funcionando
- ✅ Validaciones de permisos
- ✅ Manejo de errores robusto

## 📝 **Ejemplo de Uso Completo**

```javascript
// 1. Desactivar administrador
DELETE /api/admin/roles/123
// Resultado: Administrador desactivado, roles desactivados

// 2. Ver administradores inactivos
GET /api/admin/roles/inactive
// Resultado: Lista de administradores desactivados

// 3. Reactivar administrador
POST /api/admin/roles/123/reactivate
{
  "roles": [2, 3],
  "motivo": "Regreso de vacaciones"
}
// Resultado: Administrador reactivado con nuevos roles
```

¡Con esta funcionalidad tienes control total sobre el ciclo de vida de tus administradores! 🎉
