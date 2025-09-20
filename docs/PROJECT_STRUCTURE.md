# 📁 Estructura del Proyecto EcoSwap

## 🎯 Resumen de la Organización

El proyecto EcoSwap ha sido completamente reorganizado para seguir las mejores prácticas de desarrollo y mantener una estructura profesional y escalable.

## 📂 Estructura Principal

```
EcoSwap/
├── 📁 app/                    # Páginas de Next.js (App Router)
│   ├── 📁 admin/              # Panel de administración
│   │   ├── login/             # Login de administradores
│   │   └── verificaciones/    # Dashboard de verificaciones
│   ├── 📁 api/                # API Routes
│   │   ├── admin/             # APIs de administración
│   │   ├── auth/              # APIs de autenticación
│   │   ├── chat/              # APIs de chat
│   │   ├── intercambios/      # APIs de intercambios
│   │   └── products/          # APIs de productos
│   ├── 📁 auth/               # Páginas de autenticación
│   │   ├── callback/          # Callback de Supabase
│   │   ├── reset-password/    # Reset de contraseña
│   │   └── supabase-redirect/ # Redirección de Supabase
│   ├── 📄 globals.css         # Estilos globales
│   ├── 📄 layout.tsx          # Layout principal
│   └── 📄 page.tsx            # Página principal
├── 📁 components/             # Componentes React reutilizables
│   ├── 📁 admin/              # Componentes de administración
│   │   ├── AdminManagementModule.tsx
│   │   ├── AdminChatModule.tsx
│   │   └── ReportsModule.tsx
│   ├── 📁 auth/               # Componentes de autenticación
│   │   └── AuthModule.tsx
│   ├── 📁 products/           # Componentes de productos
│   ├── 📁 interactions/       # Componentes de interacciones
│   ├── 📁 ui/                 # Componentes de interfaz (futuro)
│   └── 📁 forms/              # Formularios (futuro)
├── 📁 lib/                    # Utilidades y configuraciones
│   ├── supabase.ts            # Cliente de Supabase
│   ├── auth.ts                # Utilidades de autenticación
│   ├── admin-queries.ts       # Consultas de administración
│   └── config.ts              # Configuraciones
├── 📁 hooks/                  # Custom React Hooks
│   └── useAdminQueries.ts     # Hook para consultas de admin
├── 📁 assets/                 # Recursos estáticos
│   ├── 📁 images/             # Imágenes
│   ├── 📁 icons/              # Iconos
│   ├── 📁 fonts/              # Fuentes
│   └── 📁 css/                # Estilos adicionales
├── 📁 docs/                   # Documentación del proyecto
│   ├── README.md              # Documentación principal
│   ├── DEVELOPMENT.md         # Guía de desarrollo
│   ├── DEPLOYMENT.md          # Guía de despliegue
│   └── *.md                   # Otra documentación
├── 📁 database/               # Scripts SQL y migraciones
│   ├── create-admin-roles-system.sql
│   ├── supabase-policies.sql
│   └── fix-*.sql              # Correcciones
├── 📁 scripts/                # Scripts de utilidad
│   ├── setup-database.js      # Configuración de BD
│   └── *.js                   # Otros scripts
├── 📁 .vscode/                # Configuración de VS Code
│   ├── settings.json          # Configuración del editor
│   └── extensions.json        # Extensiones recomendadas
├── 📄 middleware.ts           # Middleware de Next.js
├── 📄 package.json            # Dependencias y scripts
├── 📄 tsconfig.json           # Configuración de TypeScript
├── 📄 tailwind.config.js      # Configuración de Tailwind
├── 📄 next.config.js          # Configuración de Next.js
├── 📄 .eslintrc.json          # Configuración de ESLint
├── 📄 .prettierrc             # Configuración de Prettier
└── 📄 .gitignore              # Archivos ignorados por Git
```

## 🗂️ Carpetas Organizadas

### ✅ **Documentación (docs/)**
- **README.md**: Documentación principal del proyecto
- **DEVELOPMENT.md**: Guía completa de desarrollo
- **DEPLOYMENT.md**: Guía de despliegue y producción
- **PROJECT_STRUCTURE.md**: Este archivo
- **Otros .md**: Documentación específica de funcionalidades

