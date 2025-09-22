-- =============================================
-- CONFIGURAR STORAGE SIMPLE - SIN POLÍTICAS RLS
-- =============================================

-- Habilitar bucket Ecoswap como público
UPDATE storage.buckets 
SET public = true 
WHERE id = 'Ecoswap';

-- Verificar que el bucket existe y está configurado
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- Mostrar todos los buckets disponibles
SELECT 
    id as bucket_id,
    name as bucket_name,
    public,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- Comentarios para documentación
COMMENT ON TABLE storage.buckets IS 'Tabla de buckets de Storage - configurado para Ecoswap';
