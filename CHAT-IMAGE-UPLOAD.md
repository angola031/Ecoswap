# Funcionalidad de Subida de Imágenes en Chat

## 📋 Descripción

Se ha implementado la funcionalidad completa para subir imágenes en el chat de Ecoswap. Los usuarios pueden adjuntar imágenes a sus mensajes, que se almacenan de forma segura en Supabase Storage.

## ✨ Características

- **Compresión automática**: Las imágenes se comprimen automáticamente para optimizar el almacenamiento
- **Preview de imagen**: Los usuarios pueden ver la imagen antes de subirla
- **Comentarios opcionales**: Se puede agregar un comentario que aparecerá junto con la imagen
- **Subida de imágenes**: Los usuarios pueden adjuntar imágenes desde su dispositivo
- **Validación de archivos**: Solo se permiten archivos de imagen (JPEG, PNG, GIF, etc.)
- **Límite de tamaño**: Máximo 10MB para archivos originales, comprimidos a máximo 1MB
- **Optimización de storage**: Compresión inteligente que reduce el uso del bucket hasta en 80%
- **Almacenamiento organizado**: Las imágenes se almacenan en carpetas específicas por chat: `mensajes/chat_{chatId}/`
- **URLs públicas**: Las imágenes son accesibles públicamente para su visualización
- **UI optimista**: La interfaz se actualiza inmediatamente mientras se sube la imagen
- **Manejo de errores**: Mensajes de error claros para el usuario
- **Visualización mejorada**: Las imágenes se muestran con información del archivo y opción de ampliar
- **Modal de preview compacto**: Interfaz intuitiva y compacta para revisar y comentar antes de enviar
- **Información de compresión**: Muestra el tamaño original vs comprimido y el porcentaje de ahorro

## 🏗️ Arquitectura

### API Endpoint
- **Ruta**: `/api/chat/upload-image`
- **Método**: POST
- **Función**: Sube imágenes al bucket de Supabase Storage

### Componente ChatModule
- **Función**: `onImageSelected()` - Maneja la selección y subida de imágenes
- **UI**: Botón de adjuntar imagen con ícono apropiado
- **Visualización**: Mensajes de imagen con preview y metadata

### Base de Datos
- **Tabla**: `mensaje`
- **Campo**: `archivo_url` - URL de la imagen subida
- **Tipo**: `imagen` - Tipo de mensaje para imágenes

## 📁 Estructura de Archivos

```
app/api/chat/upload-image/route.ts    # Endpoint para subir imágenes
components/chat/ChatModule.tsx        # Componente principal del chat
scripts/test-image-upload.js          # Script de prueba
```

## 🔧 Configuración Requerida

### Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Supabase Storage
- **Bucket**: `Ecoswap` (debe existir)
- **Estructura de carpetas**: `mensajes/chat_{chatId}/` (se crea automáticamente por chat)
- **Organización**: Cada chat tiene su propia carpeta para las imágenes
- **Políticas**: Acceso público de lectura para las imágenes

### Base de Datos
La tabla `mensaje` debe tener los campos:
- `tipo` (enum: 'texto', 'imagen', 'ubicacion')
- `archivo_url` (varchar, nullable)

## 🚀 Uso

### Para Usuarios
1. Abrir un chat existente
2. Hacer clic en el botón de imagen (📷) en la barra de entrada de mensajes
3. Seleccionar una imagen del dispositivo (máximo 10MB)
4. **Esperar la compresión** - la imagen se comprimirá automáticamente
5. **Revisar la imagen** en el modal de preview compacto que aparece
6. **Ver estadísticas de compresión** - tamaño original vs comprimido
7. **Agregar un comentario** (opcional) en el campo de texto
8. Hacer clic en "Enviar Imagen" para subirla al chat
9. La imagen comprimida aparecerá en el chat con el comentario (si se agregó uno)
10. Hacer clic en la imagen para verla en tamaño completo

