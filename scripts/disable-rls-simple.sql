-- Script simple para deshabilitar RLS en las tablas necesarias
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Deshabilitar RLS en tabla favorito
ALTER TABLE public.favorito DISABLE ROW LEVEL SECURITY;

-- 2. Deshabilitar RLS en tabla usuario (para que la API pueda buscar usuarios)
ALTER TABLE public.usuario DISABLE ROW LEVEL SECURITY;

-- 3. Verificar estado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('favorito', 'usuario') 
  AND schemaname = 'public';
