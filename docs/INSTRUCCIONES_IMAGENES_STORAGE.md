# Instrucciones para Configurar Imágenes en Storage

## Problema Identificado

Las imágenes de productos no se están guardando en el bucket `Ecoswap` de Supabase Storage.

## Solución Implementada

He actualizado el sistema para que las imágenes se suban correctamente al bucket y se guarden las referencias en la base de datos.

### **Cambios Realizados:**

1. **Formulario actualizado** (`app/agregar-producto/page.tsx`):
   - Ahora sube las imágenes al bucket `Ecoswap/productos/`
   - Guarda las referencias en la tabla `IMAGEN_PRODUCTO`
   - Nombra los archivos como `{producto_id}_{numero}.{extension}`

2. **API de imágenes creada** (`app/api/products/images/route.ts`):
   - Endpoint para guardar referencias de imágenes
   - Verificación de permisos del usuario
   - Endpoint para obtener imágenes de un producto

3. **Políticas de Storage** (`database/configure-storage-policies.sql`):
   - Configuración de RLS para el bucket `Ecoswap`
   - Políticas para lectura pública y escritura autenticada

## Pasos para Configurar

### **Paso 1: Configurar Políticas de Storage**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/configure-storage-policies.sql
```

### **Paso 2: Verificar Bucket**
Asegúrate de que el bucket `Ecoswap` esté configurado como público:
1. Ve a Supabase Dashboard > Storage
2. Selecciona el bucket `Ecoswap`
3. Verifica que esté marcado como "Public"
4. Si no, marca la casilla "Public"

### **Paso 3: Probar el Sistema**
1. Ve a `/agregar-producto`
2. Completa el formulario con imágenes
3. Envía el producto
4. Verifica en Storage que las imágenes se subieron a `Ecoswap/productos/`
5. Verifica en la base de datos que las referencias se guardaron en `IMAGEN_PRODUCTO`

## Estructura de Archivos

### **En Storage:**
```
Ecoswap/
├── productos/
│   ├── 1_1.jpg
│   ├── 1_2.jpg
│   ├── 2_1.png
│   └── 2_2.jpg
├── usuarios/
├── mensajes/
└── validacion/
```

### **En Base de Datos:**
```sql
-- Tabla IMAGEN_PRODUCTO
imagen_id | producto_id | url_imagen | es_principal | orden
1         | 1           | https://... | true         | 1
2         | 1           | https://... | false        | 2
```

## Flujo Completo

1. **Usuario selecciona imágenes** → Se guardan en estado del componente
2. **Usuario envía formulario** → Se crea el producto en la base de datos
3. **Se obtiene producto_id** → Se usa para nombrar los archivos
4. **Se suben imágenes** → Al bucket `Ecoswap/productos/`
5. **Se obtienen URLs públicas** → De las imágenes subidas
6. **Se guardan referencias** → En la tabla `IMAGEN_PRODUCTO`

## Verificación

### **✅ Deberías ver:**
1. **En Storage**: Archivos en `Ecoswap/productos/` con nombres como `1_1.jpg`, `1_2.jpg`
2. **En Base de Datos**: Registros en `IMAGEN_PRODUCTO` con URLs públicas
3. **En Consola**: Mensajes de "Imagen X subida correctamente"
4. **En la App**: Productos con imágenes visibles

### **Verificar con consultas:**
```sql
-- Ver imágenes de un producto
SELECT * FROM IMAGEN_PRODUCTO WHERE producto_id = 1;

-- Ver productos con imágenes
SELECT 
    p.producto_id,
    p.titulo,
    COUNT(i.imagen_id) as total_imagenes
FROM PRODUCTO p
LEFT JOIN IMAGEN_PRODUCTO i ON p.producto_id = i.producto_id
GROUP BY p.producto_id, p.titulo;
```

## Si Hay Problemas

### **Error: "Bucket not found"**
- Verifica que el bucket `Ecoswap` existe en Storage
- Asegúrate de que esté configurado como público

### **Error: "Permission denied"**
- Ejecuta el script de políticas de Storage
- Verifica que el usuario esté autenticado

### **Error: "Invalid file type"**
- Verifica que las imágenes sean JPG, PNG o GIF
- Revisa el tamaño de los archivos (máximo 10MB)

### **Imágenes no se muestran**
- Verifica que las URLs públicas sean correctas
- Revisa que las políticas de Storage permitan lectura pública

## Soporte

Si encuentras algún problema:
1. Revisa la consola del navegador para errores
2. Verifica los logs en Supabase Dashboard > Logs
3. Confirma que las políticas de Storage estén configuradas
4. Verifica que el bucket esté marcado como público

¡Con estos cambios, las imágenes se guardarán correctamente en tu bucket de Storage!
