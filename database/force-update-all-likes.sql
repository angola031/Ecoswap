-- Script para forzar la actualización de todos los likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: Asegurar que el campo total_likes existe
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

-- PASO 2: Asegurar que el campo fecha_actualizacion existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' 
        AND column_name = 'fecha_actualizacion' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.producto ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        COMMENT ON COLUMN public.producto.fecha_actualizacion IS 'Fecha de última actualización del producto';
        RAISE NOTICE 'Campo fecha_actualizacion agregado';
    ELSE
        RAISE NOTICE 'Campo fecha_actualizacion ya existe';
    END IF;
END $$;

-- PASO 3: Crear función de actualización
CREATE OR REPLACE FUNCTION public.update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.producto 
        SET total_likes = COALESCE(total_likes, 0) + 1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = NEW.producto_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.producto 
        SET total_likes = GREATEST(COALESCE(total_likes, 0) - 1, 0),
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE producto_id = OLD.producto_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Eliminar triggers existentes y crear nuevos
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON public.favorito;
DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON public.favorito;

CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- PASO 5: FORZAR actualización de TODOS los contadores
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- PASO 6: Verificar el producto 18 específicamente
SELECT 
    'Producto 18 - Después de actualización forzada' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE producto_id = 18;

-- PASO 7: Mostrar favoritos del producto 18
SELECT 
    'Favoritos del producto 18' as info,
    f.favorito_id,
    f.usuario_id,
    f.fecha_agregado,
    u.nombre,
    u.apellido
FROM public.favorito f
LEFT JOIN public.usuario u ON f.usuario_id = u.user_id
WHERE f.producto_id = 18;

-- PASO 8: Crear un favorito de prueba para el producto 18 si no tiene ninguno
DO $$
DECLARE
    favoritos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO favoritos_count 
    FROM public.favorito 
    WHERE producto_id = 18;
    
    IF favoritos_count = 0 THEN
        -- Crear un favorito de prueba
        INSERT INTO public.favorito (usuario_id, producto_id, fecha_agregado)
        VALUES (1, 18, NOW())
        ON CONFLICT (usuario_id, producto_id) DO NOTHING;
        
        RAISE NOTICE 'Favorito de prueba creado para el producto 18';
    ELSE
        RAISE NOTICE 'El producto 18 ya tiene % favoritos', favoritos_count;
    END IF;
END $$;

-- PASO 9: Verificar estado final
SELECT 
    'Estado final - Producto 18' as info,
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
WHERE p.producto_id = 18
GROUP BY p.producto_id, p.titulo, p.total_likes;

-- PASO 10: Estadísticas generales
SELECT 
    'Estadísticas generales del sistema' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    (SELECT COUNT(*) FROM public.favorito) as total_favoritos_reales,
    MAX(total_likes) as max_likes_producto
FROM public.producto;

-- PASO 11: Mostrar productos con más likes
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
