# 🚀 Deployment en Cloudflare Pages

Esta guía te ayudará a desplegar EcoSwap en Cloudflare Pages sin problemas.

## 📋 Prerrequisitos

1. **Cuenta de Cloudflare** con Pages habilitado
2. **Repositorio en GitHub** con el código de EcoSwap
3. **Variables de entorno** configuradas en Supabase

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Configura las siguientes variables en Cloudflare Pages:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vaqdzualcteljmivtoka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.pages.dev
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

### 2. Configuración de Build

- **Build command**: `npm run build:cloudflare`
- **Build output directory**: `out`
- **Root directory**: `/` (raíz del proyecto)

### 3. Configuración de Framework

- **Framework preset**: `Next.js (Static HTML Export)`
- **Node.js version**: `18.x` o superior

## 🌐 Configuración de Dominio

### 1. Dominio Personalizado

1. Ve a **Pages** > **Custom domains**
2. Agrega tu dominio personalizado
3. Configura los DNS records según las instrucciones

### 2. SSL/TLS

Cloudflare maneja automáticamente el SSL, pero asegúrate de que esté en modo "Full (strict)"

## 🛡️ Configuración de Seguridad

### 1. Headers de Seguridad

Los headers están configurados en `_headers`:

```bash
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### 2. CORS para Supabase

```bash
Access-Control-Allow-Origin: https://vaqdzualcteljmivtoka.supabase.co
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-client-info, apikey
```

## ⚡ Optimizaciones de Rendimiento

### 1. Cache Configuration

- **Archivos estáticos**: Cache de 1 año
- **Imágenes**: Cache de 1 día
- **API routes**: Sin cache
- **Páginas HTML**: Cache de 1 hora

### 2. Compresión

Cloudflare maneja automáticamente la compresión gzip/brotli.

## 🔄 Proceso de Deployment

### 1. Deployment Automático

```bash
# El deployment se activa automáticamente con cada push a main
git add .
git commit -m "feat: Prepare for Cloudflare deployment"
git push origin main
```

### 2. Deployment Manual

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Login en Cloudflare
wrangler login

# Deploy
npm run deploy:cloudflare
```

### 3. Preview Deployments

```bash
# Para deployments de preview
npm run deploy:preview
```

## 🐛 Solución de Problemas

### 1. Errores de Build

Si el build falla:

```bash
# Limpiar cache
npm run clean

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build:cloudflare
```

### 2. Problemas de CORS

Si hay problemas de CORS con Supabase:

1. Verifica las variables de entorno
2. Revisa la configuración en `_headers`
3. Confirma que el dominio esté en la lista blanca de Supabase

### 3. Problemas de Cookies

La aplicación está configurada para manejar automáticamente las cookies de Cloudflare en producción.

## 📊 Monitoreo

### 1. Analytics de Cloudflare

- Ve a **Analytics & Logs** en tu dashboard de Pages
- Monitorea métricas de rendimiento y errores

### 2. Logs de Build

- Revisa los logs de build en **Deployments**
- Identifica errores de compilación o configuración

## 🔧 Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build para Cloudflare
npm run build:cloudflare

# Deploy a Cloudflare
npm run deploy:cloudflare

# Preview deployment
npm run deploy:preview

# Limpiar archivos de build
npm run clean

# Verificar tipos
npm run type-check

# Linting
npm run lint
```

## 📝 Notas Importantes

1. **Static Export**: La aplicación usa static export para Cloudflare Pages
2. **API Routes**: Se convierten en funciones serverless automáticamente
3. **Imágenes**: Se optimizan automáticamente por Cloudflare
4. **Cookies**: Se manejan inteligentemente según el entorno

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de build en Cloudflare Pages
2. Verifica las variables de entorno
3. Confirma que todas las dependencias estén actualizadas
4. Revisa la documentación de Cloudflare Pages

---

¡Tu aplicación EcoSwap estará lista para producción en Cloudflare Pages! 🎉
