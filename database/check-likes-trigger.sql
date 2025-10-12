-- Verificar si existe un trigger para actualizar el contador de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar triggers existentes en la tabla favorito
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'favorito';

-- 2. Verificar la columna total_likes en la tabla producto
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producto' 
  AND column_name = 'total_likes';

-- 3. Verificar el valor actual de total_likes para el producto 18
SELECT 
  producto_id,
  titulo,
  total_likes,
  veces_guardado
FROM producto 
WHERE producto_id = 18;

-- 4. Contar favoritos reales para el producto 18
SELECT 
  COUNT(*) as favoritos_reales
FROM favorito 
WHERE producto_id = 18;
