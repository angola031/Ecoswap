-- Script alternativo para políticas RLS más simples
-- Usa la estructura: usuarios/{auth.uid}/foto_perfil.jpg

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Política simple: permitir todo a usuarios autenticados para su carpeta
CREATE POLICY "Authenticated users can manage own files" ON storage.objects
FOR ALL USING (
  bucket_id = 'Ecoswap' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para lectura pública de fotos de perfil
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'Ecoswap' 
  AND name LIKE 'usuarios/%/perfil_%.jpg'
  OR name LIKE 'usuarios/%/perfil_%.png'
);

-- Verificar políticas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';








