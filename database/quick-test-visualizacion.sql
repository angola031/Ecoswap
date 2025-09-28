-- Script de prueba rápida para visualizaciones
-- Ejecutar paso a paso

-- 1. Verificar que la función existe
SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'FUNCIÓN EXISTE' ELSE 'FUNCIÓN NO EXISTE' END as estado_funcion
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'register_product_view';

-- 2. Obtener un usuario y producto para prueba
SELECT 
    'USUARIO:' as tipo, user_id, nombre, apellido
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

SELECT 
    'PRODUCTO:' as tipo, producto_id, titulo, visualizaciones
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 1;

-- 3. Verificar visualizaciones existentes
SELECT 
    'VISUALIZACIONES EXISTENTES:' as tipo, COUNT(*) as cantidad
FROM public.visualizacion_producto;

-- 4. Prueba manual (descomentar y cambiar IDs)
/*
-- Ejemplo con IDs 1 y 1 (cambiar por los obtenidos arriba)
SELECT register_product_view(1, 1) as resultado;

-- Verificar que se insertó
SELECT * FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

-- Verificar contador
SELECT producto_id, titulo, visualizaciones 
FROM public.producto 
WHERE producto_id = 1;
*/
