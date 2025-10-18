-- SOLUCIÓN TEMPORAL: Deshabilitar RLS en tabla usuario para probar
-- ⚠️ SOLO PARA PRUEBAS - NO USAR EN PRODUCCIÓN

-- 1. Verificar estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'usuario';

-- 2. Deshabilitar RLS temporalmente (SOLO PARA PRUEBAS)
ALTER TABLE public.usuario DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que se deshabilitó
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'usuario';

-- 4. Para volver a habilitar RLS después de las pruebas:
-- ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

























