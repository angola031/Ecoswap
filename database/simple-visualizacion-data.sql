-- Script simple para crear datos de visualización
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar datos existentes
SELECT 
    'Datos existentes' as info,
    COUNT(*) as total_visualizaciones,
    COUNT(DISTINCT usuario_id) as usuarios_unicos
FROM public.visualizacion_producto;

-- 2. Crear datos de prueba usando UPSERT individual
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES (1, 16, NOW() - INTERVAL '2 days')
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion;

INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES (1, 18, NOW() - INTERVAL '1 day')
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion;

-- 3. Verificar que se crearon
SELECT 
    'Visualizaciones del usuario 1' as info,
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    p.titulo as producto_titulo
FROM public.visualizacion_producto v
LEFT JOIN public.producto p ON v.producto_id = p.producto_id
WHERE v.usuario_id = 1
ORDER BY v.fecha_visualizacion DESC;
