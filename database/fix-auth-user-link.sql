-- Script para vincular usuarios de Supabase Auth con la tabla usuario
-- Ejecutar este script para corregir usuarios que tienen auth_user_id = null

-- 1. Primero, verificar qué usuarios tienen auth_user_id = null
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    es_admin,
    activo,
    auth_user_id
FROM usuario 
WHERE auth_user_id IS NULL;

-- 2. Para vincular manualmente un usuario específico:
-- Reemplaza 'USER_EMAIL' con el email del usuario
-- Reemplaza 'AUTH_USER_ID' con el ID del usuario de Supabase Auth

-- Ejemplo para vincular el usuario c.angola@utp.edu.co:
-- UPDATE usuario 
-- SET auth_user_id = 'AUTH_USER_ID_AQUI'
-- WHERE email = 'c.angola@utp.edu.co';

-- 3. Para obtener el auth_user_id de Supabase Auth:
-- Ve a Supabase Dashboard > Authentication > Users
-- Busca el usuario por email y copia su ID

-- 4. Verificar que la vinculación fue exitosa:
-- SELECT 
--     user_id,
--     nombre,
--     apellido,
--     email,
--     es_admin,
--     activo,
--     auth_user_id
-- FROM usuario 
-- WHERE email = 'c.angola@utp.edu.co';
