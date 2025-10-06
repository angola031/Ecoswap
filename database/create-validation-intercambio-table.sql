-- Tabla para validaciones de intercambios
-- Permite que ambos usuarios validen si el intercambio fue exitoso

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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_intercambio_id 
    ON public.validacion_intercambio(intercambio_id);
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_usuario_id 
    ON public.validacion_intercambio(usuario_id);
CREATE INDEX IF NOT EXISTS idx_validacion_intercambio_fecha_validacion 
    ON public.validacion_intercambio(fecha_validacion DESC);

-- Comentarios sobre la tabla
COMMENT ON TABLE public.validacion_intercambio IS 'Validaciones de intercambios por parte de los usuarios involucrados';
COMMENT ON COLUMN public.validacion_intercambio.es_exitoso IS 'Indica si el usuario considera que el intercambio fue exitoso';
COMMENT ON COLUMN public.validacion_intercambio.calificacion IS 'Calificación del 1 al 5 que el usuario le da al otro participante';
COMMENT ON COLUMN public.validacion_intercambio.comentario IS 'Comentario sobre el intercambio';
COMMENT ON COLUMN public.validacion_intercambio.aspectos_destacados IS 'Aspectos positivos o negativos destacados del intercambio';

-- Función para obtener validaciones de un intercambio
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

-- Función para verificar si un intercambio está listo para completarse
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

-- Trigger para actualizar estadísticas cuando se completa un intercambio
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

-- Crear trigger
DROP TRIGGER IF EXISTS update_intercambio_stats_trigger ON public.intercambio;
CREATE TRIGGER update_intercambio_stats_trigger
    AFTER UPDATE ON public.intercambio
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_intercambio_stats();

