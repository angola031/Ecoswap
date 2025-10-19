-- Verificar datos en la tabla visualizacion_producto
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar estructura de la tabla
SELECT 
    'Estructura de visualizacion_producto' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar datos existentes
SELECT 
    'Datos en visualizacion_producto' as info,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos,
    MIN(fecha_visualizacion) as fecha_mas_antigua,
    MAX(fecha_visualizacion) as fecha_mas_reciente
FROM public.visualizacion_producto;

-- 3. Mostrar visualizaciones del usuario 1
SELECT 
    'Visualizaciones del usuario 1' as info,
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    p.titulo as producto_titulo,
    p.estado_publicacion,
    p.estado_validacion
FROM public.visualizacion_producto v
JOIN public.producto p ON v.producto_id = p.producto_id
WHERE v.usuario_id = 1
ORDER BY v.fecha_visualizacion DESC;

-- 4. Crear algunos datos de prueba si no existen
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES 
    (1, 16, NOW() - INTERVAL '2 days'),
    (1, 18, NOW() - INTERVAL '1 day'),
    (1, 16, NOW() - INTERVAL '3 hours')
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion;

-- 5. Verificar estado final
SELECT 
    'Estado final - Usuario 1' as info,
    COUNT(*) as total_visualizaciones,
    array_agg(DISTINCT producto_id ORDER BY producto_id) as productos_vistos
FROM public.visualizacion_producto 
WHERE usuario_id = 1;
