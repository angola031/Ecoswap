# Diagnóstico: Imágenes No Se Suben

## Problema Identificado

Las imágenes de los productos no se están subiendo correctamente al bucket de Storage.

## Solución Implementada

He agregado logging detallado tanto en el formulario como en la API para identificar exactamente dónde está el problema.

## Pasos de Diagnóstico

### **Paso 1: Probar Agregar Producto con Imágenes**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Ir a** `http://localhost:3000/agregar-producto`
4. **Completar el formulario:**
   - Título: "Producto de Prueba"
   - Descripción: "Descripción de prueba"
   - Precio: 1000
   - Condición: "Como Nuevo"
   - Categoría: "Electrónicos"
   - Ubicación: "Bogotá"
   - **Subir al menos 1 imagen**
5. **Hacer clic en "Publicar Producto"**
6. **Revisar los logs en la consola**

### **Paso 2: Interpretar los Logs**

**Logs esperados del formulario:**
```
🖼️ Formulario: Iniciando subida de imágenes
📊 Formulario: Imágenes a subir: 1
📦 Formulario: Producto ID: 123
📤 Formulario: Subiendo imagen 1: {fileName: "123_1.jpg", filePath: "productos/123_1.jpg", fileSize: 12345}
✅ Formulario: Imagen 1 subida a Storage: {path: "productos/123_1.jpg"}
✅ Formulario: Imagen 1 URL generada: https://...
💾 Formulario: Enviando referencias de imágenes a la API: [...]
📡 Formulario: Respuesta de la API de imágenes: {status: 200, ok: true}
✅ Formulario: Referencias de imágenes guardadas: {...}
```

**Logs esperados de la API:**
```
🖼️ API Images: Iniciando subida de imágenes
✅ API Images: Usuario autenticado: usuario@ejemplo.com
📦 API Images: Datos recibidos: {producto_id: 123, imagenesCount: 1}
💾 API Images: Insertando imágenes en la base de datos: [...]
✅ API Images: Imágenes insertadas correctamente: [...]
```

## Posibles Problemas y Soluciones

### **Problema 1: Error en Storage**
**Síntomas:**
- Error: "Bucket not found"
- Error: "Permission denied"
- Error: "Invalid file type"

**Solución:**
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'Ecoswap';

-- Si no existe, crearlo manualmente en Dashboard > Storage
```

### **Problema 2: Error en API de Imágenes**
**Síntomas:**
- Error: "Usuario no encontrado"
- Error: "No tienes permisos"
- Error: "Producto no encontrado"

**Solución:**
```sql
-- Verificar que el usuario existe
SELECT user_id, email FROM USUARIO WHERE email = 'tu_email@ejemplo.com';

-- Verificar que el producto existe
SELECT producto_id, user_id FROM PRODUCTO WHERE producto_id = 123;
```

### **Problema 3: Error de Validación**
**Síntomas:**
- Error: "estado_validacion constraint"
- Error: "tipo_transaccion constraint"

**Solución:**
```sql
-- Verificar constraints
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'tipo_transaccion');
```

### **Problema 4: Usuario No Verificado**
**Síntomas:**
- Error: "Usuario no verificado"
- Producto no se crea

**Solución:**
```sql
-- Marcar usuario como verificado
UPDATE USUARIO 
SET verificado = true 
WHERE email = 'tu_email@ejemplo.com';
```

## Verificación Paso a Paso

### **1. Verificar que el producto se crea:**
```sql
SELECT 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion
FROM PRODUCTO 
ORDER BY fecha_creacion DESC 
LIMIT 5;
```

### **2. Verificar que las imágenes se suben a Storage:**
- Ir a Supabase Dashboard > Storage > Ecoswap
- Verificar que hay archivos en la carpeta `productos/`

### **3. Verificar que las referencias se guardan:**
```sql
SELECT 
    imagen_id,
    producto_id,
    url_imagen,
    es_principal,
    orden
FROM IMAGEN_PRODUCTO 
ORDER BY fecha_subida DESC 
LIMIT 5;
```

## Prueba Manual Completa

### **Proceso:**
1. **Ir a** `/agregar-producto`
2. **Completar formulario** con imagen
3. **Enviar producto**
4. **Revisar consola** para logs
5. **Verificar en Storage** que la imagen se subió
6. **Verificar en BD** que las referencias se guardaron

### **Resultado Esperado:**
- ✅ Producto se crea con `estado_validacion = 'pending'`
- ✅ Imagen se sube a `Ecoswap/productos/`
- ✅ Referencia se guarda en `IMAGEN_PRODUCTO`
- ✅ Logs muestran todo el proceso exitoso

## Si Aún No Funciona

### **Debugging Avanzado:**

1. **Revisar logs de Supabase:**
   - Dashboard > Logs > API
   - Buscar errores relacionados con Storage

2. **Verificar permisos:**
   - Dashboard > Settings > API
   - Verificar que las políticas RLS están configuradas

3. **Probar Storage directamente:**
   ```javascript
   // En la consola del navegador
   const { data, error } = await supabase.storage
     .from('Ecoswap')
     .upload('test/test.jpg', file)
   console.log(data, error)
   ```

## Solución Rápida

Si nada funciona, ejecuta estos scripts en orden:

```sql
-- 1. Verificar sistema
\i database/verificacion-rapida.sql

-- 2. Configurar Auth si es necesario
\i database/add-auth-user-id-only.sql

-- 3. Configurar Storage si es necesario
\i database/configure-storage-simple.sql

-- 4. Probar nuevamente
```

## Soporte

Si encuentras algún problema:
1. Ejecuta la prueba manual
2. Revisa los logs en la consola
3. Verifica los logs en Supabase Dashboard
4. Confirma que todos los scripts se ejecutaron

¡Con este logging detallado podrás identificar exactamente dónde está el problema con las imágenes!
