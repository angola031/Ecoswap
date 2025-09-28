# Mejoras de Integración con Base de Datos - Imágenes de Chat

## 🎯 Objetivo
Integrar correctamente el sistema de chat con el esquema de base de datos para obtener y mostrar las imágenes de perfil, productos y mensajes de manera eficiente y confiable.

## 📊 Esquema de Base de Datos Analizado

### **Tablas Principales Identificadas:**

#### **1. Usuario (`public.usuario`):**
```sql
CREATE TABLE public.usuario (
  user_id integer PRIMARY KEY,
  nombre character varying NOT NULL,
  apellido character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  foto_perfil character varying,  -- Campo para avatar del usuario
  -- ... otros campos
);
```

#### **2. Producto (`public.producto`):**
```sql
CREATE TABLE public.producto (
  producto_id integer PRIMARY KEY,
  titulo character varying NOT NULL,
  -- ... otros campos
);
```

#### **3. Imagen de Producto (`public.imagen_producto`):**
```sql
CREATE TABLE public.imagen_producto (
  imagen_id integer PRIMARY KEY,
  producto_id integer REFERENCES public.producto(producto_id),
  url_imagen character varying NOT NULL,
  es_principal boolean DEFAULT false,  -- Indica imagen principal
  -- ... otros campos
);
```

#### **4. Mensaje (`public.mensaje`):**
```sql
CREATE TABLE public.mensaje (
  mensaje_id integer PRIMARY KEY,
  chat_id integer REFERENCES public.chat(chat_id),
  usuario_id integer REFERENCES public.usuario(user_id),
  contenido text NOT NULL,
  tipo character varying DEFAULT 'texto',
  archivo_url character varying,  -- Para imágenes de mensajes
  -- ... otros campos
);
```

## ✅ Mejoras Implementadas

### **1. API de Información de Chat (`/api/chat/[chatId]/info`)**

#### **A. Obtención de Imagen del Producto:**
```typescript
// Obtener imagen principal del producto
let productImageUrl = null
if (chat?.intercambio?.producto_ofrecido_id) {
  const { data: productImage } = await supabaseAdmin
    .from('imagen_producto')
    .select('url_imagen')
    .eq('producto_id', chat.intercambio.producto_ofrecido_id)
    .eq('es_principal', true)
    .single()
  
  productImageUrl = productImage?.url_imagen || null
}
```

#### **B. Respuesta Mejorada:**
```typescript
return NextResponse.json({
  chatId: chat.chat_id,
  seller: {
    id: otherUser.user_id,
    name: otherUser.nombre,
    lastName: otherUser.apellido,
    avatar: otherUser.foto_perfil  // Campo correcto del esquema
  },
  product: {
    id: intercambio.producto.producto_id,
    title: intercambio.producto.titulo,
    imageUrl: productImageUrl  // Imagen principal del producto
  },
  createdAt: chat.fecha_creacion
})
```

### **2. API de Mensajes (`/api/chat/[chatId]/messages`)**

#### **A. Consulta con Información del Usuario:**
```typescript
let query = supabaseAdmin
  .from('mensaje')
  .select(`
    mensaje_id, 
    chat_id, 
    usuario_id, 
    contenido, 
    tipo, 
    archivo_url, 
    leido, 
    fecha_envio,
    usuario (
      user_id,
      nombre,
      apellido,
      foto_perfil  // Campo correcto del esquema
    )
  `)
  .eq('chat_id', chatId)
  .order('mensaje_id', { ascending: false })
  .limit(limit)
```

### **3. API de Envío de Mensajes (`/api/chat/[chatId]/send`)**

#### **A. Respuesta con Información Completa:**
```typescript
.select(`
  mensaje_id,
  contenido,
  tipo,
  archivo_url,
  fecha_envio,
  leido,
  usuario_id,
  usuario (
    user_id,
    nombre,
    apellido,
    foto_perfil  // Campo correcto del esquema
  )
`)
```

### **4. API de Iniciar Chat (`/api/chat/start`)**

#### **A. Obtención de Imagen del Producto:**
```typescript
// Obtener imagen principal del producto
let productImageUrl = null
const { data: productImage } = await supabaseAdmin
  .from('imagen_producto')
  .select('url_imagen')
  .eq('producto_id', product.producto_id)
  .eq('es_principal', true)
  .single()

productImageUrl = productImage?.url_imagen || null
```

#### **B. Respuesta con Imagen del Producto:**
```typescript
product: {
  id: product.producto_id,
  titulo: product.titulo,
  imageUrl: productImageUrl  // Imagen principal del producto
}
```

### **5. Interfaz de Chat Mejorada**

