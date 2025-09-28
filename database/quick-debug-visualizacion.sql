-- Script rápido para diagnosticar el problema de visualizaciones
-- Ejecutar en orden para identificar dónde está el problema

-- 1. Verificar que la función existe
SELECT 'FUNCIÓN EXISTE:' as status, 
       CASE WHEN COUNT(*) > 0 THEN 'SÍ' ELSE 'NO' END as resultado
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- 2. Verificar que las tablas existen
SELECT 'TABLA visualizacion_producto:' as status,
       CASE WHEN COUNT(*) > 0 THEN 'SÍ' ELSE 'NO' END as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'visualizacion_producto';

SELECT 'TABLA estadistica_producto:' as status,
       CASE WHEN COUNT(*) > 0 THEN 'SÍ' ELSE 'NO' END as resultado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'estadistica_producto';

-- 3. Verificar datos de prueba
SELECT 'USUARIOS DISPONIBLES:' as status, COUNT(*) as cantidad
FROM public.usuario 
WHERE auth_user_id IS NOT NULL;

SELECT 'PRODUCTOS DISPONIBLES:' as status, COUNT(*) as cantidad
FROM public.producto 
WHERE estado_publicacion = 'activo';

-- 4. Verificar visualizaciones existentes
SELECT 'VISUALIZACIONES EXISTENTES:' as status, COUNT(*) as cantidad
FROM public.visualizacion_producto;

-- 5. Verificar estadísticas diarias existentes
SELECT 'ESTADÍSTICAS DIARIAS EXISTENTES:' as status, COUNT(*) as cantidad
FROM public.estadistica_producto;

-- 6. Obtener un usuario y producto para prueba
SELECT 'USUARIO DE PRUEBA:' as tipo, user_id, nombre, apellido, auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

SELECT 'PRODUCTO DE PRUEBA:' as tipo, producto_id, titulo, visualizaciones
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 1;
