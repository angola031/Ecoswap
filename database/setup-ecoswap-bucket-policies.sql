-- Configuración de políticas de seguridad para bucket Ecoswap - Documentos de fundaciones
-- Este script asume que el bucket 'Ecoswap' ya existe

-- IMPORTANTE: Este bucket debe ser público para que los admins puedan revisar documentos
-- Si el bucket no es público, ejecuta primero:
-- UPDATE storage.buckets SET public = true WHERE id = 'Ecoswap';

-- Eliminar políticas existentes si las hay (para evitar conflictos)
DROP POLICY IF EXISTS "Fundaciones pueden subir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver documentos de fundaciones" ON storage.objects;
DROP POLICY IF EXISTS "Fundaciones pueden actualizar sus documentos" ON storage.objects;
DROP POLICY IF EXISTS "Fundaciones pueden eliminar sus documentos" ON storage.objects;

-- 1. Permitir que usuarios autenticados suban documentos a /fundaciones/
CREATE POLICY "Fundaciones pueden subir documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- 2. Permitir que usuarios autenticados vean documentos en /fundaciones/
-- (Necesario para que los admins y las propias fundaciones puedan ver sus documentos)
CREATE POLICY "Usuarios autenticados pueden ver documentos de fundaciones"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'Ecoswap' 
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- 3. Permitir que usuarios puedan actualizar/reemplazar sus propios documentos
CREATE POLICY "Fundaciones pueden actualizar sus documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'Ecoswap'
    AND (storage.foldername(name))[1] = 'fundaciones'
)
WITH CHECK (
    bucket_id = 'Ecoswap'
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- 4. Permitir que usuarios puedan eliminar sus propios documentos
CREATE POLICY "Fundaciones pueden eliminar sus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'Ecoswap'
    AND (storage.foldername(name))[1] = 'fundaciones'
);

-- Comentarios para documentación
COMMENT ON POLICY "Fundaciones pueden subir documentos" ON storage.objects IS 
'Permite a usuarios autenticados subir documentos de fundación a la carpeta /fundaciones/';

COMMENT ON POLICY "Usuarios autenticados pueden ver documentos de fundaciones" ON storage.objects IS 
'Permite que usuarios autenticados (incluidos admins) puedan ver documentos de fundaciones';

COMMENT ON POLICY "Fundaciones pueden actualizar sus documentos" ON storage.objects IS 
'Permite que las fundaciones actualicen/reemplacen sus documentos subidos';

COMMENT ON POLICY "Fundaciones pueden eliminar sus documentos" ON storage.objects IS 
'Permite que las fundaciones eliminen sus documentos subidos';

-- Verificación: Consultar las políticas creadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND policyname LIKE '%fundaciones%';

