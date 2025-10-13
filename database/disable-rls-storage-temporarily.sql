-- Deshabilitar RLS temporalmente en storage.objects para diagnóstico
-- ⚠️ SOLO PARA DEBUG - NO USAR EN PRODUCCIÓN

-- Verificar estado actual de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Deshabilitar RLS temporalmente
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS esté deshabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ⚠️ IMPORTANTE: Después del test, volver a habilitar RLS:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
