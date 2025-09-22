-- =============================================
-- VERIFICAR ADMIN CON AUTH_USER_ID
-- =============================================

-- 1. Verificar usuarios admin
SELECT 
    'USUARIOS ADMIN' as tipo,
    user_id,
    email,
    es_admin,
    auth_user_id IS NOT NULL as tiene_auth_id,
    auth_user_id
FROM USUARIO 
WHERE es_admin = true
ORDER BY user_id;

-- 2. Verificar usuarios con auth_user_id
SELECT 
    'USUARIOS CON AUTH_ID' as tipo,
    user_id,
    email,
    es_admin,
    auth_user_id
FROM USUARIO 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id;

-- 3. Verificar si hay usuarios sin auth_user_id
SELECT 
    'USUARIOS SIN AUTH_ID' as tipo,
    user_id,
    email,
    es_admin
FROM USUARIO 
WHERE auth_user_id IS NULL
ORDER BY user_id;

-- 4. Si hay admin sin auth_user_id, actualizarlo manualmente
-- NOTA: Necesitarás el UUID del usuario de Supabase Auth
-- UPDATE USUARIO 
-- SET auth_user_id = 'UUID_DEL_USUARIO_AUTH'
-- WHERE email = 'tu_email@ejemplo.com' AND es_admin = true;

-- 5. Mostrar instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    'Si el admin no tiene auth_user_id, necesita configurarlo' as paso1,
    'Ve a Supabase Dashboard > Authentication > Users' as paso2,
    'Copia el UUID del usuario y actualízalo en la BD' as paso3;
