-- Políticas para permitir subida de imágenes en el chat
-- Estas políticas permiten a usuarios autenticados subir imágenes a sus carpetas personales

-- Política para INSERT (subir imágenes)
DROP POLICY IF EXISTS "allow_auth_upload_chat_images" ON storage.objects;
CREATE POLICY "allow_auth_upload_chat_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'usuarios'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'chat'
);

-- Política para SELECT (ver imágenes del chat)
DROP POLICY IF EXISTS "allow_auth_view_chat_images" ON storage.objects;
CREATE POLICY "allow_auth_view_chat_images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'usuarios'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'chat'
);

-- Política para DELETE (eliminar imágenes del chat)
DROP POLICY IF EXISTS "allow_auth_delete_chat_images" ON storage.objects;
CREATE POLICY "allow_auth_delete_chat_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'usuarios'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND (storage.foldername(name))[3] = 'chat'
);

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%chat%';
