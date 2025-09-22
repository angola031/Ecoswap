-- =============================================
-- VERIFICAR ESTRUCTURA: productos/user_{user_id}/{id_producto}/
-- =============================================

-- 1. Verificar bucket
SELECT 
    'BUCKET' as tipo,
    id,
    name,
    public
FROM storage.buckets 
WHERE id = 'Ecoswap';

-- 2. Verificar políticas actuales
SELECT 
    'POLÍTICAS ACTUALES' as tipo,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Verificar archivos en nueva estructura
SELECT 
    'ARCHIVOS NUEVA ESTRUCTURA' as tipo,
    COUNT(*) as total,
    COUNT(CASE WHEN name LIKE 'productos/user_%/%' THEN 1 END) as archivos_organizados
FROM storage.objects 
WHERE bucket_id = 'Ecoswap';

-- 4. Mostrar estructura de carpetas por usuario
SELECT 
    'ESTRUCTURA POR USUARIO' as tipo,
    CASE 
        WHEN name LIKE 'productos/user_%/%' THEN 
            SUBSTRING(name FROM 'productos/user_(\d+)/')
        ELSE 'Estructura antigua'
    END as usuario,
    COUNT(*) as archivos
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
GROUP BY 
    CASE 
        WHEN name LIKE 'productos/user_%/%' THEN 
            SUBSTRING(name FROM 'productos/user_(\d+)/')
        ELSE 'Estructura antigua'
    END
ORDER BY usuario;

-- 5. Mostrar estructura de carpetas por producto
SELECT 
    'ESTRUCTURA POR PRODUCTO' as tipo,
    CASE 
        WHEN name LIKE 'productos/user_%/%' THEN 
            SUBSTRING(name FROM 'productos/user_(\d+)/(\d+)/')
        ELSE 'Estructura antigua'
    END as usuario_producto,
    COUNT(*) as archivos
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
GROUP BY 
    CASE 
        WHEN name LIKE 'productos/user_%/%' THEN 
            SUBSTRING(name FROM 'productos/user_(\d+)/(\d+)/')
        ELSE 'Estructura antigua'
    END
ORDER BY usuario_producto;

-- 6. Últimos archivos subidos
SELECT 
    'ÚLTIMOS ARCHIVOS' as tipo,
    name,
    created_at,
    ROUND(size/1024.0, 2) as size_kb
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Ejemplo de estructura esperada
SELECT 
    'ESTRUCTURA ESPERADA' as tipo,
    'productos/user_{user_id}/{id_producto}/producto_{id}_{numero}.ext' as estructura,
    'Ejemplo: productos/user_1/9/9_1.jpg' as ejemplo;
