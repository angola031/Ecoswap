-- Verificar triggers en la tabla auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Verificar si hay funciones que se ejecutan en triggers
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE t.tgname LIKE '%user%' OR p.proname LIKE '%user%';

-- Verificar políticas RLS en auth.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Verificar si hay restricciones problemáticas
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'auth.users'::regclass;
