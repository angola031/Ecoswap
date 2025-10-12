-- Deshabilitar RLS en la tabla favorito
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Deshabilitar Row Level Security en la tabla favorito
ALTER TABLE public.favorito DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas existentes (si las hay)
DROP POLICY IF EXISTS "favorito_select_own" ON public.favorito;
DROP POLICY IF EXISTS "favorito_insert_own" ON public.favorito;
DROP POLICY IF EXISTS "favorito_delete_own" ON public.favorito;

-- 3. Verificar que RLS está deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'favorito' AND schemaname = 'public';

-- 4. Verificar que no hay políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'favorito';
