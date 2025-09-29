-- Crear tabla para propuestas de intercambio
-- Esta tabla permite que los usuarios hagan propuestas específicas en el chat

CREATE TABLE IF NOT EXISTS public.propuesta_intercambio (
  propuesta_id integer NOT NULL DEFAULT nextval('propuesta_intercambio_propuesta_id_seq'::regclass),
  intercambio_id integer NOT NULL,
  propuesta_por_id integer NOT NULL,
  tipo_propuesta character varying NOT NULL CHECK (tipo_propuesta::text = ANY (ARRAY['precio'::character varying, 'intercambio'::character varying, 'encuentro'::character varying, 'condiciones'::character varying, 'otro'::character varying]::text[])),
  descripcion text NOT NULL,
  precio_propuesto numeric,
  condiciones text,
  fecha_encuentro timestamp without time zone,
  lugar_encuentro character varying,
  archivos_adjuntos jsonb,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'aceptada'::character varying, 'rechazada'::character varying, 'contrapropuesta'::character varying]::text[])),
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta timestamp without time zone,
  respuesta_usuario_id integer,
  respuesta_comentario text,
  CONSTRAINT propuesta_intercambio_pkey PRIMARY KEY (propuesta_id),
  CONSTRAINT propuesta_intercambio_intercambio_id_fkey FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id) ON DELETE CASCADE,
  CONSTRAINT propuesta_intercambio_propuesta_por_id_fkey FOREIGN KEY (propuesta_por_id) REFERENCES public.usuario(user_id),
  CONSTRAINT propuesta_intercambio_respuesta_usuario_id_fkey FOREIGN KEY (respuesta_usuario_id) REFERENCES public.usuario(user_id)
);

-- Crear secuencia para el ID autoincremental
CREATE SEQUENCE IF NOT EXISTS public.propuesta_intercambio_propuesta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Asignar la secuencia a la columna
ALTER TABLE ONLY public.propuesta_intercambio ALTER COLUMN propuesta_id SET DEFAULT nextval('public.propuesta_intercambio_propuesta_id_seq'::regclass);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_propuesta_intercambio_intercambio_id ON propuesta_intercambio(intercambio_id);
CREATE INDEX IF NOT EXISTS idx_propuesta_intercambio_propuesta_por_id ON propuesta_intercambio(propuesta_por_id);
CREATE INDEX IF NOT EXISTS idx_propuesta_intercambio_estado ON propuesta_intercambio(estado);
CREATE INDEX IF NOT EXISTS idx_propuesta_intercambio_fecha_creacion ON propuesta_intercambio(fecha_creacion DESC);

-- Agregar comentarios a la tabla y columnas
COMMENT ON TABLE public.propuesta_intercambio IS 'Tabla para almacenar propuestas específicas realizadas durante las conversaciones de intercambio';
COMMENT ON COLUMN public.propuesta_intercambio.propuesta_id IS 'ID único de la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.intercambio_id IS 'ID del intercambio relacionado';
COMMENT ON COLUMN public.propuesta_intercambio.propuesta_por_id IS 'ID del usuario que hace la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.tipo_propuesta IS 'Tipo de propuesta: precio, intercambio, encuentro, condiciones, otro';
COMMENT ON COLUMN public.propuesta_intercambio.descripcion IS 'Descripción detallada de la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.precio_propuesto IS 'Precio propuesto (si aplica)';
COMMENT ON COLUMN public.propuesta_intercambio.condiciones IS 'Condiciones específicas de la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.fecha_encuentro IS 'Fecha propuesta para el encuentro (si aplica)';
COMMENT ON COLUMN public.propuesta_intercambio.lugar_encuentro IS 'Lugar propuesto para el encuentro (si aplica)';
COMMENT ON COLUMN public.propuesta_intercambio.archivos_adjuntos IS 'Archivos adjuntos en formato JSON';
COMMENT ON COLUMN public.propuesta_intercambio.estado IS 'Estado actual de la propuesta: pendiente, aceptada, rechazada, contrapropuesta';
COMMENT ON COLUMN public.propuesta_intercambio.fecha_creacion IS 'Fecha y hora de creación de la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.fecha_respuesta IS 'Fecha y hora de la respuesta';
COMMENT ON COLUMN public.propuesta_intercambio.respuesta_usuario_id IS 'ID del usuario que respondió la propuesta';
COMMENT ON COLUMN public.propuesta_intercambio.respuesta_comentario IS 'Comentario adicional en la respuesta';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.propuesta_intercambio ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
CREATE POLICY "Usuarios pueden ver propuestas de sus intercambios" ON public.propuesta_intercambio
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM intercambio i 
      WHERE i.intercambio_id = propuesta_intercambio.intercambio_id 
      AND (
        i.usuario_propone_id = auth.uid()::integer 
        OR i.usuario_recibe_id = auth.uid()::integer
      )
    )
  );

