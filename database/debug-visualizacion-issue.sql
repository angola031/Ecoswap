-- Script para debuggear por qué no se actualiza la tabla visualizacion_producto
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar que la tabla tiene la restricción UNIQUE correcta
SELECT 
    'Verificar restricciones de la tabla' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'visualizacion_producto' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, kcu.column_name;

-- 2. Verificar datos actuales
SELECT 
    'Datos actuales en visualizacion_producto' as info,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos,
    MAX(fecha_visualizacion) as ultima_visualizacion
FROM public.visualizacion_producto;

-- 3. Verificar productos existentes
SELECT 
    'Productos disponibles para probar' as info,
    producto_id,
    titulo,
    estado_publicacion,
    estado_validacion,
    user_id as propietario_id
FROM public.producto 
WHERE estado_publicacion = 'activo' 
    AND estado_validacion = 'approved'
ORDER BY producto_id
LIMIT 10;

-- 4. Verificar usuarios existentes
SELECT 
    'Usuarios disponibles para probar' as info,
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE activo = true
ORDER BY user_id
LIMIT 5;

-- 5. Simular una inserción manual para probar
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES (1, 16, NOW())
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion
RETURNING *;

-- 6. Verificar el resultado
SELECT 
    'Resultado de la inserción' as info,
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    p.titulo as producto_titulo
FROM public.visualizacion_producto v
JOIN public.producto p ON v.producto_id = p.producto_id
WHERE v.usuario_id = 1
ORDER BY v.fecha_visualizacion DESC;
