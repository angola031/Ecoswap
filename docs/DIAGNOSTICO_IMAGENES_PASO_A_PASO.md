# Diagnóstico de Imágenes - Paso a Paso

## Problema: Las imágenes no se guardan

## Solución Rápida

### **Paso 1: Verificar Storage**
Ejecuta este script en Supabase SQL Editor:

```sql
\i database/verificar-storage-simple.sql
```

**Resultado esperado:**
- ✅ Bucket Ecoswap existe
- ✅ Bucket es público
- ✅ Hay archivos en productos/ (después de probar)

### **Paso 2: Verificar Tabla de Imágenes**
Ejecuta este script en Supabase SQL Editor:

```sql
\i database/prueba-imagen-rapida.sql
```

**Resultado esperado:**
- ✅ La tabla IMAGEN_PRODUCTO funciona correctamente

### **Paso 3: Probar Agregar Producto**
1. **Abrir DevTools** (F12)
2. **Ir a Console**
3. **Ir a** `http://localhost:3000/agregar-producto`
4. **Completar formulario con imagen**
5. **Revisar logs en consola**

## Interpretación de Resultados

### **Si el bucket no existe:**
1. Ir a Supabase Dashboard > Storage
2. Hacer clic en "New bucket"
3. Nombre: `Ecoswap`
4. Marcar "Public bucket"
5. Crear

### **Si el bucket no es público:**
1. Ir a Supabase Dashboard > Storage
2. Seleccionar bucket `Ecoswap`
3. Ir a Settings
4. Marcar "Public bucket"
5. Guardar

### **Si la tabla no funciona:**
```sql
-- Verificar que la tabla existe
SELECT table_name FROM information_schema.tables WHERE table_name = 'imagen_producto';

-- Si no existe, crearla
\i database/update-imagen-producto-table.sql
```

### **Si el usuario no existe:**
```sql
-- Verificar usuario
SELECT user_id, email FROM USUARIO WHERE email = 'tu_email@ejemplo.com';

-- Si no existe, crearlo
INSERT INTO USUARIO (email, nombre, apellido, password_hash, verificado, activo)
VALUES ('tu_email@ejemplo.com', 'Tu Nombre', 'Tu Apellido', '', true, true);
```

## Logs Esperados

### **Si funciona correctamente:**
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

### **Si hay errores:**
- ❌ Error en Storage → Verificar bucket
- ❌ Error en API → Verificar usuario
- ❌ Error en BD → Verificar tabla

## Verificación Final

### **Después de aplicar las soluciones:**

1. **Verificar en Storage:**
   - Dashboard > Storage > Ecoswap
   - Debería haber archivos en `productos/`

2. **Verificar en Base de Datos:**
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
   - Agregar producto con imagen
   - Verificar que aparece en Storage
   - Verificar que se guarda en BD

## Solución de Emergencia

Si nada funciona, ejecuta estos scripts en orden:

```sql
-- 1. Verificar sistema
\i database/verificacion-rapida.sql

-- 2. Configurar Storage
\i database/configure-storage-simple.sql

-- 3. Configurar Auth
\i database/add-auth-user-id-only.sql

-- 4. Configurar admin
\i database/setup-admin-user.sql
SELECT * FROM setup_admin_user('tu_email@ejemplo.com', 'Tu Nombre', 'Tu Apellido');
```

## Soporte

Si encuentras algún problema:
1. Ejecuta los scripts de verificación
2. Revisa los logs en la consola
3. Verifica la configuración en Supabase Dashboard
4. Confirma que todos los scripts se ejecutaron

¡Con este diagnóstico paso a paso podrás identificar y solucionar el problema!
