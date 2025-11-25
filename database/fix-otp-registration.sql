-- SOLUCIÓN PARA EL ERROR "Database error saving new user"
-- El trigger on_auth_user_created está causando el problema

-- 1. Deshabilitar el trigger problemático temporalmente
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 2. Verificar que se deshabilitó
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

-- 3. Ahora el registro con OTP debería funcionar
-- Prueba registrar un usuario en tu aplicación

-- 4. Para volver a habilitar el trigger después (cuando lo arregles):
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;























































