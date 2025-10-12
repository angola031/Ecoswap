# EcoSwap Colombia - Guía de Desarrollo Local

Esta guía te ayudará a configurar y ejecutar EcoSwap en tu máquina local para desarrollo.

## 🚀 Configuración Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar entorno de desarrollo
```bash
npm run dev:setup
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```

El proyecto estará disponible en: http://localhost:3000

## 📋 Requisitos

- Node.js 18+ 
- npm o yarn
- Git

## 🔧 Configuración Detallada

### Variables de Entorno

El proyecto creará automáticamente un archivo `.env.local` con la configuración básica:

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=EcoSwap Colombia
```

### Supabase (Opcional)

Para funcionalidad completa, configura Supabase:

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Obtén tu URL y clave anónima
3. Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio-aqui
```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run dev:setup` - Configura el proyecto para desarrollo
- `npm run build` - Construye para producción
- `npm run start` - Inicia servidor de producción
- `npm run lint` - Ejecuta linter
- `npm run type-check` - Verifica tipos TypeScript

## 🐛 Solución de Problemas

### Error de Hidratación
Si ves errores de hidratación, el proyecto está configurado para manejarlos automáticamente. Los errores se suprimirán en la consola del navegador.

### Puerto en Uso
Si el puerto 3000 está ocupado:
```bash
npm run dev -- -p 3001
```

### Limpiar Cache
Si tienes problemas de cache:
```bash
npm run clean
npm install
npm run dev
```

## 📁 Estructura del Proyecto

```
Ecoswap/
├── app/                 # Páginas de Next.js App Router
├── components/          # Componentes React
├── lib/                 # Utilidades y configuración
├── hooks/               # Hooks personalizados
├── scripts/             # Scripts de configuración
└── public/              # Archivos estáticos
```

## 🔍 Modo de Desarrollo

El proyecto está configurado para:

- ✅ Funcionar sin Supabase en desarrollo
- ✅ Evitar errores de hidratación
- ✅ Usar router personalizado solo en producción
- ✅ Cargar componentes de forma segura

## 📞 Soporte

Si tienes problemas:

1. Verifica que todas las dependencias estén instaladas
2. Ejecuta `npm run dev:setup` nuevamente
3. Revisa la consola del navegador para errores específicos
4. Limpia el cache con `npm run clean`

## 🎯 Próximos Pasos

Una vez que el proyecto esté funcionando:

1. Explora los componentes en `/components`
2. Modifica las páginas en `/app`
3. Configura Supabase para funcionalidad completa
4. Personaliza los estilos en `/app/globals.css`
