-- Verificar políticas RLS en todas las tablas relacionadas con usuarios
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
WHERE schemaname = 'public' 
AND (tablename LIKE '%usuario%' OR tablename LIKE '%user%' OR tablename LIKE '%auth%')
ORDER BY tablename, policyname;

-- Verificar si RLS está habilitado en tablas críticas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename LIKE '%usuario%' OR tablename LIKE '%user%')
ORDER BY tablename;

-- Verificar funciones que podrían estar causando problemas
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%user%' 
OR p.proname LIKE '%auth%'
OR p.proname LIKE '%trigger%'
ORDER BY n.nspname, p.proname;
