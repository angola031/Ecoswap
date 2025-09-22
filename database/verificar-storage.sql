-- =============================================
-- VERIFICAR CONFIGURACIÓN DE STORAGE
-- =============================================

-- 1. Verificar que el bucket Ecoswap existe
SELECT 
    'BUCKET ECOSWAP' as tipo,
    CASE 
        WHEN COUNT(*) > 0 THEN 'OK - Bucket existe'
        ELSE 'ERROR - Bucket no existe'
    END as estado
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 1b. Detalles del bucket Ecoswap
SELECT 
    'DETALLES BUCKET' as tipo,
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 2. Verificar todos los buckets disponibles
SELECT 
    'TODOS LOS BUCKETS' as tipo,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 3. Verificar archivos en el bucket Ecoswap
SELECT 
    'ARCHIVOS EN ECOSWAP' as tipo,
    COUNT(*) as total_archivos,
    COUNT(CASE WHEN name LIKE 'productos/%' THEN 1 END) as archivos_productos
FROM storage.objects 
WHERE bucket_id = 'Ecoswap';

-- 4. Verificar archivos recientes en productos
SELECT 
    'ARCHIVOS RECIENTES' as tipo,
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
AND name LIKE 'productos/%'
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verificar políticas de Storage
SELECT 
    'POLÍTICAS STORAGE' as tipo,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 6. Mostrar instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    '1. Verifica que el bucket Ecoswap existe y es público' as paso1,
    '2. Si no existe, créalo manualmente en Dashboard > Storage' as paso2,
    '3. Si existe pero no es público, márcalo como público' as paso3,
    '4. Verifica que hay archivos en la carpeta productos/' as paso4;
