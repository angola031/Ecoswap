-- Script para probar la función register_product_view con el esquema real
-- Basado en el esquema proporcionado por el usuario

-- PASO 1: Verificar estructura de la tabla
SELECT '=== ESTRUCTURA DE visualizacion_producto ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: Verificar restricciones
SELECT '=== RESTRICCIONES ===' as info;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'visualizacion_producto'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type;

-- PASO 3: Verificar que la función existe
SELECT '=== FUNCIÓN register_product_view ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- PASO 4: Obtener datos para prueba
SELECT '=== DATOS PARA PRUEBA ===' as info;

-- Usuario de prueba
SELECT 
    'USUARIO DE PRUEBA' as tipo,
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
    'PRODUCTO DE PRUEBA' as tipo,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- PASO 5: Verificar estado inicial
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

-- PASO 6: Prueba de inserción directa
SELECT '=== PRUEBA DE INSERCIÓN DIRECTA ===' as info;

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

-- PASO 7: Prueba de la función
SELECT '=== PRUEBA DE LA FUNCIÓN ===' as info;

SELECT '
Para probar la función register_product_view (cambiar los IDs por valores reales):

-- Probar la función
SELECT register_product_view(1, 1) as resultado;

-- Verificar que se insertó en visualizacion_producto
SELECT * FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

-- Verificar que se incrementó el contador en producto
SELECT producto_id, titulo, visualizaciones 
FROM public.producto 
WHERE producto_id = 1;

-- Verificar estadísticas diarias (si existe la tabla)
SELECT * FROM public.estadistica_producto 
WHERE producto_id = 1 AND fecha = CURRENT_DATE;
' as prueba_funcion;

-- PASO 8: Diagnóstico de problemas
SELECT '=== DIAGNÓSTICO DE PROBLEMAS ===' as info;

SELECT '
PROBLEMAS COMUNES Y SOLUCIONES:

1. FUNCIÓN NO EXISTE:
   - Ejecutar: database/implement-product-views-system.sql

2. RESTRICCIÓN UNIQUE VIOLADA:
   - La tabla tiene restricción UNIQUE(usuario_id, producto_id)
   - Si el usuario ya vio el producto, no se insertará
   - Esto es normal y esperado

3. FOREIGN KEY VIOLADA:
   - Verificar que usuario_id existe en tabla usuario
   - Verificar que producto_id existe en tabla producto

4. API NO LLAMA A LA FUNCIÓN:
   - Revisar logs de la API en DevTools Console
   - Verificar autenticación del usuario
   - Verificar que la API está funcionando

5. USUARIO NO AUTENTICADO:
   - Verificar que hay sesión activa
   - Verificar que el usuario está logueado
' as diagnostico;
