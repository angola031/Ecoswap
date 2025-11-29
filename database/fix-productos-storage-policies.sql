-- =============================================
-- FIX: Políticas de Storage para subida de imágenes de productos
-- =============================================
-- Este script asegura que las imágenes de productos se puedan subir correctamente
-- tanto con Service Role Key como con usuarios autenticados

-- 1. Asegurar que el bucket existe y es público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'Ecoswap';

-- 2. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Usuarios pueden subir imágenes de productos" ON storage.objects;
DROP POLICY IF EXISTS "Imágenes de productos son públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus imágenes" ON storage.objects;
DROP POLICY IF EXISTS "allow auth upload productos" ON storage.objects;
DROP POLICY IF EXISTS "allow auth upload productos organized" ON storage.objects;
DROP POLICY IF EXISTS "public read productos organized" ON storage.objects;
DROP POLICY IF EXISTS "allow auth update productos organized" ON storage.objects;
DROP POLICY IF EXISTS "allow auth delete productos organized" ON storage.objects;

-- 3. Crear política para lectura pública de imágenes de productos
CREATE POLICY "Imágenes de productos son públicas"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
);

-- 4. Crear política para INSERT - permitir a usuarios autenticados Y service_role
-- Esta política permite subir imágenes en la carpeta productos con estructura organizada
CREATE POLICY "Permitir subida de imágenes de productos"
ON storage.objects FOR INSERT
TO authenticated, service_role
WITH CHECK (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
);

-- 5. Crear política para UPDATE - permitir actualizar imágenes
CREATE POLICY "Permitir actualizar imágenes de productos"
ON storage.objects FOR UPDATE
TO authenticated, service_role
USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
)
WITH CHECK (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
);

-- 6. Crear política para DELETE - permitir eliminar imágenes
CREATE POLICY "Permitir eliminar imágenes de productos"
ON storage.objects FOR DELETE
TO authenticated, service_role
USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
);

-- Verificar que el bucket está configurado
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- Verificar políticas creadas
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND (
    policyname LIKE '%productos%' 
    OR policyname LIKE '%Ecoswap%'
)
ORDER BY policyname;

