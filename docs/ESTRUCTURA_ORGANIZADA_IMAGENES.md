# Estructura Organizada de Imágenes

## Nueva Estructura Implementada

```
Ecoswap/
├── productos/
│   ├── user_1/
│   │   ├── 9/
│   │   │   ├── 9_1.jpg
│   │   │   └── 9_2.jpg
│   │   └── 10/
│   │       ├── 10_1.jpg
│   │       └── 10_2.jpg
│   └── user_2/
│       └── 11/
│           └── 11_1.jpg
```

## Cambios Realizados

### **1. Código del Formulario Actualizado**
- ✅ Estructura: `productos/user_{user_id}/{id_producto}/`
- ✅ Nombre de archivo: `{producto_id}_{numero}.{extension}`
- ✅ Ejemplo: `productos/user_1/9/9_1.jpg`

### **2. Políticas de Storage Actualizadas**
- ✅ INSERT: Usuarios autenticados pueden subir a `productos/user_%/%`
- ✅ SELECT: Público puede leer de `productos/user_%/%`
- ✅ UPDATE: Usuarios autenticados pueden actualizar
- ✅ DELETE: Usuarios autenticados pueden eliminar

## Pasos para Aplicar

### **Paso 1: Actualizar Políticas de Storage**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/actualizar-politicas-storage-organizado.sql
```

### **Paso 2: Verificar Estructura**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/verificar-estructura-user-producto.sql
```

### **Paso 3: Probar Agregar Producto**
1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Ir a** `http://localhost:3000/agregar-producto`
4. **Completar formulario con imágenes**
5. **Revisar logs en consola**

## Logs Esperados

### **Formulario:**
```
📤 Formulario: Subiendo imagen 1: {fileName: "9_1.jpg", filePath: "productos/user_1/9/9_1.jpg", fileSize: 12345}
✅ Formulario: Imagen 1 subida a Storage: {path: "productos/user_1/9/9_1.jpg"}
✅ Formulario: Imagen 1 URL generada: https://...
```

### **API:**
```
🖼️ API Images: Iniciando subida de imágenes
✅ API Images: Usuario autenticado: usuario@ejemplo.com
📦 API Images: Datos recibidos: {producto_id: 9, imagenesCount: 2}
✅ API Images: Imágenes insertadas correctamente: [...]
```

## Verificación

### **1. En Supabase Dashboard:**
- Ir a Storage > Ecoswap
- Verificar que hay carpetas `user_1/`, `user_2/`, etc.
- Dentro de cada carpeta de usuario, verificar carpetas con ID de producto

### **2. En Base de Datos:**
```sql
SELECT 
    ip.imagen_id,
    ip.producto_id,
    ip.url_imagen,
    p.titulo,
    u.user_id
FROM IMAGEN_PRODUCTO ip
JOIN PRODUCTO p ON ip.producto_id = p.producto_id
JOIN USUARIO u ON p.user_id = u.user_id
ORDER BY ip.fecha_subida DESC;
```

## Ventajas de Esta Estructura

1. **Organización por Usuario**: Cada usuario tiene su propia carpeta
2. **Organización por Producto**: Cada producto tiene su propia subcarpeta
3. **Fácil Mantenimiento**: Fácil encontrar y gestionar imágenes
4. **Escalabilidad**: No hay límite de productos por usuario
5. **Seguridad**: Políticas RLS por estructura de carpetas

## Estructura de URLs

Las URLs públicas serán:
```
https://tu-proyecto.supabase.co/storage/v1/object/public/Ecoswap/productos/user_1/9/9_1.jpg
```

## Migración de Archivos Existentes

Si tienes archivos en la estructura antigua (`productos/archivo.jpg`), puedes:

1. **Dejarlos como están** (se seguirán mostrando)
2. **Migrarlos** a la nueva estructura manualmente
3. **Crear un script de migración** (si es necesario)

## Solución de Problemas

### **Error: "new row violates row-level security policy"**
- Ejecutar: `database/actualizar-politicas-storage-organizado.sql`
- Verificar que las políticas se crearon correctamente

### **Error: "Bucket not found"**
- Verificar que el bucket `Ecoswap` existe
- Verificar que está marcado como público

### **Error: "Usuario no encontrado"**
- Verificar que el usuario existe en la tabla `USUARIO`
- Verificar que está autenticado correctamente

¡Con esta estructura organizada, las imágenes estarán perfectamente organizadas y será fácil gestionarlas!
