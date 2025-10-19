-- Instalación rápida del sistema de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Agregar campo total_likes si no existe
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
        RAISE NOTICE 'Campo total_likes agregado';
    ELSE
        RAISE NOTICE 'Campo total_likes ya existe';
    END IF;
END $$;

-- 2. Crear función de actualización
CREATE OR REPLACE FUNCTION public.update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.producto 
        SET total_likes = total_likes + 1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.producto_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.producto 
        SET total_likes = GREATEST(total_likes - 1, 0),
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = OLD.producto_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear triggers
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;
CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- 4. Sincronizar contadores existentes
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- 5. Verificar instalación
SELECT 
    'Instalación completada' as status,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes
FROM public.producto;

-- 6. Mostrar productos con likes
SELECT 
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;
