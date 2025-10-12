# 🛠️ Guía de Desarrollo - EcoSwap

Esta guía te ayudará a configurar y ejecutar el proyecto EcoSwap en tu entorno de desarrollo local.

## 📋 **Prerrequisitos**

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Git**
- **Cuenta de Supabase** con proyecto creado

## 🚀 **Configuración Inicial**

### **Paso 1: Clonar el repositorio**
```bash
git clone https://github.com/angola031/Ecoswap.git
cd Ecoswap
```

### **Paso 2: Configurar variables de entorno**
```bash
npm run dev:setup
```

Este comando:
- Crea el archivo `.env.local`
- Instala las dependencias si es necesario
- Te guía en la configuración

### **Paso 3: Configurar credenciales de Supabase**

Edita el archivo `.env.local` y reemplaza los valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

**¿Dónde obtener estas credenciales?**
1. Ve a [Supabase Dashboard](https://app.supabase.com/)
2. Selecciona tu proyecto
3. Ve a **Settings** > **API**
4. Copia los valores necesarios

## 🏃‍♂️ **Ejecutar en Desarrollo**

### **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

Tu aplicación estará disponible en: **http://localhost:3000**

### **Otros comandos útiles**

```bash
# Verificar tipos TypeScript
npm run type-check

# Ejecutar linter
npm run lint

# Construir para producción
npm run build

# Limpiar archivos de build
npm run clean
```

## 📁 **Estructura del Proyecto**

```
Ecoswap/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── admin/             # Panel de administración
│   └── ...
├── components/            # Componentes React
├── lib/                   # Utilidades y configuraciones
├── hooks/                 # Custom hooks
├── scripts/               # Scripts de automatización
└── public/                # Archivos estáticos
```

## 🔧 **Scripts Disponibles**

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build para producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | Verificar código |
| `npm run type-check` | Verificar tipos |
| `npm run dev:setup` | Configurar entorno |

## 🌐 **Deployment**

### **Vercel (Recomendado)**
```bash
npm run deploy
```

### **Cloudflare Pages**
```bash
npm run deploy-cloudflare
```

## 🐛 **Solución de Problemas**

### **Error: Variables de entorno no encontradas**
- Verifica que el archivo `.env.local` existe
- Confirma que las variables tienen los valores correctos
- Reinicia el servidor de desarrollo

### **Error: No se puede conectar a Supabase**
- Verifica que las credenciales sean correctas
- Confirma que tu proyecto de Supabase esté activo
- Revisa la consola del navegador para errores

### **Error de TypeScript**
```bash
npm run type-check
```

### **Error de linting**
```bash
npm run lint
```

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica la configuración de Supabase
3. Asegúrate de que todas las dependencias estén instaladas

---

**¡Feliz desarrollo! 🚀**
