-- =============================================
-- VERIFICACIÓN RÁPIDA DEL SISTEMA
-- =============================================

-- 1. Verificar que el servidor esté funcionando
SELECT 
    'SERVIDOR' as tipo,
    'Si puedes ejecutar esto, el servidor está funcionando' as estado;

-- 2. Verificar columnas de validación
SELECT 
    'COLUMNAS VALIDACIÓN' as tipo,
    CASE 
        WHEN COUNT(*) = 4 THEN 'OK - Todas las columnas existen'
        ELSE 'ERROR - Faltan columnas'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por', 'comentarios_validacion');

-- 3. Verificar columna auth_user_id
SELECT 
    'AUTH_USER_ID' as tipo,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK - Columna existe'
        ELSE 'ERROR - Columna no existe'
    END as estado
FROM information_schema.columns 
WHERE table_name = 'USUARIO' 
AND column_name = 'auth_user_id';

-- 4. Verificar bucket Storage
SELECT 
    'STORAGE BUCKET' as tipo,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK - Bucket Ecoswap existe'
        ELSE 'ERROR - Bucket no existe'
    END as estado
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 5. Verificar usuarios
SELECT 
    'USUARIOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN es_admin = true THEN 1 END) as administradores,
    COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as conectados_auth
FROM USUARIO;

-- 6. Verificar productos
SELECT 
    'PRODUCTOS' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN estado_validacion = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado_validacion = 'approved' THEN 1 END) as aprobados
FROM PRODUCTO;

-- 7. Verificar imágenes
SELECT 
    'IMÁGENES' as tipo,
    COUNT(*) as total,
    COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM IMAGEN_PRODUCTO;

-- 8. Mostrar resumen
SELECT 
    'RESUMEN' as tipo,
    'Si todos los estados son OK, el sistema está funcionando correctamente' as mensaje;
