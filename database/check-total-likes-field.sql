-- Verificar que el campo total_likes existe y tiene datos
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar que el campo total_likes existe
SELECT 
    'Verificación del campo total_likes' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'producto' 
            AND column_name = 'total_likes' 
            AND table_schema = 'public'
        ) THEN '✅ Campo total_likes existe'
        ELSE '❌ Campo total_likes NO existe'
    END as status;

-- 2. Verificar el producto 18 específicamente
SELECT 
    'Producto 18 - Campo total_likes' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE producto_id = 18;

-- 3. Mostrar algunos productos con sus likes
SELECT 
    'Productos con likes' as muestra,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes IS NOT NULL AND total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;

-- 4. Estadísticas generales
SELECT 
    'Estadísticas del campo total_likes' as reporte,
    COUNT(*) as total_productos,
    COUNT(*) FILTER (WHERE total_likes IS NOT NULL) as productos_con_campo,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    SUM(total_likes) as total_likes_sistema,
    AVG(total_likes::DECIMAL) as promedio_likes,
    MAX(total_likes) as max_likes
FROM public.producto;

-- 5. Si el campo no existe, crearlo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' 
        AND column_name = 'total_likes' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.producto ADD COLUMN total_likes INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.producto.total_likes IS 'Contador de likes/favoritos del producto';
        RAISE NOTICE 'Campo total_likes agregado a la tabla producto';
    ELSE
        RAISE NOTICE 'Campo total_likes ya existe en la tabla producto';
    END IF;
END $$;

-- 6. Actualizar contadores basándose en favoritos reales
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
)
WHERE EXISTS (
    SELECT 1 FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
);

-- 7. Verificar estado final del producto 18
SELECT 
    'Producto 18 - Estado final' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE producto_id = 18;
