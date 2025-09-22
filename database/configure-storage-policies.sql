-- =============================================
-- CONFIGURAR POLÍTICAS DE STORAGE PARA ECOSWAP
-- =============================================

-- Habilitar RLS en el bucket Ecoswap
UPDATE storage.buckets 
SET public = true 
WHERE id = 'Ecoswap';

-- Crear políticas para el bucket Ecoswap

-- Política para permitir lectura pública de imágenes de productos
CREATE POLICY "Imágenes de productos son públicas" ON storage.objects
FOR SELECT USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
);

-- Política para permitir a usuarios autenticados subir imágenes de productos
CREATE POLICY "Usuarios pueden subir imágenes de productos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
    AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios actualizar sus propias imágenes
CREATE POLICY "Usuarios pueden actualizar sus imágenes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
    AND auth.role() = 'authenticated'
);

-- Política para permitir a usuarios eliminar sus propias imágenes
CREATE POLICY "Usuarios pueden eliminar sus imágenes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'productos'
    AND auth.role() = 'authenticated'
);

-- Política para administradores (acceso completo)
-- NOTA: Esta política se actualizará cuando se conecte Auth
CREATE POLICY "Administradores acceso completo a imágenes" ON storage.objects
FOR ALL USING (
    bucket_id = 'Ecoswap' 
    AND auth.role() = 'authenticated'
);

-- Verificar que el bucket existe y está configurado
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- Mostrar políticas creadas
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
AND policyname LIKE '%Ecoswap%' OR policyname LIKE '%productos%';

-- Comentarios para documentación
COMMENT ON POLICY "Imágenes de productos son públicas" ON storage.objects IS 'Permite lectura pública de imágenes en carpeta productos';
COMMENT ON POLICY "Usuarios pueden subir imágenes de productos" ON storage.objects IS 'Permite a usuarios autenticados subir imágenes a carpeta productos';
COMMENT ON POLICY "Usuarios pueden actualizar sus imágenes" ON storage.objects IS 'Permite a usuarios autenticados actualizar imágenes en carpeta productos';
COMMENT ON POLICY "Usuarios pueden eliminar sus imágenes" ON storage.objects IS 'Permite a usuarios autenticados eliminar imágenes en carpeta productos';
COMMENT ON POLICY "Administradores acceso completo a imágenes" ON storage.objects IS 'Permite a administradores acceso completo a imágenes de productos';