### ✅ **Base de Datos (database/)**
- **create-admin-roles-system.sql**: Sistema de roles de administración
- **supabase-policies.sql**: Políticas de seguridad (RLS)
- **fix-*.sql**: Correcciones y migraciones

### ✅ **Scripts (scripts/)**
- **setup-database.js**: Configuración automática de la BD
- **check-env.js**: Verificación de variables de entorno
- **verify-env.js**: Validación de configuración

### ✅ **Componentes (components/)**
- **admin/**: Componentes específicos de administración
- **auth/**: Componentes de autenticación
- **products/**: Componentes de productos
- **interactions/**: Componentes de interacciones
- **ui/**: Componentes de interfaz reutilizables
- **forms/**: Formularios comunes

### ✅ **Assets (assets/)**
- **images/**: Imágenes del proyecto
- **icons/**: Iconos SVG
- **fonts/**: Fuentes personalizadas
- **css/**: Estilos adicionales

## 🔧 Archivos de Configuración

### ✅ **TypeScript (tsconfig.json)**
```json
{
  "compilerOptions": {
    "strict": false,  // Temporalmente relajado
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

### ✅ **Tailwind (tailwind.config.js)**
```javascript
{
  "theme": {
    "extend": {
      "colors": {
        "primary": { /* Paleta de colores EcoSwap */ },
        "secondary": { /* Colores secundarios */ }
      }
    }
  }
}
```

### ✅ **Next.js (next.config.js)**
```javascript
{
  "images": {
    "domains": ["localhost", "vaqdzualcteljmivtoka.supabase.co"]
  },
  "async redirects()": {
    // Redirecciones automáticas
  }
}
```

### ✅ **ESLint (.eslintrc.json)**
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

## 📋 Scripts de NPM

```json
{
  "scripts": {
    "dev": "next dev",                    // Desarrollo
    "build": "next build",                // Construcción
    "start": "next start",                // Producción
    "lint": "next lint",                  // Verificación
    "lint:fix": "next lint --fix",        // Corrección automática
    "type-check": "tsc --noEmit",         // Verificación de tipos
    "clean": "rm -rf .next out",          // Limpieza
    "db:setup": "node scripts/setup-database.js",  // Configurar BD
    "db:reset": "node scripts/reset-database.js"   // Resetear BD
  }
}
```

## 🚀 Beneficios de la Nueva Estructura

### ✅ **Organización**
- **Separación clara** de responsabilidades
- **Fácil navegación** en el proyecto
- **Escalabilidad** para futuras funcionalidades

### ✅ **Mantenimiento**
- **Documentación centralizada** en `docs/`
- **Scripts organizados** en `scripts/`
- **Configuraciones estandarizadas**

### ✅ **Desarrollo**
- **Configuración de VS Code** incluida
- **ESLint y Prettier** configurados
- **TypeScript** configurado con paths

### ✅ **Despliegue**
- **Scripts de automatización**
- **Configuración de producción**
- **Variables de entorno organizadas**

## 🔄 Flujo de Trabajo

### 1. **Desarrollo**
```bash
npm run dev          # Servidor de desarrollo
npm run lint         # Verificar código
npm run type-check   # Verificar tipos
```

### 2. **Base de Datos**
```bash
npm run db:setup     # Configurar BD
npm run db:reset     # Resetear BD
```

### 3. **Producción**
```bash
npm run build        # Construir
npm run start        # Servidor de producción
```

## 📚 Próximos Pasos

### 🔧 **Mejoras Técnicas**
- [ ] Corregir errores de TypeScript
- [ ] Implementar testing
- [ ] Optimizar performance
- [ ] Agregar CI/CD

### 📖 **Documentación**
- [ ] Documentar APIs
- [ ] Guías de contribución
- [ ] Ejemplos de uso
- [ ] Troubleshooting

### 🎨 **UI/UX**
- [ ] Componentes de UI
- [ ] Sistema de diseño
- [ ] Responsive design
- [ ] Accesibilidad

---

**EcoSwap Colombia** - Estructura profesional y escalable 🌱
