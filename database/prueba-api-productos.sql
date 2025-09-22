-- =============================================
-- PRUEBA RÁPIDA DE API DE PRODUCTOS
-- =============================================

-- 1. Verificar que las columnas de validación existen
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por', 'comentarios_validacion')
ORDER BY column_name;

-- 2. Verificar que las columnas de imagen existen
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'IMAGEN_PRODUCTO' 
AND column_name IN ('imagen_id', 'producto_id', 'url_imagen', 'es_principal', 'orden')
ORDER BY column_name;

-- 3. Verificar que la columna auth_user_id existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'USUARIO' 
AND column_name = 'auth_user_id';

-- 4. Crear un producto de prueba manualmente
INSERT INTO PRODUCTO (
    user_id,
    titulo,
    descripcion,
    precio,
    tipo_transaccion,
    estado,
    estado_validacion,
    fecha_creacion
) VALUES (
    1, -- Cambiar por tu user_id
    'Producto de Prueba API',
    'Este es un producto de prueba para verificar que la API funciona',
    1000,
    'venta',
    'usado',
    'pending',
    NOW()
) RETURNING producto_id, titulo, estado_validacion;

-- 5. Verificar que el producto se creó
SELECT 
    producto_id,
    titulo,
    descripcion,
    precio,
    estado_validacion,
    fecha_creacion,
    user_id
FROM PRODUCTO 
WHERE titulo = 'Producto de Prueba API';

-- 6. Verificar usuarios disponibles para pruebas
SELECT 
    user_id,
    email,
    nombre,
    apellido,
    verificado,
    activo,
    auth_user_id
FROM USUARIO 
ORDER BY user_id
LIMIT 5;

-- 7. Verificar bucket de Storage
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 8. Limpiar producto de prueba (opcional)
-- DELETE FROM PRODUCTO WHERE titulo = 'Producto de Prueba API';

-- Mostrar instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    '1. Verifica que todas las columnas existen' as paso1,
    '2. Si falta alguna columna, ejecuta los scripts de actualización' as paso2,
    '3. El producto de prueba se creó con user_id = 1' as paso3,
    '4. Cambia el user_id por el tuyo si es diferente' as paso4,
    '5. Si todo está OK, el problema está en el frontend' as paso5;
