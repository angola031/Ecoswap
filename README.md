# 🌱 EcoSwap Colombia

Plataforma de intercambio y venta de productos de segunda mano en Colombia. Promovemos la economía circular y el consumo sostenible.

## 📁 Estructura del Proyecto

```
EcoSwap/
├── 📁 app/                    # Páginas de Next.js (App Router)
│   ├── 📁 admin/              # Panel de administración
│   ├── 📁 api/                # API Routes
│   ├── 📁 auth/               # Autenticación y autorización
│   └── 📄 page.tsx            # Página principal
├── 📁 components/             # Componentes React reutilizables
│   ├── 📁 admin/              # Componentes de administración
│   ├── 📁 auth/               # Componentes de autenticación
│   ├── 📁 products/           # Componentes de productos
│   ├── 📁 ui/                 # Componentes de interfaz
│   └── 📁 forms/              # Formularios
├── 📁 lib/                    # Utilidades y configuraciones
├── 📁 hooks/                  # Custom React Hooks
├── 📁 assets/                 # Recursos estáticos
│   ├── 📁 images/             # Imágenes
│   ├── 📁 icons/              # Iconos
│   └── 📁 fonts/              # Fuentes
├── 📁 docs/                   # Documentación del proyecto
├── 📁 database/               # Scripts SQL y migraciones
├── 📁 scripts/                # Scripts de utilidad
└── 📄 README.md               # Este archivo
```

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 👥 Sistema de Usuarios

### Administradores
- Acceso al panel de administración (`/admin/verificaciones`)
- Gestión de usuarios y productos
- Verificación de intercambios

### Clientes
- Registro y autenticación
- Publicación de productos
- Sistema de intercambios

## 🔐 Autenticación

### Login de Administradores
- URL: `/login`
- Credenciales por defecto:
  - Email: `c.angola@utp.edu.co`
  - Contraseña: `admin123`

### Flujo de Autenticación
1. Login con credenciales
2. Verificación de rol (admin/cliente)
3. Redirección automática según rol
4. Protección de rutas con middleware

## 📊 Base de Datos

### Tablas Principales
- `usuario` - Información de usuarios
- `producto` - Productos publicados
- `intercambio` - Transacciones de intercambio
- `usuario_rol` - Roles y permisos

### Scripts SQL
Todos los scripts de base de datos están en la carpeta `database/`:
- `create-admin-roles-system.sql` - Sistema de roles
- `supabase-policies.sql` - Políticas de seguridad
- `fix-*.sql` - Correcciones y migraciones

## 🛡️ Seguridad

- **Row Level Security (RLS)** habilitado en Supabase
- **Middleware** para protección de rutas
- **Validación** de roles y permisos
- **Políticas** de acceso a datos

## 📝 Documentación

La documentación completa está en la carpeta `docs/`:
- Guías de configuración
- Soluciones a problemas comunes
- Documentación de APIs
- Guías de desarrollo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: info@ecoswap.co
- **Sitio Web**: https://ecoswap.co
- **Ubicación**: Pereira, Colombia

---

**EcoSwap Colombia** - Promoviendo la economía circular y el consumo sostenible 🌱
