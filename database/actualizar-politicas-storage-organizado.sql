-- =============================================
-- ACTUALIZAR POLÍTICAS DE STORAGE PARA ESTRUCTURA ORGANIZADA
-- =============================================

-- Eliminar políticas existentes que puedan conflictuar
DROP POLICY IF EXISTS "politicas user subir foto 1uyeiro_0" ON storage.objects;
DROP POLICY IF EXISTS "politicas user subir foto 1uyeiro_1" ON storage.objects;
DROP POLICY IF EXISTS "politicas user subir foto 1uyeiro_2" ON storage.objects;
DROP POLICY IF EXISTS "allow auth upload productos" ON storage.objects;
DROP POLICY IF EXISTS "public read productos" ON storage.objects;

-- 1. Política para INSERT (subir archivos) - usuarios autenticados
CREATE POLICY "allow auth upload productos organized"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Ecoswap'
  AND name LIKE 'productos/user_%/%'
);

-- 2. Política para SELECT (leer archivos) - público
CREATE POLICY "public read productos organized"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Ecoswap'
  AND name LIKE 'productos/user_%/%'
);

-- 3. Política para UPDATE (actualizar archivos) - usuarios autenticados
CREATE POLICY "allow auth update productos organized"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Ecoswap'
  AND name LIKE 'productos/user_%/%'
)
WITH CHECK (
  bucket_id = 'Ecoswap'
  AND name LIKE 'productos/user_%/%'
);

-- 4. Política para DELETE (eliminar archivos) - usuarios autenticados
CREATE POLICY "allow auth delete productos organized"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Ecoswap'
  AND name LIKE 'productos/user_%/%'
);

-- Verificar políticas creadas
SELECT 
    'POLÍTICAS CREADAS' as tipo,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%productos organized%'
ORDER BY policyname;

-- Mostrar estructura esperada
SELECT 
    'ESTRUCTURA ESPERADA' as tipo,
    'Ecoswap/productos/user_{user_id}/{mes}/producto_{id}_{numero}.ext' as ejemplo,
    'Ejemplo: Ecoswap/productos/user_1/09/9_1.jpg' as ejemplo_completo;