CREATE POLICY "Usuarios pueden crear propuestas en sus intercambios" ON public.propuesta_intercambio
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM intercambio i 
      WHERE i.intercambio_id = propuesta_intercambio.intercambio_id 
      AND (
        i.usuario_propone_id = auth.uid()::integer 
        OR i.usuario_recibe_id = auth.uid()::integer
      )
    )
    AND propuesta_por_id = auth.uid()::integer
  );

CREATE POLICY "Usuarios pueden actualizar sus propuestas o responder a propuestas de otros" ON public.propuesta_intercambio
  FOR UPDATE USING (
    propuesta_por_id = auth.uid()::integer
    OR EXISTS (
      SELECT 1 FROM intercambio i 
      WHERE i.intercambio_id = propuesta_intercambio.intercambio_id 
      AND (
        i.usuario_propone_id = auth.uid()::integer 
        OR i.usuario_recibe_id = auth.uid()::integer
      )
      AND propuesta_por_id != auth.uid()::integer
    )
  );

-- Función para obtener estadísticas de propuestas por usuario
CREATE OR REPLACE FUNCTION get_user_proposal_stats(user_id_param INTEGER)
RETURNS TABLE (
  total_propuestas INTEGER,
  propuestas_aceptadas INTEGER,
  propuestas_rechazadas INTEGER,
  propuestas_pendientes INTEGER,
  tasa_aceptacion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param) as total_propuestas,
    (SELECT COUNT(*)::INTEGER FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado = 'aceptada') as propuestas_aceptadas,
    (SELECT COUNT(*)::INTEGER FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado = 'rechazada') as propuestas_rechazadas,
    (SELECT COUNT(*)::INTEGER FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado = 'pendiente') as propuestas_pendientes,
    CASE 
      WHEN (SELECT COUNT(*) FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado IN ('aceptada', 'rechazada')) > 0
      THEN ROUND(
        (SELECT COUNT(*)::NUMERIC FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado = 'aceptada') / 
        (SELECT COUNT(*)::NUMERIC FROM propuesta_intercambio WHERE propuesta_por_id = user_id_param AND estado IN ('aceptada', 'rechazada')) * 100, 
        2
      )
      ELSE 0
    END as tasa_aceptacion;
END;
$$ LANGUAGE plpgsql;

-- Comentarios sobre el uso:
-- 
-- 1. La tabla permite crear propuestas estructuradas durante las conversaciones
-- 2. Los tipos de propuesta incluyen: precio, intercambio, encuentro, condiciones, otro
-- 3. Cada propuesta puede tener una respuesta: aceptada, rechazada, contrapropuesta
-- 4. Se mantiene un historial completo de propuestas y respuestas
-- 5. Las políticas de RLS aseguran que solo los usuarios involucrados pueden ver/crear propuestas
-- 6. La función get_user_proposal_stats permite obtener estadísticas de propuestas por usuario
