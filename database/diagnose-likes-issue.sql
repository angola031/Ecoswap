-- Diagnóstico completo del sistema de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar estructura de la tabla producto
SELECT 
    'Estructura de tabla producto' as check_type,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producto' 
    AND table_schema = 'public'
    AND column_name IN ('total_likes', 'fecha_actualizacion')
ORDER BY column_name;

-- 2. Verificar si hay productos con total_likes
SELECT 
    'Productos con total_likes' as check_type,
    COUNT(*) as total_productos,
    COUNT(*) FILTER (WHERE total_likes IS NOT NULL) as con_total_likes,
    COUNT(*) FILTER (WHERE total_likes > 0) as con_likes_mayor_cero,
    MIN(total_likes) as min_likes,
    MAX(total_likes) as max_likes,
    AVG(total_likes::DECIMAL) as promedio_likes
FROM public.producto;

-- 3. Verificar el producto 18 específicamente
SELECT 
    'Producto 18 - Estado completo' as check_type,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion,
    fecha_creacion,
    estado_publicacion,
    estado_validacion
FROM public.producto 
WHERE producto_id = 18;

-- 4. Verificar favoritos existentes
SELECT 
    'Favoritos en la base de datos' as check_type,
    COUNT(*) as total_favoritos,
    COUNT(DISTINCT producto_id) as productos_con_favoritos,
    COUNT(DISTINCT usuario_id) as usuarios_que_dieron_like
FROM public.favorito;

-- 5. Verificar favoritos del producto 18
SELECT 
    'Favoritos del producto 18' as check_type,
    COUNT(*) as total_favoritos_producto_18,
    usuario_id,
    fecha_agregado
FROM public.favorito 
WHERE producto_id = 18
GROUP BY usuario_id, fecha_agregado;

-- 6. Verificar triggers
SELECT 
    'Triggers en tabla favorito' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'favorito' 
    AND event_object_schema = 'public';

-- 7. Verificar funciones
SELECT 
    'Funciones relacionadas con likes' as check_type,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%likes%';

-- 8. Comparar contadores vs favoritos reales
SELECT 
    'Comparación contadores vs favoritos reales' as check_type,
    p.producto_id,
    p.titulo,
    p.total_likes as contador_sistema,
    COUNT(f.favorito_id) as favoritos_reales,
    (p.total_likes - COUNT(f.favorito_id)) as diferencia,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN 'Sincronizado'
        WHEN p.total_likes > COUNT(f.favorito_id) THEN 'Sobrecarga'
        WHEN p.total_likes < COUNT(f.favorito_id) THEN 'Subcarga'
        ELSE 'Error'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING p.total_likes != COUNT(f.favorito_id) OR (p.total_likes > 0 OR COUNT(f.favorito_id) > 0)
ORDER BY ABS(p.total_likes - COUNT(f.favorito_id)) DESC;

-- 9. Verificar políticas RLS
SELECT 
    'Políticas RLS en favorito' as check_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'favorito' 
    AND schemaname = 'public';

-- 10. Mostrar algunos productos de ejemplo
SELECT 
    'Productos de ejemplo' as check_type,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
ORDER BY total_likes DESC NULLS LAST
LIMIT 10;
