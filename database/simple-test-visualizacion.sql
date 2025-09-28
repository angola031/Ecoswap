-- Script simple para probar la función register_product_view
-- Ejecutar paso a paso

-- 1. Obtener un usuario y producto para la prueba
SELECT 
    user_id as usuario_id,
    nombre,
    apellido
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

SELECT 
    producto_id,
    titulo,
    visualizaciones
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 1;

-- 2. Probar la función (cambiar los IDs por los obtenidos arriba)
-- IMPORTANTE: Descomentar y cambiar los IDs por valores reales

/*
-- Ejemplo: si el usuario_id es 1 y producto_id es 1
SELECT register_product_view(1, 1) as resultado;

-- Verificar que se insertó
SELECT * FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

-- Verificar que se incrementó el contador
SELECT producto_id, titulo, visualizaciones 
FROM public.producto 
WHERE producto_id = 1;

-- Verificar estadísticas diarias
SELECT * FROM public.estadistica_producto 
WHERE producto_id = 1 AND fecha = CURRENT_DATE;
*/
