-- =====================================================
-- INSTALACIÓN COMPLETA DEL SISTEMA DE LIKES
-- =====================================================
-- Ejecutar este script en Supabase Dashboard > SQL Editor
-- para instalar completamente el sistema de actualización de likes

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

-- PASO 2: Crear función de actualización de likes
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

-- PASO 3: Crear triggers
DROP TRIGGER IF EXISTS trigger_update_product_likes ON public.favorito;
CREATE TRIGGER trigger_update_product_likes
    AFTER INSERT OR DELETE ON public.favorito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_likes_count();

-- PASO 4: Función de sincronización
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

-- PASO 5: Sincronizar contadores existentes
UPDATE public.producto 
SET total_likes = (
    SELECT COUNT(*) 
    FROM public.favorito 
    WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- PASO 6: Crear funciones de administración
CREATE OR REPLACE FUNCTION admin_get_likes_report()
RETURNS TABLE (
    producto_id INTEGER,
    titulo TEXT,
    contador_sistema INTEGER,
    favoritos_reales INTEGER,
    diferencia INTEGER,
    estado TEXT,
    fecha_actualizacion TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.producto_id,
        p.titulo,
        p.total_likes as contador_sistema,
        COUNT(f.favorito_id)::INTEGER as favoritos_reales,
        (p.total_likes - COUNT(f.favorito_id))::INTEGER as diferencia,
        CASE 
            WHEN p.total_likes = COUNT(f.favorito_id) THEN 'Sincronizado'
            WHEN p.total_likes > COUNT(f.favorito_id) THEN 'Sobrecarga'
            ELSE 'Subcarga'
        END as estado,
        p.fecha_actualizacion
    FROM public.producto p
    LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
    GROUP BY p.producto_id, p.titulo, p.total_likes, p.fecha_actualizacion
    ORDER BY ABS(p.total_likes - COUNT(f.favorito_id)) DESC, p.total_likes DESC;
END;
$$ LANGUAGE plp Control de acceso para administradores;

-- PASO 7: Verificar instalación
SELECT 
    'Instalación completada' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'producto' 
            AND column_name = 'total_likes' 
            AND table_schema = 'public'
        ) THEN '✅ Campo total_likes instalado'
        ELSE '❌ Error en campo total_likes'
    END as campo_total_likes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE event_object_table = 'favorito' 
            AND trigger_name = 'trigger_update_product_likes'
        ) THEN '✅ Trigger instalado'
        ELSE '❌ Error en trigger'
    END as trigger_likes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_product_likes_count' 
            AND routine_schema = 'public'
        ) THEN '✅ Función instalada'
        ELSE '❌ Error en función'
    END as funcion_likes;

-- PASO 8: Mostrar estadísticas iniciales
SELECT 
    'Estadísticas del sistema' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    AVG(total_likes::DECIMAL) as promedio_likes,
    MAX(total_likes) as max_likes,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes
FROM public.producto;

-- PASO 9: Mostrar productos con más likes
SELECT 
    'Top 10 productos con más likes' as ranking,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

-- 1. Para verificar el estado del sistema:
--    SELECT * FROM admin_get_likes_report();

-- 2. Para sincronizar todos los contadores:
--    SELECT * FROM public.sync_all_product_likes();

-- 3. Para ver solo productos desincronizados:
--    SELECT * FROM admin_get_likes_report() WHERE diferencia != 0;

-- 4. Los contadores se actualizan automáticamente cuando:
--    - Se agrega un favorito: INSERT INTO favorito (usuario_id, producto_id) VALUES (...)
--    - Se elimina un favorito: DELETE FROM favorito WHERE usuario_id = ... AND producto_id = ...

SELECT 'Sistema de likes instalado correctamente. Los contadores se actualizarán automáticamente.' as mensaje;
