-- Script para corregir específicamente el producto 18 y instalar el sistema de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: Agregar campo total_likes si no existe
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

-- PASO 2: Crear función de actualización
CREATE OR REPLACE FUNCTION public.update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.producto 
        SET total_likes = total_likes + 1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.producto_id;
        
        RAISE NOTICE 'Like agregado para producto %: nuevo total = %', 
            NEW.producto_id, 
            (SELECT total_likes FROM public.producto WHERE producto_id = NEW.producto_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
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

-- PASO 3: Crear triggers
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;
CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- PASO 4: Sincronizar contadores existentes (incluyendo producto 18)
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- PASO 5: Verificar específicamente el producto 18
SELECT 
    'Producto 18 - Estado después de sincronización' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE producto_id = 18;

-- PASO 6: Mostrar favoritos del producto 18
SELECT 
    'Favoritos del producto 18' as info,
    f.favorito_id,
    f.usuario_id,
    f.fecha_agregado,
    u.nombre,
    u.apellido
FROM public.favorito f
JOIN public.usuario u ON f.usuario_id = u.user_id
WHERE f.producto_id = 18;

-- PASO 7: Crear un favorito de prueba para el producto 18 (si no existe ninguno)
-- DESCOMENTA las siguientes líneas si quieres crear un favorito de prueba:

/*
-- Crear un favorito de prueba para el producto 18
INSERT INTO public.favorito (usuario_id, producto_id, fecha_agregado)
VALUES (1, 18, NOW())
ON CONFLICT (usuario_id, producto_id) DO NOTHING;

-- Verificar que el trigger funcionó
SELECT 
    'Producto 18 - Después de agregar favorito de prueba' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE producto_id = 18;
*/

-- PASO 8: Verificar estado final
SELECT 
    'Estado final del sistema' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    (SELECT COUNT(*) FROM public.favorito) as total_favoritos_reales
FROM public.producto;
