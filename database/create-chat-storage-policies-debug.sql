-- Políticas de DEBUG para diagnosticar el problema de storage
-- Estas políticas son más permisivas para identificar el problema

-- Eliminar TODAS las políticas existentes de chat
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

-- Política MUY permisiva para DEBUG - permite todo en el bucket Ecoswap
DROP POLICY IF EXISTS "debug_allow_all_ecoswap" ON storage.objects;
CREATE POLICY "debug_allow_all_ecoswap"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'Ecoswap')
WITH CHECK (bucket_id = 'Ecoswap');

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
  AND policyname LIKE '%debug%';

-- También verificar el estado de RLS en la tabla storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';
