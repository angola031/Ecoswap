-- Políticas para permitir subida de imágenes en el chat
-- Versión 2: Ajustada para la estructura real de carpetas

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "allow_auth_upload_chat_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_view_chat_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_delete_chat_images" ON storage.objects;

-- Política para INSERT (subir imágenes) - Estructura: mensajes/chat_{id}/
DROP POLICY IF EXISTS "allow_auth_upload_chat_images_v2" ON storage.objects;
CREATE POLICY "allow_auth_upload_chat_images_v2"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] LIKE 'chat_%'
);

-- Política para SELECT (ver imágenes del chat) - Estructura: mensajes/chat_{id}/
DROP POLICY IF EXISTS "allow_auth_view_chat_images_v2" ON storage.objects;
CREATE POLICY "allow_auth_view_chat_images_v2"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] LIKE 'chat_%'
);

-- Política para DELETE (eliminar imágenes del chat) - Estructura: mensajes/chat_{id}/
DROP POLICY IF EXISTS "allow_auth_delete_chat_images_v2" ON storage.objects;
CREATE POLICY "allow_auth_delete_chat_images_v2"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] LIKE 'chat_%'
);

-- Política adicional para UPDATE (si se necesita actualizar metadatos)
DROP POLICY IF EXISTS "allow_auth_update_chat_images_v2" ON storage.objects;
CREATE POLICY "allow_auth_update_chat_images_v2"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] LIKE 'chat_%'
)
WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] LIKE 'chat_%'
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

