-- Script completo para actualizar el sistema de likes de productos
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: Verificar que el campo total_likes existe en la tabla producto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' 
        AND column_name = 'total_likes' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar el campo si no existe
        ALTER TABLE public.producto 
        ADD COLUMN total_likes INTEGER DEFAULT 0;
        
        -- Agregar comentario
        COMMENT ON COLUMN public.producto.total_likes IS 'Contador de likes/favoritos del producto';
        
        RAISE NOTICE 'Campo total_likes agregado a la tabla producto';
    ELSE
        RAISE NOTICE 'Campo total_likes ya existe en la tabla producto';
    END IF;
END $$;

-- PASO 2: Crear o reemplazar la función para actualizar likes
CREATE OR REPLACE FUNCTION public.update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es un INSERT (nuevo favorito)
    IF TG_OP = 'INSERT' THEN
        UPDATE public.producto 
        SET total_likes = total_likes + 1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.producto_id;
        
        RAISE NOTICE 'Like agregado para producto %: nuevo total = %', 
            NEW.producto_id, 
            (SELECT total_likes FROM public.producto WHERE producto_id = NEW.producto_id);
        RETURN NEW;
    END IF;
    
    -- Si es un DELETE (quitar favorito)
    IF TG_OP = 'DELETE' THEN
        UPDATE public.producto 
        SET total_likes = GREATEST(total_likes - 1, 0),
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = OLD.producto_id;
        
        RAISE NOTICE 'Like eliminado para producto %: nuevo total = %', 
            OLD.producto_id, 
            (SELECT total_likes FROM public.producto WHERE producto_id = OLD.producto_id);
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Crear triggers para mantener el contador actualizado automáticamente
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;

CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- PASO 4: Función para sincronizar todos los contadores manualmente
CREATE OR REPLACE FUNCTION public.sync_all_product_likes()
RETURNS TABLE (
    producto_id INTEGER,
    titulo TEXT,
    likes_antes INTEGER,
    likes_despues INTEGER,
    diferencia INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.producto 
    SET total_likes = (
        SELECT COUNT(*) 
        FROM public.favorito 
        WHERE favorito.producto_id = producto.producto_id
    ),
    fecha_actualizacion = CURRENT_TIMESTAMP
    FROM (
        SELECT p.producto_id, p.titulo, p.total_likes as old_likes
        FROM public.producto p
    ) AS old_data
    WHERE producto.producto_id = old_data.producto_id
    RETURNING 
        producto.producto_id,
        producto.titulo,
        old_data.old_likes,
        producto.total_likes,
        (producto.total_likes - old_data.old_likes);
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Sincronizar todos los contadores existentes
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- PASO 6: Verificar la instalación
SELECT 
    'Sistema de likes instalado correctamente' as status,
    COUNT(*) as productos_actualizados
FROM public.producto 
WHERE total_likes IS NOT NULL;

-- PASO 7: Mostrar estadísticas de likes
SELECT 
    'Estadísticas de likes' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    AVG(total_likes::DECIMAL) as promedio_likes,
    MAX(total_likes) as max_likes,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes
FROM public.producto;

-- PASO 8: Mostrar top 10 productos con más likes
SELECT 
    'Top productos con más likes' as ranking,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;

-- PASO 9: Verificar sincronización (comparar contadores con favoritos reales)
SELECT 
    'Verificación de sincronización' as verificacion,
    p.producto_id,
    p.titulo,
    p.total_likes as contador_sistema,
    COUNT(f.favorito_id) as favoritos_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING p.total_likes != COUNT(f.favorito_id) OR (p.total_likes > 0 OR COUNT(f.favorito_id) > 0)
ORDER BY p.total_likes DESC;
