-- Agregar campos para fundaciones en la tabla usuario
ALTER TABLE public.usuario 
ADD COLUMN IF NOT EXISTS es_fundacion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nombre_fundacion character varying,
ADD COLUMN IF NOT EXISTS nit_fundacion character varying,
ADD COLUMN IF NOT EXISTS documento_fundacion character varying, -- URL del documento de registro
ADD COLUMN IF NOT EXISTS tipo_fundacion character varying CHECK (tipo_fundacion IN ('proteccion_ninos', 'educacion_ninos', 'salud_ninos', 'nutricion_ninos', 'derechos_ninos')),
ADD COLUMN IF NOT EXISTS descripcion_fundacion text,
ADD COLUMN IF NOT EXISTS pagina_web_fundacion character varying,
ADD COLUMN IF NOT EXISTS fundacion_verificada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_verificacion_fundacion timestamp with time zone;

-- Agregar índice para búsquedas rápidas de fundaciones
CREATE INDEX IF NOT EXISTS idx_usuario_es_fundacion ON public.usuario(es_fundacion) WHERE es_fundacion = true;
CREATE INDEX IF NOT EXISTS idx_usuario_fundacion_verificada ON public.usuario(fundacion_verificada) WHERE fundacion_verificada = true;

-- Comentarios para documentación
COMMENT ON COLUMN public.usuario.es_fundacion IS 'Indica si el usuario es una fundación u organización';
COMMENT ON COLUMN public.usuario.nombre_fundacion IS 'Nombre legal de la fundación';
COMMENT ON COLUMN public.usuario.nit_fundacion IS 'NIT o número de identificación tributaria';
COMMENT ON COLUMN public.usuario.documento_fundacion IS 'URL del documento de registro o certificado de existencia';
COMMENT ON COLUMN public.usuario.tipo_fundacion IS 'Tipo de fundación: proteccion_ninos, educacion_ninos, salud_ninos, nutricion_ninos, derechos_ninos';
COMMENT ON COLUMN public.usuario.descripcion_fundacion IS 'Descripción de la misión y actividades de la fundación';
COMMENT ON COLUMN public.usuario.fundacion_verificada IS 'Indica si la fundación ha sido verificada por un administrador';
COMMENT ON COLUMN public.usuario.fecha_verificacion_fundacion IS 'Fecha en que se verificó la fundación';