### Para Desarrolladores
```typescript
// Ejemplo de uso programático
const formData = new FormData()
formData.append('image', file)
formData.append('chatId', chatId)
formData.append('userId', userId)

const response = await fetch('/api/chat/upload-image', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
})
```

## 🧪 Pruebas

### Scripts de Prueba
```bash
# Probar configuración básica de imágenes
node scripts/test-image-upload.js

# Probar carpetas por chat
node scripts/test-chat-folders.js
```

**Script básico verifica:**
- ✅ Existencia del bucket "Ecoswap"
- ✅ Creación de la carpeta "mensajes"
- ✅ Subida de imagen de prueba
- ✅ Generación de URL pública
- ✅ Limpieza de archivos de prueba

**Script de carpetas por chat verifica:**
- ✅ Creación automática de carpetas por chat
- ✅ Estructura organizada: `mensajes/chat_{chatId}/`
- ✅ URLs públicas funcionando por carpeta
- ✅ Organización de archivos por conversación

### Pruebas Manuales
1. **Preview de imagen**: Seleccionar una imagen y verificar que aparezca el modal de preview
2. **Comentario opcional**: Agregar un comentario en el modal y verificar que aparezca en el chat
3. **Subida exitosa**: Seleccionar una imagen válida < 5MB y enviarla
4. **Validación de tipo**: Intentar subir un archivo que no sea imagen
5. **Validación de tamaño**: Intentar subir una imagen > 5MB
6. **Cancelación**: Verificar que se puede cancelar la subida desde el modal
7. **Visualización**: Verificar que las imágenes se muestren correctamente con comentarios
8. **Ampliación**: Hacer clic en la imagen para verla en tamaño completo

### Nuevas Funcionalidades
- **Modal de Preview Compacto**: Verificar que se abra al seleccionar una imagen
- **Compresión Automática**: Verificar que las imágenes se compriman automáticamente
- **Estadísticas de Compresión**: Verificar que se muestre tamaño original, comprimido y porcentaje de ahorro
- **Campo de Comentario**: Verificar que se pueda escribir y que tenga límite de 500 caracteres
- **Información del Archivo**: Verificar que se muestre nombre, tipo y tamaños
- **Botones de Acción**: Verificar que "Cancelar" y "Enviar Imagen" funcionen correctamente
- **Preview Más Pequeño**: Verificar que la imagen de preview sea más compacta
- **Estado de Compresión**: Verificar que se muestre indicador de carga durante la compresión

## 🔒 Seguridad

- **Autenticación**: Se requiere token de sesión válido
- **Validación**: Solo archivos de imagen permitidos
- **Límites**: Máximo 5MB por archivo
- **Nomenclatura**: Nombres de archivo únicos con timestamp
- **Autorización**: Solo usuarios del chat pueden subir imágenes

## 🐛 Solución de Problemas

### Error: "No se encontró el archivo"
- Verificar que se seleccionó un archivo
- Comprobar permisos del navegador para acceso a archivos

### Error: "El archivo es demasiado grande"
- Reducir el tamaño de la imagen
- Comprimir la imagen antes de subirla

### Error: "Solo se permiten archivos de imagen"
- Verificar que el archivo sea una imagen válida
- Comprobar la extensión del archivo

### Error: "Token inválido"
- Verificar que el usuario esté autenticado
- Comprobar que la sesión no haya expirado

### Error: "Error subiendo imagen"
- Verificar conexión a internet
- Comprobar configuración de Supabase
- Revisar logs del servidor

## 📈 Mejoras Futuras

- [ ] Compresión automática de imágenes
- [ ] Soporte para múltiples imágenes por mensaje
- [ ] Galería de imágenes en el chat
- [ ] Filtros y edición básica de imágenes
- [ ] Progreso de subida visual
- [ ] Soporte para videos cortos

## 📞 Soporte

Para reportar problemas o solicitar nuevas características, crear un issue en el repositorio del proyecto.
