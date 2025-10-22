-- Script para configurar políticas RLS para Storage de Supabase
-- Este script permite a los usuarios subir sus propias fotos de perfil

-- 1. Habilitar RLS en el bucket de storage
-- (Esto se hace desde el dashboard de Supabase Storage)

-- 2. Crear política para permitir a usuarios leer sus propias fotos
CREATE POLICY "Users can view own profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'Ecoswap' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Crear política para permitir a usuarios subir sus propias fotos
CREATE POLICY "Users can upload own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'Ecoswap' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND name LIKE 'usuarios/%'
);

-- 4. Crear política para permitir a usuarios actualizar sus propias fotos
CREATE POLICY "Users can update own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'Ecoswap' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Crear política para permitir a usuarios eliminar sus propias fotos
CREATE POLICY "Users can delete own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'Ecoswap' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Política adicional para permitir lectura pública de fotos de perfil
CREATE POLICY "Public can view profile images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'Ecoswap' 
  AND name LIKE 'usuarios/%/perfil_%'
);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';












