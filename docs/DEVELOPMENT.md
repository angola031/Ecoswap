# 🚀 Guía de Desarrollo

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git
- VS Code (recomendado)

## 🛠️ Configuración del Entorno

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/ecoswap-colombia.git
cd ecoswap-colombia
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### 4. Configurar Base de Datos
```bash
# Ejecutar scripts de base de datos
npm run db:setup
```

## 🏗️ Estructura del Proyecto

```
EcoSwap/
├── app/                    # Páginas (App Router)
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes
│   ├── auth/              # Autenticación
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── admin/             # Componentes de admin
│   ├── auth/              # Componentes de auth
│   ├── products/          # Componentes de productos
│   └── ui/                # Componentes de UI
├── lib/                   # Utilidades y configuraciones
├── hooks/                 # Custom React Hooks
├── docs/                  # Documentación
├── database/              # Scripts SQL
└── scripts/               # Scripts de utilidad
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Servidor de producción
npm run lint             # Verificar código
npm run lint:fix         # Corregir código automáticamente
npm run type-check       # Verificar tipos TypeScript
npm run clean            # Limpiar archivos de build

# Base de datos
npm run db:setup         # Configurar base de datos
npm run db:reset         # Resetear base de datos
```

## 🎨 Convenciones de Código

### Nomenclatura de Archivos
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
- **Utilidades**: camelCase (`formatDate.ts`)
- **Páginas**: kebab-case (`user-profile/page.tsx`)

### Estructura de Componentes
```typescript
// 1. Imports
import React from 'react'
import { ComponentProps } from './types'

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export default function Component({ prop }: Props) {
  // 4. Hooks
  // 5. State
  // 6. Effects
  // 7. Handlers
  // 8. Render
  return <div>...</div>
}
```

### Estilos con Tailwind
```typescript
// ✅ Bueno
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">

// ❌ Malo
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
```

## 🔐 Autenticación

### Flujo de Autenticación
1. Usuario hace login en `/login`
2. Supabase autentica y establece sesión
3. Middleware verifica sesión en rutas protegidas
4. Redirección según rol (admin/cliente)

### Roles de Usuario
- **Admin**: Acceso completo al panel de administración
- **Cliente**: Acceso a funcionalidades de usuario

## 🗄️ Base de Datos

### Tablas Principales
- `usuario` - Información de usuarios
- `producto` - Productos publicados
- `intercambio` - Transacciones
- `usuario_rol` - Roles y permisos

### Migraciones
```bash
# Crear nueva migración
touch database/migration-YYYY-MM-DD-description.sql

# Aplicar migraciones
npm run db:setup
```

## 🧪 Testing

### Estructura de Tests
```
__tests__/
├── components/
├── pages/
├── utils/
└── setup.ts
```

### Ejecutar Tests
```bash
npm test              # Todos los tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

## 📦 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Variables de Entorno de Producción
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🐛 Debugging

### Logs de Desarrollo
```typescript
// Usar console.log para debugging
console.log('🔍 Debug info:', data)

// Usar console.error para errores
console.error('❌ Error:', error)
```

### Herramientas de Debug
- React Developer Tools
- Supabase Dashboard
- Network Tab en DevTools
- Console logs del navegador

## 📚 Recursos Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

- **Issues**: GitHub Issues
- **Discord**: [Servidor de EcoSwap](https://discord.gg/ecoswap)
- **Email**: dev@ecoswap.co
