-- Script de administración para el sistema de likes
-- Para uso de administradores en Supabase Dashboard > SQL Editor

-- =====================================================
-- FUNCIONES DE ADMINISTRACIÓN
-- =====================================================

-- 1. Función para obtener reporte completo de likes
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
$$ LANGUAGE plpgsql;

-- 2. Función para corregir un producto específico
CREATE OR REPLACE FUNCTION admin_fix_product_likes(target_producto_id INTEGER)
RETURNS TABLE (
    producto_id INTEGER,
    titulo TEXT,
    likes_antes INTEGER,
    likes_despues INTEGER,
    diferencia INTEGER
) AS $$
DECLARE
    likes_antes INTEGER;
    likes_despues INTEGER;
    titulo_producto TEXT;
BEGIN
    -- Obtener datos actuales
    SELECT p.total_likes, p.titulo INTO likes_antes, titulo_producto
    FROM public.producto p
    WHERE p.producto_id = target_producto_id;
    
    -- Contar favoritos reales
    SELECT COUNT(*)::INTEGER INTO likes_despues
    FROM public.favorito f
    WHERE f.producto_id = target_producto_id;
    
    -- Actualizar contador
    UPDATE public.producto 
    SET total_likes = likes_despues,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = target_producto_id;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        target_producto_id,
        titulo_producto,
        likes_antes,
        likes_despues,
        (likes_despues - likes_antes);
END;
$$ LANGUAGE plpgsql;

-- 3. Función para corregir todos los productos
CREATE OR REPLACE FUNCTION admin_fix_all_products_likes()
RETURNS TABLE (
    total_procesados INTEGER,
    productos_corregidos INTEGER,
    productos_sin_cambios INTEGER,
    suma_diferencias INTEGER
) AS $$
DECLARE
    total_procesados INTEGER := 0;
    productos_corregidos INTEGER := 0;
    productos_sin_cambios INTEGER := 0;
    suma_diferencias INTEGER := 0;
    producto_record RECORD;
    likes_reales INTEGER;
    diferencia INTEGER;
BEGIN
    -- Procesar cada producto
    FOR producto_record IN 
        SELECT producto_id, total_likes FROM public.producto
    LOOP
        total_procesados := total_procesados + 1;
        
        -- Contar favoritos reales
        SELECT COUNT(*)::INTEGER INTO likes_reales
        FROM public.favorito
        WHERE producto_id = producto_record.producto_id;
        
        diferencia := likes_reales - producto_record.total_likes;
        suma_diferencias := suma_diferencias + ABS(diferencia);
        
        IF diferencia != 0 THEN
            -- Actualizar contador
            UPDATE public.producto 
            SET total_likes = likes_reales,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE producto_id = producto_record.producto_id;
            
            productos_corregidos := productos_corregidos + 1;
        ELSE
            productos_sin_cambios := productos_sin_cambios + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        total_procesados,
        productos_corregidos,
        productos_sin_cambios,
        suma_diferencias;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMANDOS DE ADMINISTRACIÓN
-- =====================================================

-- 1. Ver reporte completo
SELECT * FROM admin_get_likes_report();

-- 2. Ver solo productos desincronizados
SELECT * FROM admin_get_likes_report() 
WHERE diferencia != 0 
ORDER BY ABS(diferencia) DESC;

-- 3. Estadísticas generales
SELECT 
    'Estadísticas Generales' as reporte,
    COUNT(*) as total_productos,
    SUM(contador_sistema) as total_likes_sistema,
    SUM(favoritos_reales) as total_favoritos_reales,
    SUM(ABS(diferencia)) as total_desincronizacion,
    COUNT(*) FILTER (WHERE diferencia = 0) as productos_sincronizados,
    COUNT(*) FILTER (WHERE diferencia != 0) as productos_desincronizados,
    ROUND(
        (COUNT(*) FILTER (WHERE diferencia = 0)::DECIMAL / COUNT(*)) * 100, 2
    ) as porcentaje_sincronizacion
FROM admin_get_likes_report();

-- 4. Top 10 productos con más desincronización
SELECT * FROM admin_get_likes_report() 
WHERE diferencia != 0 
ORDER BY ABS(diferencia) DESC 
LIMIT 10;

-- 5. Productos con sobrecarga (más likes de los que deberían)
SELECT * FROM admin_get_likes_report() 
WHERE diferencia > 0 
ORDER BY diferencia DESC;

-- 6. Productos con subcarga (menos likes de los que deberían)
SELECT * FROM admin_get_likes_report() 
WHERE diferencia < 0 
ORDER BY diferencia ASC;

-- =====================================================
-- COMANDOS DE CORRECCIÓN
-- =====================================================

-- NOTA: Descomenta la línea que necesites ejecutar

-- Corregir un producto específico (reemplaza 1 con el ID del producto)
-- SELECT * FROM admin_fix_product_likes(1);

-- Corregir todos los productos (¡CUIDADO! Esto puede tomar tiempo)
-- SELECT * FROM admin_fix_all_products_likes();

-- =====================================================
-- VERIFICACIÓN POST-CORRECCIÓN
-- =====================================================

-- Después de ejecutar correcciones, verifica los resultados:
SELECT 
    'Verificación Post-Corrección' as verificacion,
    COUNT(*) FILTER (WHERE diferencia = 0) as productos_sincronizados,
    COUNT(*) FILTER (WHERE diferencia != 0) as productos_aun_desincronizados,
    SUM(ABS(diferencia)) as desincronizacion_restante
FROM admin_get_likes_report();

-- =====================================================
-- MANTENIMIENTO DEL SISTEMA
-- =====================================================

-- Verificar que los triggers estén activos
SELECT 
    'Estado de Triggers' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ Activo'
        ELSE '❌ No encontrado'
    END as estado
FROM information_schema.triggers 
WHERE event_object_table = 'favorito' 
    AND event_object_schema = 'public'
    AND trigger_name LIKE '%likes%';

-- Verificar función de actualización
SELECT 
    'Función de Actualización' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_product_likes_count' 
            AND routine_schema = 'public'
        ) THEN '✅ Función existe'
        ELSE '❌ Función NO existe'
    END as estado;
