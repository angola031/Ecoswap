-- Script para actualizar el esquema existente con el sistema de validación y calificación
-- Este script agrega las funcionalidades necesarias sin romper el esquema actual

-- 1. Agregar nuevos estados a la tabla intercambio
ALTER TABLE public.intercambio 
DROP CONSTRAINT IF EXISTS intercambio_estado_check;

ALTER TABLE public.intercambio 
ADD CONSTRAINT intercambio_estado_check 
CHECK (estado::text = ANY (ARRAY[
  'pendiente'::character varying, 
  'aceptado'::character varying, 
  'rechazado'::character varying, 
  'completado'::character varying, 
  'cancelado'::character varying,
  'en_progreso'::character varying,
  'pendiente_validacion'::character varying,
  'fallido'::character varying
]::text[]));

-- 2. Crear la tabla de validación de intercambios
CREATE TABLE IF NOT EXISTS public.validacion_intercambio (
    validacion_id SERIAL PRIMARY KEY,
    intercambio_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    es_exitoso BOOLEAN NOT NULL,
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    aspectos_destacados TEXT,
    fecha_validacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT validacion_intercambio_intercambio_id_fkey 
        FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id) ON DELETE CASCADE,
    CONSTRAINT validacion_intercambio_usuario_id_fkey 
        FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id) ON DELETE CASCADE,
    CONSTRAINT validacion_intercambio_unique 
        UNIQUE (intercambio_id, usuario_id)
);

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_intercambio_id 
    ON public.validacion_intercambio(intercambio_id);
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_usuario_id 
    ON public.validacion_intercambio(usuario_id);
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_fecha_validacion 
    ON public.validacion_intercambio(fecha_validacion DESC);

-- 4. Agregar comentarios a la tabla
COMMENT ON TABLE public.validacion_intercambio IS 'Validaciones de intercambios por parte de los usuarios involucrados';
COMMENT ON COLUMN public.validacion_intercambio.es_exitoso IS 'Indica si el usuario considera que el intercambio fue exitoso';
COMMENT ON COLUMN public.validacion_intercambio.calificacion IS 'Calificación del 1 al 5 que el usuario le da al otro participante';
COMMENT ON COLUMN public.validacion_intercambio.comentario IS 'Comentario sobre el intercambio';
COMMENT ON COLUMN public.validacion_intercambio.aspectos_destacados IS 'Aspectos positivos o negativos destacados del intercambio';

