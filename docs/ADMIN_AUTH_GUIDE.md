# 🔐 Guía de Autenticación de Administradores - EcoSwap

## 📋 **Resumen de Cambios**

El archivo `lib/auth.ts` ha sido adaptado para incluir un sistema completo de autenticación y autorización de administradores, compatible con el sistema de roles implementado en la base de datos.

## 🆕 **Nuevas Interfaces**

### **User (Actualizada)**
```typescript
export interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    phone?: string
    isAdmin?: boolean        // ✨ NUEVO
    roles?: string[]         // ✨ NUEVO
    adminSince?: string      // ✨ NUEVO
}
```

### **AdminUser (Nueva)**
```typescript
export interface AdminUser extends User {
    isAdmin: true
    roles: string[]
    adminSince?: string
}
```

## 🚀 **Nuevas Funciones de Administración**

### **1. Verificar si un usuario es administrador**
```typescript
const { isAdmin, roles, adminSince } = await isUserAdmin('admin@example.com')
```

**Retorna:**
- `isAdmin`: boolean - Si el usuario es administrador
- `roles`: string[] - Array de roles del usuario
- `adminSince`: string | undefined - Fecha de asignación como admin

### **2. Verificar si es Super Admin**
```typescript
const isSuperAdmin = await isUserSuperAdmin('admin@example.com')
```

**Retorna:** boolean - Si el usuario tiene rol de `super_admin`

### **3. Obtener información completa de administrador**
```typescript
const adminUser = await getAdminUser('admin@example.com')
```

**Retorna:** `AdminUser | null` - Información completa del administrador

### **4. Verificar permisos específicos**
```typescript
const canManageUsers = await hasAdminPermission('admin@example.com', 'gestionar_usuarios')
const canManageAdmins = await hasAdminPermission('admin@example.com', 'gestionar_admins')
```

**Permisos disponibles:**
- `gestionar_usuarios`: Super Admin, Admin Validación
- `gestionar_admins`: Solo Super Admin
- `gestionar_reportes`: Super Admin, Admin Soporte, Moderador
- `gestionar_verificaciones`: Super Admin, Admin Validación
- `responder_chats`: Super Admin, Admin Soporte, Moderador
- `acceso_total`: Solo Super Admin

### **5. Login específico para administradores**
```typescript
const { user, error } = await loginAdmin({
    email: 'admin@example.com',
    password: 'password123'
})
```

**Retorna:** `AdminUser | null` - Solo si el usuario es administrador

### **6. Obtener usuario actual con información de admin**
```typescript
const user = await getCurrentUserWithAdmin()
```

**Retorna:** `User | null` - Usuario actual con información de administrador incluida

## 🔄 **Funciones Actualizadas**

### **loginUser()**
Ahora incluye automáticamente información de administrador en el objeto `User` retornado.

### **getCurrentUser()**
Ahora incluye automáticamente información de administrador en el objeto `User` retornado.

## 🎯 **Roles del Sistema**

### **super_admin**
- Acceso total al sistema
- Puede gestionar otros administradores
- Todos los permisos

### **admin_validacion**
- Gestionar verificaciones de usuarios
- Gestionar usuarios
- No puede gestionar otros admins

### **admin_soporte**
- Gestionar reportes y quejas
- Responder chats de soporte
- No puede gestionar verificaciones

### **moderador**
- Gestionar reportes
- Responder chats
- Moderación básica

## 💡 **Ejemplos de Uso**

### **Verificar permisos en un componente**
```typescript
import { getCurrentUserWithAdmin, hasAdminPermission } from '@/lib/auth'

export default function AdminPanel() {
    const [user, setUser] = useState<User | null>(null)
    
    useEffect(() => {
        const loadUser = async () => {
            const currentUser = await getCurrentUserWithAdmin()
            setUser(currentUser)
        }
        loadUser()
    }, [])

    if (!user?.isAdmin) {
        return <div>No tienes permisos de administrador</div>
    }

    const canManageUsers = user.roles?.includes('super_admin') || 
                          user.roles?.includes('admin_validacion')

    return (
        <div>
            <h1>Panel de Administración</h1>
            <p>Roles: {user.roles?.join(', ')}</p>
            {canManageUsers && <UserManagement />}
        </div>
    )
}
```

### **Proteger rutas de administración**
```typescript
import { getCurrentUserWithAdmin } from '@/lib/auth'

export async function middleware(request: NextRequest) {
    const user = await getCurrentUserWithAdmin()
    
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user?.isAdmin) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }
}
```

### **Verificar permisos específicos**
```typescript
import { hasAdminPermission } from '@/lib/auth'

export async function handleUserAction(userEmail: string, action: string) {
    const canManageUsers = await hasAdminPermission(userEmail, 'gestionar_usuarios')
    
    if (!canManageUsers) {
        throw new Error('No tienes permisos para gestionar usuarios')
    }
    
    // Proceder con la acción
}
```

## 🔧 **Configuración Requerida**

### **Base de Datos**
Asegúrate de que las siguientes tablas existan:
- `usuario` (con columnas `es_admin`, `admin_desde`)
- `rol_usuario` (con roles predefinidos)
- `usuario_rol` (relación usuarios-roles)

### **Roles Predefinidos**
```sql
INSERT INTO rol_usuario (nombre, descripcion, permisos) VALUES
('super_admin', 'Super Administrador', '{"all": true}'),
('admin_validacion', 'Administrador de Validaciones', '{"validations": ["read", "write", "approve"]}'),
('admin_soporte', 'Administrador de Soporte', '{"tickets": ["read", "write", "resolve"]}'),
('moderador', 'Moderador de contenido', '{"reports": ["read", "resolve"]}');
```

## ⚠️ **Consideraciones Importantes**

1. **Seguridad**: Siempre verifica permisos en el servidor, no solo en el cliente
2. **Performance**: Las consultas de roles se hacen en cada verificación
3. **Caché**: Considera implementar caché para roles si es necesario
4. **Logs**: Registra acciones de administradores para auditoría

## 🐛 **Solución de Problemas**

### **Error: "No tienes permisos de administrador"**
- Verifica que el usuario tenga `es_admin = true` en la tabla `usuario`
- Verifica que tenga roles asignados en `usuario_rol`

### **Error: "Roles no encontrados"**
- Verifica que las tablas `rol_usuario` y `usuario_rol` existan
- Verifica que los roles estén activos (`activo = true`)

### **Error: "Permisos insuficientes"**
- Verifica que el rol del usuario tenga el permiso requerido
- Super Admin tiene todos los permisos automáticamente
