-- =============================================
-- DIAGNÓSTICO DE PRODUCTOS Y STORAGE
-- =============================================

-- 1. Verificar productos en la base de datos
SELECT 
    'PRODUCTOS EN BD' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN estado_validacion = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado_validacion = 'approved' THEN 1 END) as aprobados,
    COUNT(CASE WHEN estado_validacion = 'rejected' THEN 1 END) as rechazados
FROM PRODUCTO;

-- 2. Verificar productos recientes
SELECT 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion,
    user_id
FROM PRODUCTO 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- 3. Verificar imágenes de productos
SELECT 
    'IMÁGENES EN BD' as tipo,
    COUNT(*) as total_imagenes,
    COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM IMAGEN_PRODUCTO;

-- 4. Verificar imágenes recientes
SELECT 
    ip.imagen_id,
    ip.producto_id,
    ip.url_imagen,
    ip.es_principal,
    ip.fecha_subida,
    p.titulo
FROM IMAGEN_PRODUCTO ip
LEFT JOIN PRODUCTO p ON ip.producto_id = p.producto_id
ORDER BY ip.fecha_subida DESC 
LIMIT 5;

-- 5. Verificar configuración del bucket
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    created_at,
    updated_at
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 6. Verificar archivos en Storage (si es posible)
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Verificar usuarios con productos
SELECT 
    u.user_id,
    u.email,
    u.nombre,
    u.apellido,
    u.es_admin,
    u.auth_user_id,
    COUNT(p.producto_id) as total_productos
FROM USUARIO u
LEFT JOIN PRODUCTO p ON u.user_id = p.user_id
GROUP BY u.user_id, u.email, u.nombre, u.apellido, u.es_admin, u.auth_user_id
ORDER BY total_productos DESC;

-- 8. Verificar errores comunes
SELECT 
    'VERIFICACIONES' as tipo,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK - Hay productos'
        ELSE 'ERROR - No hay productos'
    END as estado_productos,
    CASE 
        WHEN COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) > 0 THEN 'OK - Usuarios conectados con Auth'
        ELSE 'ERROR - Usuarios no conectados con Auth'
    END as estado_auth,
    CASE 
        WHEN COUNT(CASE WHEN es_admin = true THEN 1 END) > 0 THEN 'OK - Hay administradores'
        ELSE 'ERROR - No hay administradores'
    END as estado_admins
FROM USUARIO;

-- 9. Verificar políticas de Storage (si existen)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Ecoswap%' OR policyname LIKE '%productos%';

-- 10. Mostrar resumen
SELECT 
    'RESUMEN' as tipo,
    'Ejecuta este script para diagnosticar problemas con productos y Storage' as instruccion;
