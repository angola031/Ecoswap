# 🚀 Guía de Despliegue

## 📋 Preparación para Producción

### 1. Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Configuración de Supabase

#### Base de Datos
1. Ejecuta los scripts en la carpeta `database/`:
   ```sql
   -- Ejecutar en orden:
   create-admin-roles-system.sql
   supabase-policies.sql
   ```

#### Políticas de Seguridad
- Habilitar Row Level Security (RLS)
- Configurar políticas de acceso
- Verificar permisos de usuarios

#### Autenticación
- Configurar URLs de redirección
- Configurar plantillas de email
- Verificar configuración de dominio

## 🌐 Despliegue en Vercel (Recomendado)

### 1. Conectar Repositorio
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "New Project"
3. Conecta tu repositorio de GitHub

### 2. Configurar Variables de Entorno
En el dashboard de Vercel:
```
NEXT_PUBLIC_SUPABASE_URL = tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu_anon_key
SUPABASE_SERVICE_ROLE_KEY = tu_service_role_key
NEXT_PUBLIC_APP_URL = https://tu-dominio.vercel.app
```

### 3. Configuración de Build
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 4. Dominio Personalizado
1. Ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Configura los registros DNS

## 🐳 Despliegue con Docker

### 1. Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Docker Compose
```yaml
version: '3.8'
services:
  ecoswap:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}
```

## 🔧 Despliegue Manual

### 1. Construir el Proyecto
```bash
npm run build
```

### 2. Configurar Servidor
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start npm --name "ecoswap" -- start

# Configurar para reinicio automático
pm2 startup
pm2 save
```

### 3. Configurar Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Configuración de Seguridad

### 1. HTTPS
- Configurar certificado SSL
- Redireccionar HTTP a HTTPS
- Configurar HSTS headers

### 2. Headers de Seguridad
```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ]
}
```

### 3. Variables de Entorno Seguras
- Nunca commitear archivos `.env`
- Usar variables de entorno del servidor
- Rotar claves regularmente

## 📊 Monitoreo

### 1. Logs
```bash
# Ver logs en tiempo real
pm2 logs ecoswap

# Ver logs de error
pm2 logs ecoswap --err
```

### 2. Métricas
- Configurar Google Analytics
- Monitorear performance con Vercel Analytics
- Configurar alertas de error

### 3. Health Checks
```javascript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Error de Build
```bash
# Limpiar cache
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 2. Error de Variables de Entorno
- Verificar que todas las variables estén configuradas
- Verificar que no haya espacios en blanco
- Verificar que las URLs sean correctas

#### 3. Error de Base de Datos
- Verificar conexión a Supabase
- Verificar políticas de RLS
- Verificar permisos de usuario

### Logs de Debug
```bash
# Habilitar logs detallados
DEBUG=* npm run dev

# Ver logs de Supabase
DEBUG=supabase:* npm run dev
```

## 📞 Soporte

- **Documentación**: [docs/](./README.md)
- **Issues**: GitHub Issues
- **Email**: support@ecoswap.co
