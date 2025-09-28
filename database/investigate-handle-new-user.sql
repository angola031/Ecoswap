-- Investigar la función handle_new_user y sus triggers
-- Esta función probablemente está causando el error "Database error saving new user"

-- 1. Ver el contenido de la función handle_new_user
SELECT 
    p.proname as function_name,
    p.prosrc as function_body,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 2. Ver todos los triggers que usan esta función
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name,
    t.tgtype as trigger_type,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgfoid = (
    SELECT p.oid 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
);

-- 3. Ver triggers en auth.users específicamente
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 4. Ver si hay otros triggers relacionados con usuarios
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE '%user%' OR t.tgname LIKE '%auth%'
ORDER BY n.nspname, c.relname, t.tgname;
