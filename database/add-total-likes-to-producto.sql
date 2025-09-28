-- Script para agregar el campo total_likes a la tabla producto
-- y crear una función para mantenerlo actualizado

-- PASO 1: Agregar el campo total_likes a la tabla producto
ALTER TABLE public.producto 
ADD COLUMN IF NOT EXISTS total_likes INTEGER DEFAULT 0;

-- PASO 2: Crear un comentario para documentar el campo
COMMENT ON COLUMN public.producto.total_likes IS 'Contador de likes/favoritos del producto';

-- PASO 3: Actualizar el contador inicial basado en los favoritos existentes
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
);

-- PASO 4: Crear función para actualizar el contador de likes
CREATE OR REPLACE FUNCTION public.update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es un INSERT (nuevo favorito)
    IF TG_OP = 'INSERT' THEN
        UPDATE public.producto 
        SET total_likes = total_likes + 1 
        WHERE producto_id = NEW.producto_id;
        RETURN NEW;
    END IF;
    
    -- Si es un DELETE (quitar favorito)
    IF TG_OP = 'DELETE' THEN
        UPDATE public.producto 
        SET total_likes = GREATEST(total_likes - 1, 0) 
        WHERE producto_id = OLD.producto_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- PASO 5: Crear trigger para mantener el contador actualizado automáticamente
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;

CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- PASO 6: Verificar que el campo se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producto' 
    AND table_schema = 'public' 
    AND column_name = 'total_likes';

-- PASO 7: Mostrar algunos productos con sus contadores de likes
SELECT 
    producto_id,
    titulo,
    total_likes,
    (SELECT COUNT(*) FROM public.favorito WHERE producto_id = p.producto_id) as likes_reales
FROM public.producto p
ORDER BY total_likes DESC
LIMIT 10;
