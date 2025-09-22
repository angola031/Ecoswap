-- =============================================
-- VERIFICAR STORAGE - VERSIÓN SIMPLE
-- =============================================

-- 1. ¿Existe el bucket Ecoswap?
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK - Bucket Ecoswap existe'
        ELSE '❌ ERROR - Bucket Ecoswap NO existe'
    END as estado_bucket
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 2. Detalles del bucket Ecoswap
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 3. Todos los buckets disponibles
SELECT 
    id,
    name,
    public
FROM storage.buckets 
ORDER BY created_at DESC;

-- 4. ¿Hay archivos en el bucket Ecoswap?
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK - Hay ' || COUNT(*) || ' archivos en Ecoswap'
        ELSE '⚠️ ADVERTENCIA - No hay archivos en Ecoswap'
    END as estado_archivos
FROM storage.objects 
WHERE bucket_id = 'Ecoswap';

-- 5. Archivos en la carpeta productos
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK - Hay ' || COUNT(*) || ' archivos en productos/'
        ELSE '⚠️ ADVERTENCIA - No hay archivos en productos/'
    END as estado_productos
FROM storage.objects 
WHERE bucket_id = 'Ecoswap' 
AND name LIKE 'productos/%';

-- 6. Últimos archivos subidos
SELECT 
    name,
    created_at,
    ROUND(size/1024.0, 2) as size_kb
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Verificar políticas de Storage
SELECT 
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 8. Instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    'Si el bucket no existe: Dashboard > Storage > New bucket > Nombre: Ecoswap > Public' as paso1,
    'Si no es público: Dashboard > Storage > Ecoswap > Settings > Public bucket' as paso2,
    'Si no hay archivos: Probar subir una imagen desde el formulario' as paso3;