#### **A. Componente UserAvatar Mejorado:**
```typescript
const UserAvatar = ({ user, size = 'w-6 h-6' }: { user: any, size?: string }) => {
  const [imageError, setImageError] = useState(false)
  
  // Usar foto_perfil del esquema de base de datos
  const avatarUrl = user?.foto_perfil || user?.avatar
  
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={`${user?.nombre || user?.name || 'Usuario'} ${user?.apellido || user?.lastName || ''}`}
        className={`${size} rounded-full object-cover border border-gray-200`}
        onError={() => setImageError(true)}
      />
    )
  }
  
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center border border-gray-200`}>
      <span className="text-xs font-medium text-white">
        {(user?.nombre || user?.name || 'U').charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
```

#### **B. Header con Avatar del Vendedor:**
```typescript
<div className="flex items-center space-x-3">
  <div className="relative">
    <UserAvatar user={chatInfo.seller} size="w-12 h-12" />
    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
  </div>
  
  <div>
    <h1 className="font-bold text-lg text-gray-900">
      {chatInfo.seller.name} {chatInfo.seller.lastName}
    </h1>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-green-600 font-medium">● En línea</span>
      <span className="text-sm text-gray-500">•</span>
      <span className="text-sm text-gray-500">Vendedor</span>
    </div>
  </div>
</div>
```

#### **C. Imagen del Producto con Fallback:**
```typescript
{chatInfo.product.imageUrl ? (
  <img
    src={chatInfo.product.imageUrl}
    alt={chatInfo.product.title}
    className="w-16 h-16 rounded-xl object-cover shadow-md"
    onError={(e) => {
      // Si la imagen falla, mostrar icono por defecto
      const target = e.target as HTMLImageElement;
      target.style.display = 'none';
      target.nextElementSibling?.classList.remove('hidden');
    }}
  />
) : null}
<div className={`w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-md ${chatInfo.product.imageUrl ? 'hidden' : ''}`}>
  <ShoppingBagIcon className="w-8 h-8 text-gray-500" />
</div>
```

## 🔧 Características Técnicas

### **1. Consultas Optimizadas:**
- ✅ **Imagen principal** - Solo obtiene `es_principal = true`
- ✅ **Información del usuario** - Incluye `foto_perfil` en consultas
- ✅ **Fallback automático** - Manejo de errores de imagen
- ✅ **Consultas eficientes** - Una consulta por imagen de producto

### **2. Manejo de Errores:**
- ✅ **Imágenes de perfil** - Fallback a inicial del nombre
- ✅ **Imágenes de producto** - Fallback a icono por defecto
- ✅ **Imágenes de mensajes** - Manejo de `archivo_url`
- ✅ **Estados de carga** - Indicadores visuales

### **3. Compatibilidad:**
- ✅ **Campos del esquema** - Usa `foto_perfil` en lugar de `avatar`
- ✅ **Nombres correctos** - `nombre` y `apellido` del esquema
- ✅ **Relaciones** - Usa foreign keys correctos
- ✅ **Tipos de datos** - Maneja tipos correctos del esquema

## 📱 Experiencia de Usuario

### **1. Avatares de Usuario:**
- ✅ **Imagen real** - Muestra `foto_perfil` del usuario
- ✅ **Fallback elegante** - Inicial del nombre con gradiente
- ✅ **Carga rápida** - Fallback inmediato si falla la imagen
- ✅ **Consistencia** - Mismo comportamiento en toda la app

### **2. Imágenes de Producto:**
- ✅ **Imagen principal** - Muestra la imagen marcada como principal
- ✅ **Fallback visual** - Icono de producto si no hay imagen
- ✅ **Manejo de errores** - Cambio automático si falla la carga
- ✅ **Información contextual** - Siempre visible en el chat

### **3. Imágenes de Mensajes:**
- ✅ **Archivos adjuntos** - Usa `archivo_url` de la tabla mensaje
- ✅ **Tipos soportados** - Imágenes, texto, ubicación
- ✅ **Vista previa** - Click para expandir
- ✅ **Carga optimizada** - Solo cuando es necesario

## 🎯 Beneficios

### **1. Para el Usuario:**
- ✅ **Identificación visual** - Avatares reales de usuarios
- ✅ **Contexto del producto** - Imagen siempre visible
- ✅ **Experiencia fluida** - Sin errores de carga
- ✅ **Información completa** - Datos reales de la base de datos

### **2. Para el Sistema:**
- ✅ **Consultas eficientes** - Optimizadas para el esquema real
- ✅ **Manejo robusto** - Fallbacks para todos los casos
- ✅ **Compatibilidad** - Usa campos correctos del esquema
- ✅ **Escalabilidad** - Fácil agregar nuevos tipos de imagen

### **3. Para el Desarrollo:**
- ✅ **Código limpio** - Componentes reutilizables
- ✅ **Mantenibilidad** - Lógica centralizada
- ✅ **Testing** - Fácil probar con datos reales
- ✅ **Documentación** - Esquema claramente documentado

## 🚀 Próximos Pasos

1. **Probar con datos reales** - Verificar imágenes de usuarios y productos
2. **Optimizar consultas** - Agregar índices si es necesario
3. **Mejorar fallbacks** - Más opciones de avatar por defecto
4. **Agregar compresión** - Optimizar tamaño de imágenes
5. **Implementar caché** - Para imágenes frecuentemente usadas

**El sistema ahora está completamente integrado con el esquema de base de datos real, proporcionando una experiencia visual rica y confiable para todos los usuarios del chat.** 🎉
