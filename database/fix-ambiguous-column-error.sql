-- Script para corregir el error de columna ambigua en la función get_user_stats
-- Ejecutar este script si ya se ejecutó el script principal y hay errores

-- Corregir la función get_user_stats para evitar ambigüedad de columnas
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param INTEGER)
RETURNS TABLE (
    total_productos INTEGER,
    productos_activos INTEGER,
    total_intercambios INTEGER,
    intercambios_completados INTEGER,
    calificacion_promedio NUMERIC,
    eco_puntos INTEGER,
    total_favoritos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM producto WHERE user_id = user_id_param) as total_productos,
        (SELECT COUNT(*)::INTEGER FROM producto WHERE user_id = user_id_param AND estado_publicacion = 'activo') as productos_activos,
        (SELECT u.total_intercambios FROM usuario u WHERE u.user_id = user_id_param) as total_intercambios,
        (SELECT COUNT(*)::INTEGER FROM intercambio WHERE (usuario_propone_id = user_id_param OR usuario_recibe_id = user_id_param) AND estado = 'completado') as intercambios_completados,
        (SELECT u.calificacion_promedio FROM usuario u WHERE u.user_id = user_id_param) as calificacion_promedio,
        (SELECT u.eco_puntos FROM usuario u WHERE u.user_id = user_id_param) as eco_puntos,
        (SELECT COUNT(*)::INTEGER FROM favorito WHERE usuario_id = user_id_param) as total_favoritos;
END;
$$ LANGUAGE plpgsql;

-- Verificar que la función se corrigió correctamente
DO $$
DECLARE
    test_user_id INTEGER;
    stats_record RECORD;
BEGIN
    -- Buscar un usuario para probar
    SELECT user_id INTO test_user_id
    FROM public.usuario 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Probar función de estadísticas
        SELECT * INTO stats_record
        FROM get_user_stats(test_user_id);
        
        RAISE NOTICE '✅ Función get_user_stats corregida y funcionando';
        RAISE NOTICE '   - Productos: %, Activos: %, Intercambios: %', 
            stats_record.total_productos, 
            stats_record.productos_activos, 
            stats_record.total_intercambios;
    ELSE
        RAISE NOTICE '⚠️ No hay usuarios para probar la función';
    END IF;
END $$;
