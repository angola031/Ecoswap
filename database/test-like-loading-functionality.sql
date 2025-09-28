-- Script para probar la funcionalidad de carga de likes
-- Verifica que el sistema detecte correctamente si el usuario ya le dio like

-- PASO 1: Verificar estructura de tablas relacionadas
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLAS ===' as info;

-- Verificar tabla usuario
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public' 
    AND column_name IN ('user_id', 'auth_user_id', 'verificado')
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
    AND column_name IN ('producto_id', 'user_id', 'total_likes')
ORDER BY column_name;

-- PASO 2: Verificar datos de ejemplo
SELECT '=== VERIFICANDO DATOS DE EJEMPLO ===' as info;

-- Mostrar usuarios con sus auth_user_id
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id,
    verificado,
    activo
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 5;

-- Mostrar productos con sus propietarios
SELECT 
    p.producto_id,
    p.titulo,
    p.user_id as propietario_id,
    p.total_likes,
    u.nombre || ' ' || u.apellido as propietario_nombre
FROM public.producto p
JOIN public.usuario u ON p.user_id = u.user_id
WHERE p.estado_publicacion = 'activo'
ORDER BY p.producto_id
LIMIT 5;

-- PASO 3: Verificar favoritos existentes
SELECT '=== VERIFICANDO FAVORITOS EXISTENTES ===' as info;

SELECT 
    f.favorito_id,
    f.usuario_id,
    f.producto_id,
    f.fecha_agregado,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    p.titulo as producto_titulo,
    p.user_id as producto_propietario_id
FROM public.favorito f
JOIN public.usuario u ON f.usuario_id = u.user_id
JOIN public.producto p ON f.producto_id = p.producto_id
ORDER BY f.fecha_agregado DESC
LIMIT 10;

-- PASO 4: Simular consulta de verificación de propietario
SELECT '=== SIMULANDO VERIFICACIÓN DE PROPIETARIO ===' as info;

-- Simular la consulta que hace checkIfUserIsOwner
SELECT 
    'Verificar si usuario es propietario' as prueba,
    u.user_id,
    u.nombre || ' ' || u.apellido as usuario,
    u.auth_user_id,
    p.producto_id,
    p.titulo as producto,
    p.user_id as propietario_id,
    CASE 
        WHEN u.user_id = p.user_id THEN '✅ Es propietario'
        ELSE '❌ No es propietario'
    END as es_propietario
FROM public.usuario u
CROSS JOIN public.producto p
WHERE u.auth_user_id IS NOT NULL
  AND p.estado_publicacion = 'activo'
LIMIT 5;

-- PASO 5: Simular consulta de estado de like
SELECT '=== SIMULANDO CONSULTA DE ESTADO DE LIKE ===' as info;

-- Simular la consulta que hace la API de likes
SELECT 
    'Verificar estado de like' as prueba,
    u.user_id,
    u.nombre || ' ' || u.apellido as usuario,
    p.producto_id,
    p.titulo as producto,
    f.favorito_id,
    CASE 
        WHEN f.favorito_id IS NOT NULL THEN '✅ Ya le dio like'
        ELSE '❌ No le ha dado like'
    END as estado_like
FROM public.usuario u
CROSS JOIN public.producto p
LEFT JOIN public.favorito f ON u.user_id = f.usuario_id AND p.producto_id = f.producto_id
WHERE u.auth_user_id IS NOT NULL
  AND p.estado_publicacion = 'activo'
  AND f.favorito_id IS NOT NULL  -- Solo mostrar casos donde hay like
LIMIT 5;

-- PASO 6: Verificar sincronización de contadores
SELECT '=== VERIFICANDO SINCRONIZACIÓN DE CONTADORES ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.total_likes as likes_en_producto,
    COUNT(f.favorito_id) as likes_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado_sincronizacion
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING COUNT(f.favorito_id) > 0 OR p.total_likes > 0
ORDER BY p.total_likes DESC
LIMIT 10;

-- PASO 7: Instrucciones para prueba manual
SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL ===' as info;

SELECT '
Para probar la funcionalidad de carga de likes:

1. Obtener un auth_user_id de la tabla auth.users:
   SELECT id, email FROM auth.users LIMIT 1;

2. Verificar que existe en la tabla usuario:
   SELECT user_id, nombre, apellido, auth_user_id, verificado 
   FROM public.usuario 
   WHERE auth_user_id = ''[AUTH_USER_ID_AQUI]'';

3. Obtener un producto_id:
   SELECT producto_id, titulo, user_id as propietario_id 
   FROM public.producto 
   WHERE estado_publicacion = ''activo''
   LIMIT 1;

4. Verificar si el usuario ya le dio like:
   SELECT * FROM public.favorito 
   WHERE usuario_id = [USER_ID_AQUI] 
   AND producto_id = [PRODUCTO_ID_AQUI];

5. Si no existe, crear un like para prueba:
   INSERT INTO public.favorito (usuario_id, producto_id) 
   VALUES ([USER_ID_AQUI], [PRODUCTO_ID_AQUI]);

6. Verificar que el contador se actualizó:
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = [PRODUCTO_ID_AQUI];

7. Probar la API manualmente:
   GET /api/products/[PRODUCTO_ID]/like
   Headers: Authorization: Bearer [JWT_TOKEN]

8. Verificar en el frontend:
   - Abrir DevTools Console
   - Navegar al producto
   - Verificar logs de debug
   - Confirmar que el corazón aparece lleno si ya le dio like
' as instrucciones;
