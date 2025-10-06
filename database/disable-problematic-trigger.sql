-- DESHABILITAR TRIGGER PROBLEMÁTICO TEMPORALMENTE
-- ⚠️ SOLO PARA PRUEBAS - NO USAR EN PRODUCCIÓN

-- 1. Ver el estado actual de los triggers
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

-- 2. Deshabilitar el trigger handle_new_user si existe en auth.users
-- (Ejecutar solo si el trigger existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'auth' 
        AND c.relname = 'users' 
        AND t.tgfoid = (
            SELECT p.oid 
            FROM pg_proc p 
            JOIN pg_namespace n2 ON p.pronamespace = n2.oid 
            WHERE n2.nspname = 'public' AND p.proname = 'handle_new_user'
        )
    ) THEN
        ALTER TABLE auth.users DISABLE TRIGGER ALL;
        RAISE NOTICE 'Triggers deshabilitados en auth.users';
    ELSE
        RAISE NOTICE 'No se encontró el trigger handle_new_user en auth.users';
    END IF;
END $$;

-- 3. Verificar que se deshabilitaron
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users';

-- 4. Para volver a habilitar después de las pruebas:
-- ALTER TABLE auth.users ENABLE TRIGGER ALL;














