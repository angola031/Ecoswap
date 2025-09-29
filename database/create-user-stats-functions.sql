-- Funciones para manejo de estadísticas de usuario
-- Estas funciones ayudan a mantener las estadísticas actualizadas

-- Función para incrementar el contador de intercambios de un usuario
CREATE OR REPLACE FUNCTION increment_user_intercambios(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE usuario 
    SET total_intercambios = total_intercambios + 1
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar la calificación promedio de un usuario
CREATE OR REPLACE FUNCTION update_user_rating(user_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    -- Calcular calificación promedio basada en todas las calificaciones recibidas
    SELECT COALESCE(AVG(puntuacion), 0) INTO avg_rating
    FROM calificacion 
    WHERE calificado_id = user_id_param 
    AND es_publica = true;
    
    -- Actualizar la calificación promedio del usuario
    UPDATE usuario 
    SET calificacion_promedio = ROUND(avg_rating, 2)
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar eco puntos
CREATE OR REPLACE FUNCTION add_eco_points(user_id_param INTEGER, points INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE usuario 
    SET eco_puntos = eco_puntos + points
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar estadísticas de producto
CREATE OR REPLACE FUNCTION update_product_stats(product_id_param INTEGER, stat_type TEXT)
RETURNS VOID AS $$
BEGIN
    CASE stat_type
        WHEN 'view' THEN
            UPDATE producto SET visualizaciones = visualizaciones + 1 WHERE producto_id = product_id_param;
        WHEN 'save' THEN
            UPDATE producto SET veces_guardado = veces_guardado + 1 WHERE producto_id = product_id_param;
        WHEN 'like' THEN
            UPDATE producto SET total_likes = total_likes + 1 WHERE producto_id = product_id_param;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar calificación promedio cuando se agrega una nueva calificación
CREATE OR REPLACE FUNCTION trigger_update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_rating(NEW.calificado_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para la tabla calificacion
DROP TRIGGER IF EXISTS update_rating_on_calification ON calificacion;
CREATE TRIGGER update_rating_on_calification
    AFTER INSERT OR UPDATE OR DELETE ON calificacion
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_rating();

-- Función para obtener estadísticas de usuario
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
        (SELECT total_intercambios FROM usuario WHERE user_id = user_id_param) as total_intercambios,
        (SELECT COUNT(*)::INTEGER FROM intercambio WHERE (usuario_propone_id = user_id_param OR usuario_recibe_id = user_id_param) AND estado = 'completado') as intercambios_completados,
        (SELECT calificacion_promedio FROM usuario WHERE user_id = user_id_param) as calificacion_promedio,
        (SELECT eco_puntos FROM usuario WHERE user_id = user_id_param) as eco_puntos,
        (SELECT COUNT(*)::INTEGER FROM favorito WHERE usuario_id = user_id_param) as total_favoritos;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar datos antiguos (para mantenimiento)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Eliminar notificaciones leídas más antiguas de 30 días
    DELETE FROM notificacion 
    WHERE leida = true 
    AND fecha_lectura < NOW() - INTERVAL '30 days';
    
    -- Eliminar visualizaciones de productos más antiguas de 90 días
    DELETE FROM visualizacion_producto 
    WHERE fecha_visualizacion < NOW() - INTERVAL '90 days';
    
    -- Eliminar actividades de admin más antiguas de 1 año
    DELETE FROM actividad_admin 
    WHERE fecha_accion < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre las funciones:
--
-- 1. increment_user_intercambios: Incrementa el contador de intercambios cuando se completa uno
-- 2. update_user_rating: Recalcula la calificación promedio basada en todas las calificaciones
-- 3. add_eco_points: Agrega eco puntos por acciones específicas (completar intercambios, etc.)
-- 4. update_product_stats: Actualiza estadísticas de productos (vistas, guardados, likes)
-- 5. trigger_update_user_rating: Trigger automático que actualiza la calificación cuando cambian las calificaciones
-- 6. get_user_stats: Función que retorna todas las estadísticas de un usuario en una sola consulta
-- 7. cleanup_old_data: Función de mantenimiento para limpiar datos antiguos
