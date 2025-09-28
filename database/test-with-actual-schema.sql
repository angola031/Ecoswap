-- Script de prueba específico para el esquema de visualizacion_producto
-- Basado en el esquema real proporcionado

-- PASO 1: Verificar que todo está en orden
SELECT '=== VERIFICACIÓN INICIAL ===' as info;

-- Verificar tabla
SELECT 
    'TABLA visualizacion_producto' as elemento,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'visualizacion_producto';

-- Verificar función
SELECT 
    'FUNCIÓN register_product_view' as elemento,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'register_product_view';

-- PASO 2: Obtener datos para prueba
SELECT '=== OBTENIENDO DATOS PARA PRUEBA ===' as info;

-- Usuario de prueba
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 1;

-- Producto de prueba
SELECT 
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- PASO 3: Verificar estado inicial
SELECT '=== ESTADO INICIAL ===' as info;

-- Contar visualizaciones existentes
SELECT 
    'VISUALIZACIONES EXISTENTES' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto;

-- Contar visualizaciones de hoy
SELECT 
    'VISUALIZACIONES DE HOY' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto
WHERE DATE(fecha_visualizacion) = CURRENT_DATE;

-- PASO 4: Prueba directa de inserción (sin función)
SELECT '=== PRUEBA DIRECTA DE INSERCIÓN ===' as info;

SELECT '
Para probar la inserción directa (cambiar los IDs por valores reales):

-- Insertar visualización directamente
INSERT INTO public.visualizacion_producto (usuario_id, producto_id)
VALUES (1, 1)
ON CONFLICT (usuario_id, producto_id) DO NOTHING;

-- Verificar que se insertó
SELECT * FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

-- Incrementar contador en producto
UPDATE public.producto 
SET visualizaciones = visualizaciones + 1 
WHERE producto_id = 1;

-- Verificar contador
SELECT producto_id, titulo, visualizaciones 
FROM public.producto 
WHERE producto_id = 1;
' as prueba_directa;

-- PASO 5: Verificar si la función está funcionando
SELECT '=== PRUEBA DE LA FUNCIÓN ===' as info;

SELECT '
Para probar la función register_product_view (cambiar los IDs por valores reales):

-- Probar la función
SELECT register_product_view(1, 1) as resultado;

-- Verificar resultados
SELECT * FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

SELECT producto_id, titulo, visualizaciones 
FROM public.producto 
WHERE producto_id = 1;
' as prueba_funcion;

-- PASO 6: Diagnóstico de problemas comunes
SELECT '=== DIAGNÓSTICO DE PROBLEMAS ===' as info;

SELECT '
PROBLEMAS COMUNES Y SOLUCIONES:

1. FUNCIÓN NO EXISTE:
   - Ejecutar: database/implement-product-views-system.sql

2. PERMISOS INCORRECTOS:
   - Verificar que la función tiene SECURITY DEFINER
   - Verificar permisos en las tablas

3. RESTRICCIÓN UNIQUE VIOLADA:
   - La tabla tiene restricción UNIQUE(usuario_id, producto_id)
   - Si el usuario ya vio el producto, no se insertará

4. FOREIGN KEY VIOLADA:
   - Verificar que usuario_id existe en tabla usuario
   - Verificar que producto_id existe en tabla producto

5. API NO LLAMA A LA FUNCIÓN:
   - Revisar logs de la API en DevTools Console
   - Verificar autenticación del usuario
   - Verificar que la API está funcionando
' as diagnostico;
