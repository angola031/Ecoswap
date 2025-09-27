-- =============================================
-- VERIFICACIÓN DE VISTA PRODUCTOS_PUBLICOS
-- =============================================
-- Este script verifica si la vista PRODUCTOS_PUBLICOS tiene todos los campos necesarios

-- 1. Verificar estructura de la vista
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'productos_publicos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si existe el campo usuario_email
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'productos_publicos' 
            AND column_name = 'usuario_email'
            AND table_schema = 'public'
        ) 
        THEN '✅ Campo usuario_email EXISTE' 
        ELSE '❌ Campo usuario_email NO EXISTE' 
    END as estado_usuario_email;

-- 3. Verificar si existe el campo visualizaciones
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'productos_publicos' 
            AND column_name = 'visualizaciones'
            AND table_schema = 'public'
        ) 
        THEN '✅ Campo visualizaciones EXISTE' 
        ELSE '❌ Campo visualizaciones NO EXISTE' 
    END as estado_visualizaciones;

-- 4. Probar la vista con un producto real
SELECT 
    producto_id,
    titulo,
    usuario_nombre,
    usuario_apellido,
    usuario_email,
    visualizaciones
FROM productos_publicos 
LIMIT 3;

-- 5. Verificar conexión entre auth.users y usuario
SELECT 
    u.user_id,
    u.email as usuario_email,
    u.auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN u.auth_user_id IS NOT NULL THEN '✅ Conectado'
        ELSE '❌ No conectado'
    END as estado_conexion
FROM usuario u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'angola03@gmail.com';

