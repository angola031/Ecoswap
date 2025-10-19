-- Script para verificar que los likes se muestran correctamente
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar que el campo total_likes existe y tiene datos
SELECT 
    'Verificación del campo total_likes' as verificacion,
    COUNT(*) as total_productos,
    COUNT(*) FILTER (WHERE total_likes IS NOT NULL) as productos_con_campo,
    SUM(total_likes) as total_likes_sistema,
    MAX(total_likes) as max_likes,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes
FROM public.producto;

-- 2. Mostrar algunos productos con sus likes
SELECT 
    'Productos con likes' as muestra,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;

-- 3. Verificar favoritos reales
SELECT 
    'Favoritos en la base de datos' as info,
    COUNT(*) as total_favoritos,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_favoritos
FROM public.favorito;

-- 4. Verificar sincronización (comparar contadores con favoritos reales)
SELECT 
    'Verificación de sincronización' as verificacion,
    p.producto_id,
    p.titulo,
    p.total_likes as contador_sistema,
    COUNT(f.favorito_id) as favoritos_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING p.total_likes != COUNT(f.favorito_id) OR (p.total_likes > 0 OR COUNT(f.favorito_id) > 0)
ORDER BY p.total_likes DESC
LIMIT 10;

-- 5. Si no hay likes, crear algunos favoritos de prueba
-- DESCOMENTA las siguientes líneas si quieres crear datos de prueba:

/*
-- Crear algunos favoritos de prueba (reemplaza los IDs con productos reales)
INSERT INTO public.favorito (usuario_id, producto_id, fecha_agregado)
VALUES 
    (1, 1, NOW()),
    (1, 2, NOW()),
    (2, 1, NOW()),
    (3, 1, NOW())
ON CONFLICT (usuario_id, producto_id) DO NOTHING;
*/

-- 6. Mostrar estado final
SELECT 
    'Estado final del sistema' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    (SELECT COUNT(*) FROM public.favorito) as total_favoritos_reales
FROM public.producto;
