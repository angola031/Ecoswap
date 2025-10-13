-- Políticas para permitir subida de imágenes en el chat
-- Versión 4: Incluye archivos .keep para crear carpetas

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "allow_auth_upload_chat_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_view_chat_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_delete_chat_images" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_upload_chat_images_v2" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_view_chat_images_v2" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_delete_chat_images_v2" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_update_chat_images_v2" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_upload_chat_images_v3" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_view_chat_images_v3" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_delete_chat_images_v3" ON storage.objects;
DROP POLICY IF EXISTS "allow_auth_update_chat_images_v3" ON storage.objects;
DROP POLICY IF EXISTS "debug_allow_all_ecoswap" ON storage.objects;

-- Política para INSERT (subir imágenes y archivos .keep)
-- Estructura: mensajes/chat_{id}/archivo.ext o mensajes/chat_{id}/.keep
DROP POLICY IF EXISTS "allow_auth_upload_chat_images_v4" ON storage.objects;
CREATE POLICY "allow_auth_upload_chat_images_v4"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] ~ '^chat_[0-9]+$'
  AND (name ~ '\.blob$' OR name ~ '\.keep$' OR name ~ '\.(jpg|jpeg|png|gif|webp)$')
);

-- Política para SELECT (ver imágenes del chat y archivos .keep)
DROP POLICY IF EXISTS "allow_auth_view_chat_images_v4" ON storage.objects;
CREATE POLICY "allow_auth_view_chat_images_v4"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] ~ '^chat_[0-9]+$'
  AND (name ~ '\.blob$' OR name ~ '\.keep$' OR name ~ '\.(jpg|jpeg|png|gif|webp)$')
);

-- Política para DELETE (eliminar imágenes del chat y archivos .keep)
DROP POLICY IF EXISTS "allow_auth_delete_chat_images_v4" ON storage.objects;
CREATE POLICY "allow_auth_delete_chat_images_v4"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] ~ '^chat_[0-9]+$'
  AND (name ~ '\.blob$' OR name ~ '\.keep$' OR name ~ '\.(jpg|jpeg|png|gif|webp)$')
);

-- Política para UPDATE (actualizar metadatos)
DROP POLICY IF EXISTS "allow_auth_update_chat_images_v4" ON storage.objects;
CREATE POLICY "allow_auth_update_chat_images_v4"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] ~ '^chat_[0-9]+$'
  AND (name ~ '\.blob$' OR name ~ '\.keep$' OR name ~ '\.(jpg|jpeg|png|gif|webp)$')
)
WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND (storage.foldername(name))[1] = 'mensajes'
  AND (storage.foldername(name))[2] ~ '^chat_[0-9]+$'
  AND (name ~ '\.blob$' OR name ~ '\.keep$' OR name ~ '\.(jpg|jpeg|png|gif|webp)$')
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
