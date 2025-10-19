-- Crear datos de prueba para visualizaciones sin duplicados
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Limpiar datos existentes del usuario 1 (opcional)
DELETE FROM public.visualizacion_producto WHERE usuario_id = 1;

-- 2. Insertar datos de prueba uno por uno para evitar conflictos
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES (1, 16, NOW() - INTERVAL '2 days');

INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES (1, 18, NOW() - INTERVAL '1 day');

-- 3. Verificar que se crearon correctamente
SELECT 
    'Datos creados para usuario 1' as info,
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

-- 4. Estadísticas generales
SELECT 
    'Estadísticas de visualizaciones' as reporte,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos
FROM public.visualizacion_producto;
