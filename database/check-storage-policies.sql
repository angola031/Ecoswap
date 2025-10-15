-- Script para verificar las políticas RLS actuales del storage

-- Verificar si RLS está habilitado en storage.objects
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Listar todas las políticas del storage
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;

-- Verificar buckets disponibles
SELECT * FROM storage.buckets;

-- Verificar archivos en el bucket Ecoswap
SELECT name, bucket_id, owner, created_at, updated_at
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
ORDER BY created_at DESC
LIMIT 10;

