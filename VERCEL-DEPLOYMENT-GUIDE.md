# 🚀 Guía de Deployment en Vercel

## 📋 Pasos para Deployar EcoSwap en Vercel

### 1. **Preparación del Proyecto**
- ✅ Configuración de Next.js optimizada para Vercel
- ✅ Archivo `vercel.json` creado
- ✅ Scripts de deployment configurados

### 2. **Configuración en Vercel Dashboard**

#### 2.1. Crear Cuenta y Proyecto
1. Ve a: https://vercel.com
2. Crea una cuenta o inicia sesión
3. Conecta tu cuenta de GitHub
4. Haz clic en "New Project"
5. Importa el repositorio: `angola031/Ecoswap`

#### 2.2. Configurar Variables de Entorno
En el dashboard de Vercel, ve a:
- **Project Settings** > **Environment Variables**

Agrega estas variables:
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

#### 2.3. Configuración de Build
- **Framework Preset**: Next.js (automático)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (automático)
- **Install Command**: `npm install`

### 3. **Deployment Automático**

#### 3.1. Configurar GitHub Integration
1. En Vercel Dashboard > **Settings** > **Git**
2. Conecta tu repositorio de GitHub
3. Habilita "Auto-deploy" para la rama `main`

#### 3.2. Deploy Manual (Alternativo)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login a Vercel
vercel login

# Deploy
npm run deploy:vercel
```

### 4. **Configuración de Dominio**

#### 4.1. Dominio Gratuito
- Tu aplicación estará disponible en: `https://ecoswap.vercel.app`
- Se actualiza automáticamente con cada push

#### 4.2. Dominio Personalizado (Opcional)
1. Ve a **Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Vercel

### 5. **Verificación del Deployment**

#### 5.1. Checklist de Verificación
- [ ] Build exitoso en Vercel
- [ ] Variables de entorno configuradas
- [ ] Aplicación accesible en la URL
- [ ] Funcionalidades principales funcionando
- [ ] API routes respondiendo correctamente

#### 5.2. URLs de Verificación
- **Página principal**: `https://ecoswap.vercel.app`
- **API Health**: `https://ecoswap.vercel.app/api/supabase/health`
- **Login**: `https://ecoswap.vercel.app/login`

### 6. **Ventajas de Vercel**

#### 6.1. Características Técnicas
- ✅ Soporte nativo para Next.js
- ✅ API Routes funcionan perfectamente
- ✅ Serverless functions automáticas
- ✅ Edge functions para mejor rendimiento
- ✅ Deploy automático desde GitHub
- ✅ SSL automático y global

#### 6.2. Características de Desarrollo
- ✅ Preview deployments para PRs
- ✅ Rollback fácil a versiones anteriores
- ✅ Analytics integrados
- ✅ Logs en tiempo real
- ✅ Integración con GitHub Actions

### 7. **Comandos Útiles**

```bash
# Deploy manual
npm run deploy:vercel

# Ver logs en tiempo real
vercel logs

# Ver información del proyecto
vercel inspect

# Rollback a versión anterior
vercel rollback

# Configurar variables de entorno
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

### 8. **Troubleshooting**

#### 8.1. Problemas Comunes
- **Build Error**: Verifica que todas las dependencias estén en `package.json`
- **Variables de entorno**: Asegúrate de que estén configuradas en Vercel
- **API Routes 404**: Verifica que las rutas estén en `/api/`

#### 8.2. Logs y Debugging
- Usa `vercel logs` para ver logs en tiempo real
- Revisa el dashboard de Vercel para errores de build
- Verifica las variables de entorno en el dashboard

### 9. **Siguientes Pasos**

1. **Configurar Analytics**: Habilitar Vercel Analytics
2. **Optimizar Performance**: Usar Vercel Speed Insights
3. **Configurar Notificaciones**: Slack/Discord para deployments
4. **Backup**: Configurar backup automático de la base de datos

---

## 🎉 ¡Listo!

Tu aplicación EcoSwap estará funcionando perfectamente en Vercel con todas las funcionalidades de Next.js disponibles.
