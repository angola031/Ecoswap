-- Verificar las restricciones de la tabla usuario, especialmente password_hash
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'usuario'
ORDER BY ordinal_position;

-- Verificar restricciones NOT NULL específicamente
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.usuario'::regclass
AND contype = 'n'; -- 'n' = NOT NULL constraint












































