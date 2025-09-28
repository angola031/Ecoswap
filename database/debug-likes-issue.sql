-- Script para diagnosticar problemas con el sistema de likes
-- Ejecutar para verificar que todo esté funcionando correctamente

-- PASO 1: Verificar estructura de tablas
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLAS ===' as info;

-- Verificar tabla usuario
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public' 
    AND column_name IN ('user_id', 'auth_user_id', 'email')
ORDER BY column_name;

-- Verificar tabla favorito
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'favorito' 
    AND table_schema = 'public'
ORDER BY column_name;

-- Verificar tabla producto
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producto' 
    AND table_schema = 'public' 
    AND column_name IN ('producto_id', 'total_likes')
ORDER BY column_name;

-- PASO 2: Verificar datos de ejemplo
SELECT '=== VERIFICANDO DATOS DE EJEMPLO ===' as info;

-- Mostrar algunos usuarios con sus auth_user_id
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    auth_user_id,
    verificado
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 5;

-- Mostrar algunos productos
SELECT 
    producto_id,
    titulo,
    total_likes,
    user_id as propietario_id
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 5;

-- Mostrar algunos favoritos existentes
SELECT 
    f.favorito_id,
    f.usuario_id,
    f.producto_id,
    f.fecha_agregado,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    p.titulo as producto_titulo
FROM public.favorito f
JOIN public.usuario u ON f.usuario_id = u.user_id
JOIN public.producto p ON f.producto_id = p.producto_id
ORDER BY f.fecha_agregado DESC
LIMIT 10;

-- PASO 3: Verificar sincronización de contadores
SELECT '=== VERIFICANDO SINCRONIZACIÓN DE CONTADORES ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.total_likes as likes_en_producto,
    COUNT(f.favorito_id) as likes_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING COUNT(f.favorito_id) > 0 OR p.total_likes > 0
ORDER BY p.total_likes DESC
LIMIT 10;

-- PASO 4: Prueba de consulta específica (simular lo que hace la API)
SELECT '=== PRUEBA DE CONSULTA API ===' as info;

-- Simular búsqueda de usuario por auth_user_id
SELECT 
    'Buscar usuario por auth_user_id' as prueba,
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

-- Simular búsqueda de favorito
SELECT 
    'Buscar favorito específico' as prueba,
    f.favorito_id,
    f.usuario_id,
    f.producto_id,
    u.nombre || ' ' || u.apellido as usuario,
    p.titulo as producto
FROM public.favorito f
JOIN public.usuario u ON f.usuario_id = u.user_id
JOIN public.producto p ON f.producto_id = p.producto_id
LIMIT 1;

-- PASO 5: Instrucciones para prueba manual
SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL ===' as info;

SELECT '
Para probar manualmente:

1. Obtener un auth_user_id de la tabla auth.users:
   SELECT id, email FROM auth.users LIMIT 1;

2. Buscar el user_id correspondiente:
   SELECT user_id, nombre, apellido, auth_user_id 
   FROM public.usuario 
   WHERE auth_user_id = ''[AUTH_USER_ID_AQUI]'';

3. Obtener un producto_id:
   SELECT producto_id, titulo FROM public.producto LIMIT 1;

4. Verificar si existe favorito:
   SELECT * FROM public.favorito 
   WHERE usuario_id = [USER_ID_AQUI] 
   AND producto_id = [PRODUCTO_ID_AQUI];

5. Si no existe, crear uno para prueba:
   INSERT INTO public.favorito (usuario_id, producto_id) 
   VALUES ([USER_ID_AQUI], [PRODUCTO_ID_AQUI]);

6. Verificar que el contador se actualizó:
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = [PRODUCTO_ID_AQUI];
' as instrucciones;
