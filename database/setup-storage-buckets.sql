-- Configuración de buckets de Supabase Storage para EcoSwap

-- Crear bucket para documentos de fundaciones (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documentos',
    'documentos',
    true, -- público para que los admins puedan ver los documentos
    5242880, -- 5MB en bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para el bucket 'documentos'

-- Permitir que usuarios autenticados suban documentos
CREATE POLICY IF NOT EXISTS "Usuarios pueden subir sus documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documentos' 
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- Permitir que todos puedan ver los documentos (para verificación por admins)
CREATE POLICY IF NOT EXISTS "Documentos son públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documentos');

-- Permitir que usuarios puedan actualizar sus propios documentos
CREATE POLICY IF NOT EXISTS "Usuarios pueden actualizar sus documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = 'fundaciones'
)
WITH CHECK (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- Permitir que usuarios puedan eliminar sus propios documentos
CREATE POLICY IF NOT EXISTS "Usuarios pueden eliminar sus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documentos'
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- Comentarios
COMMENT ON POLICY "Usuarios pueden subir sus documentos" ON storage.objects IS 
'Permite a usuarios autenticados subir documentos de fundación';

COMMENT ON POLICY "Documentos son públicos" ON storage.objects IS 
'Permite que los documentos sean visibles públicamente para verificación por admins';

