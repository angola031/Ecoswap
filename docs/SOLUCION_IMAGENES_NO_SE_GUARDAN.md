# Solución: Imágenes No Se Guardan

## Problema Identificado

Las imágenes de los productos no se están guardando en el bucket de Storage ni en la base de datos.

## Diagnóstico Paso a Paso

### **Paso 1: Verificar Configuración de Storage**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/verificar-storage.sql
```

**Resultado esperado:**
- ✅ Bucket `Ecoswap` existe
- ✅ Bucket está marcado como público
- ✅ Hay archivos en la carpeta `productos/` (si ya se subieron antes)

### **Paso 2: Verificar Tabla de Imágenes**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/prueba-subida-imagen.sql
```

**Resultado esperado:**
- ✅ La imagen de prueba se inserta correctamente
- ✅ La tabla `IMAGEN_PRODUCTO` funciona

### **Paso 3: Probar Agregar Producto con Logs**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Ir a** `http://localhost:3000/agregar-producto`
4. **Completar el formulario con una imagen**
5. **Revisar los logs en la consola**

## Interpretación de Logs

### **Si ves estos logs, todo está funcionando:**
```
🖼️ Formulario: Iniciando subida de imágenes
📊 Formulario: Imágenes a subir: 1
📦 Formulario: Producto ID: 123
📤 Formulario: Subiendo imagen 1: {...}
✅ Formulario: Imagen 1 subida a Storage: {...}
✅ Formulario: Imagen 1 URL generada: https://...
💾 Formulario: Enviando referencias de imágenes a la API: [...]
📡 Formulario: Respuesta de la API de imágenes: {status: 200, ok: true}
✅ Formulario: Referencias de imágenes guardadas: {...}
```

### **Si ves errores, identifica el problema:**

**Error en Storage:**
```
❌ Formulario: Error subiendo imagen: {message: "Bucket not found"}
```
**Solución:** Crear el bucket `Ecoswap` en Dashboard > Storage

**Error en API:**
```
❌ Formulario: Error guardando referencias de imágenes: {error: "Usuario no encontrado"}
```
**Solución:** Verificar que el usuario existe en la tabla `USUARIO`

**Error de permisos:**
```
❌ Formulario: Error subiendo imagen: {message: "Permission denied"}
```
**Solución:** Marcar el bucket como público

## Soluciones por Problema

### **Problema 1: Bucket no existe**
**Síntomas:**
- Error: "Bucket not found"
- No hay bucket `Ecoswap` en Storage

**Solución:**
1. Ir a Supabase Dashboard > Storage
2. Hacer clic en "New bucket"
3. Nombre: `Ecoswap`
4. Marcar como "Public bucket"
5. Crear bucket

### **Problema 2: Bucket no es público**
**Síntomas:**
- Error: "Permission denied"
- Bucket existe pero no es público

**Solución:**
1. Ir a Supabase Dashboard > Storage
2. Seleccionar bucket `Ecoswap`
3. Ir a Settings
4. Marcar "Public bucket"
5. Guardar

### **Problema 3: Usuario no existe en BD**
**Síntomas:**
- Error: "Usuario no encontrado"
- API devuelve 404

**Solución:**
```sql
-- Verificar que el usuario existe
SELECT user_id, email FROM USUARIO WHERE email = 'tu_email@ejemplo.com';

-- Si no existe, crearlo
INSERT INTO USUARIO (email, nombre, apellido, password_hash, verificado, activo)
VALUES ('tu_email@ejemplo.com', 'Tu Nombre', 'Tu Apellido', '', true, true);
```

### **Problema 4: Producto no se crea**
**Síntomas:**
- Error: "Producto no encontrado"
- No hay producto_id para las imágenes

**Solución:**
```sql
-- Verificar que los productos se crean
SELECT producto_id, titulo, estado_validacion FROM PRODUCTO ORDER BY fecha_creacion DESC;

-- Si no hay productos, verificar la API de productos
```

### **Problema 5: Tabla IMAGEN_PRODUCTO no existe**
**Síntomas:**
- Error: "relation imagen_producto does not exist"

**Solución:**
```sql
-- Verificar que la tabla existe
SELECT table_name FROM information_schema.tables WHERE table_name = 'imagen_producto';

-- Si no existe, crearla
\i database/update-imagen-producto-table.sql
```

## Verificación Final

### **Después de aplicar las soluciones:**

1. **Verificar Storage:**
   - Ir a Dashboard > Storage > Ecoswap
   - Debería haber archivos en `productos/`

2. **Verificar Base de Datos:**
   ```sql
   SELECT 
       ip.imagen_id,
       ip.producto_id,
       ip.url_imagen,
       p.titulo
   FROM IMAGEN_PRODUCTO ip
   JOIN PRODUCTO p ON ip.producto_id = p.producto_id
   ORDER BY ip.fecha_subida DESC;
   ```

3. **Probar nuevamente:**
   - Agregar un producto con imagen
   - Verificar que aparece en Storage
   - Verificar que se guarda en BD

## Solución Rápida

Si nada funciona, ejecuta estos scripts en orden:

```sql
-- 1. Verificar sistema completo
\i database/verificacion-rapida.sql

-- 2. Configurar Storage
\i database/configure-storage-simple.sql

-- 3. Configurar Auth
\i database/add-auth-user-id-only.sql

-- 4. Configurar administrador
\i database/setup-admin-user.sql
SELECT * FROM setup_admin_user('tu_email@ejemplo.com', 'Tu Nombre', 'Tu Apellido');

-- 5. Probar nuevamente
```

## Soporte

Si encuentras algún problema:
1. Ejecuta los scripts de verificación
2. Revisa los logs en la consola
3. Verifica la configuración en Supabase Dashboard
4. Confirma que todos los scripts se ejecutaron

¡Con este diagnóstico sistemático podrás identificar y solucionar el problema con las imágenes!
