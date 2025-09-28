-- Script para probar la función isUserVerified
-- Verifica que la relación entre auth.users y usuario funcione correctamente

-- PASO 1: Verificar estructura de las tablas
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLAS ===' as info;

-- Verificar tabla auth.users (solo estructura, no datos)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'auth'
ORDER BY column_name;

-- Verificar tabla usuario
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuario' 
    AND table_schema = 'public'
    AND column_name IN ('user_id', 'auth_user_id', 'verificado', 'email')
ORDER BY column_name;

-- PASO 2: Verificar datos de ejemplo (sin mostrar emails sensibles)
SELECT '=== VERIFICANDO DATOS DE EJEMPLO ===' as info;

-- Mostrar usuarios con sus auth_user_id
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id,
    verificado,
    activo,
    CASE 
        WHEN auth_user_id IS NULL THEN '❌ Sin auth_user_id'
        ELSE '✅ Con auth_user_id'
    END as estado_auth
FROM public.usuario 
ORDER BY user_id
LIMIT 10;

-- PASO 3: Verificar relación entre tablas
SELECT '=== VERIFICANDO RELACIÓN ENTRE TABLAS ===' as info;

-- Contar usuarios con y sin auth_user_id
SELECT 
    'Usuarios con auth_user_id' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE auth_user_id IS NOT NULL

UNION ALL

SELECT 
    'Usuarios sin auth_user_id' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE auth_user_id IS NULL

UNION ALL

SELECT 
    'Usuarios verificados' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE verificado = true

UNION ALL

SELECT 
    'Usuarios no verificados' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE verificado = false;

-- PASO 4: Simular consulta de isUserVerified
SELECT '=== SIMULANDO CONSULTA isUserVerified ===' as info;

-- Simular la consulta que hace isUserVerified
SELECT 
    u.user_id,
    u.nombre,
    u.apellido,
    u.auth_user_id,
    u.verificado,
    CASE 
        WHEN u.verificado = true THEN '✅ Verificado'
        ELSE '❌ No verificado'
    END as estado_verificacion
FROM public.usuario u
WHERE u.auth_user_id IS NOT NULL
ORDER BY u.verificado DESC, u.user_id
LIMIT 5;

-- PASO 5: Verificar usuarios problemáticos
SELECT '=== VERIFICANDO USUARIOS PROBLEMÁTICOS ===' as info;

-- Usuarios que podrían causar problemas
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id,
    verificado,
    activo,
    CASE 
        WHEN auth_user_id IS NULL THEN '❌ Sin auth_user_id'
        WHEN verificado IS NULL THEN '❌ verificado es NULL'
        WHEN activo = false THEN '❌ Usuario inactivo'
        ELSE '✅ OK'
    END as problema
FROM public.usuario 
WHERE auth_user_id IS NULL 
   OR verificado IS NULL 
   OR activo = false
ORDER BY user_id;

-- PASO 6: Instrucciones para prueba manual
SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL ===' as info;

SELECT '
Para probar isUserVerified manualmente:

1. Obtener un auth_user_id de la tabla auth.users:
   SELECT id, email FROM auth.users LIMIT 1;

2. Verificar que existe en la tabla usuario:
   SELECT user_id, nombre, apellido, auth_user_id, verificado 
   FROM public.usuario 
   WHERE auth_user_id = ''[AUTH_USER_ID_AQUI]'';

3. Si no existe, crear el usuario:
   INSERT INTO public.usuario (
       nombre, apellido, email, password_hash, 
       auth_user_id, verificado, activo
   ) VALUES (
       ''Usuario'', ''Prueba'', ''test@example.com'', ''supabase_auth'',
       ''[AUTH_USER_ID_AQUI]'', false, true
   );

4. Probar la consulta:
   SELECT verificado FROM public.usuario 
   WHERE auth_user_id = ''[AUTH_USER_ID_AQUI]'';

5. Actualizar estado de verificación:
   UPDATE public.usuario 
   SET verificado = true 
   WHERE auth_user_id = ''[AUTH_USER_ID_AQUI]'';
' as instrucciones;
