-- Agregar campos para documentos separados de fundación

-- Columna para almacenar múltiples documentos en formato JSON
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS documentos_fundacion JSONB DEFAULT NULL;

-- Comentario explicativo
COMMENT ON COLUMN usuario.documentos_fundacion IS 
'Almacena URLs de documentos separados de la fundación en formato JSON:
{
  "acta_constitucion": "url",
  "estatutos": "url", 
  "pre_rut": "url",
  "cartas_aceptacion": "url",
  "formulario_rues": "url"
}';

-- Índice para búsquedas en JSON (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_usuario_documentos_fundacion 
ON usuario USING gin (documentos_fundacion);

-- Actualizar registros existentes que tengan documento_fundacion
-- Mover el documento_fundacion existente a documentos_fundacion como acta_constitucion
UPDATE usuario 
SET documentos_fundacion = jsonb_build_object('acta_constitucion', documento_fundacion)
WHERE documento_fundacion IS NOT NULL 
  AND documentos_fundacion IS NULL;