-- 5. Función para obtener validaciones de un intercambio
CREATE OR REPLACE FUNCTION get_intercambio_validations(p_intercambio_id INTEGER)
RETURNS TABLE(
    validacion_id INTEGER,
    usuario_id INTEGER,
    es_exitoso BOOLEAN,
    calificacion INTEGER,
    comentario TEXT,
    aspectos_destacados TEXT,
    fecha_validacion TIMESTAMP WITH TIME ZONE,
    usuario_nombre VARCHAR,
    usuario_apellido VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.validacion_id,
        v.usuario_id,
        v.es_exitoso,
        v.calificacion,
        v.comentario,
        v.aspectos_destacados,
        v.fecha_validacion,
        u.nombre,
        u.apellido
    FROM public.validacion_intercambio v
    JOIN public.usuario u ON v.usuario_id = u.user_id
    WHERE v.intercambio_id = p_intercambio_id
    ORDER BY v.fecha_validacion DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para verificar si un intercambio está listo para completarse
CREATE OR REPLACE FUNCTION is_intercambio_ready_for_completion(p_intercambio_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    validation_count INTEGER;
    successful_count INTEGER;
BEGIN
    -- Contar validaciones
    SELECT COUNT(*) INTO validation_count
    FROM public.validacion_intercambio
    WHERE intercambio_id = p_intercambio_id;
    
    -- Contar validaciones exitosas
    SELECT COUNT(*) INTO successful_count
    FROM public.validacion_intercambio
    WHERE intercambio_id = p_intercambio_id AND es_exitoso = true;
    
    -- Retornar true si hay 2 validaciones y ambas son exitosas
    RETURN validation_count = 2 AND successful_count = 2;
END;
$$ LANGUAGE plpgsql;

-- 7. Función para incrementar el contador de intercambios de un usuario
CREATE OR REPLACE FUNCTION increment_user_intercambios(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE usuario 
    SET total_intercambios = total_intercambios + 1
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 8. Función para actualizar la calificación promedio de un usuario
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

-- 9. Función para incrementar eco puntos
CREATE OR REPLACE FUNCTION add_eco_points(user_id_param INTEGER, points INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE usuario 
    SET eco_puntos = eco_puntos + points
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- 10. Trigger para actualizar estadísticas cuando se completa un intercambio
CREATE OR REPLACE FUNCTION trigger_update_intercambio_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si el estado cambió a 'completado'
    IF NEW.estado = 'completado' AND (OLD.estado IS NULL OR OLD.estado != 'completado') THEN
        -- Incrementar contador de intercambios para ambos usuarios
        PERFORM increment_user_intercambios(NEW.usuario_propone_id);
        PERFORM increment_user_intercambios(NEW.usuario_recibe_id);
        
        -- Agregar eco puntos por completar intercambio
        PERFORM add_eco_points(NEW.usuario_propone_id, 10);
        PERFORM add_eco_points(NEW.usuario_recibe_id, 10);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear trigger para actualizar estadísticas
DROP TRIGGER IF EXISTS update_intercambio_stats_trigger ON public.intercambio;
CREATE TRIGGER update_intercambio_stats_trigger
    AFTER UPDATE ON public.intercambio
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_intercambio_stats();

-- 12. Trigger para actualizar calificación promedio cuando se agrega una calificación
CREATE OR REPLACE FUNCTION trigger_update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar calificación promedio del usuario calificado
    PERFORM update_user_rating(NEW.calificado_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Crear trigger para la tabla calificacion
DROP TRIGGER IF EXISTS update_rating_on_calification ON calificacion;
CREATE TRIGGER update_rating_on_calification
    AFTER INSERT OR UPDATE OR DELETE ON calificacion
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_rating();

-- 14. Función para obtener estadísticas de usuario
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

-- 15. Agregar índices adicionales para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_intercambio_estado ON intercambio(estado);
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_propone_id ON intercambio(usuario_propone_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_recibe_id ON intercambio(usuario_recibe_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_fecha_propuesta ON intercambio(fecha_propuesta DESC);

-- 16. Comentarios adicionales
COMMENT ON FUNCTION get_intercambio_validations(INTEGER) IS 'Obtiene todas las validaciones de un intercambio específico';
COMMENT ON FUNCTION is_intercambio_ready_for_completion(INTEGER) IS 'Verifica si un intercambio está listo para completarse (ambas validaciones exitosas)';
COMMENT ON FUNCTION increment_user_intercambios(INTEGER) IS 'Incrementa el contador de intercambios de un usuario';
COMMENT ON FUNCTION update_user_rating(INTEGER) IS 'Actualiza la calificación promedio de un usuario';
COMMENT ON FUNCTION add_eco_points(INTEGER, INTEGER) IS 'Agrega eco puntos a un usuario';
COMMENT ON FUNCTION get_user_stats(INTEGER) IS 'Obtiene estadísticas completas de un usuario';

-- 17. Verificar que todo se creó correctamente
DO $$
BEGIN
    -- Verificar que la tabla se creó
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'validacion_intercambio') THEN
        RAISE EXCEPTION 'La tabla validacion_intercambio no se creó correctamente';
    END IF;
    
    -- Verificar que las funciones se crearon
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_intercambio_validations') THEN
        RAISE EXCEPTION 'La función get_intercambio_validations no se creó correctamente';
    END IF;
    
    RAISE NOTICE '✅ Sistema de validación y calificación instalado correctamente';
    RAISE NOTICE '📊 Tabla validacion_intercambio creada';
    RAISE NOTICE '🔧 Funciones de validación instaladas';
    RAISE NOTICE '⚡ Triggers de estadísticas configurados';
    RAISE NOTICE '📈 Índices de optimización creados';
END $$;
