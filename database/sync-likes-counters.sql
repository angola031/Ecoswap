-- Sincronizar todos los contadores de likes con los favoritos reales
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Actualizar todos los contadores de likes
UPDATE producto 
SET total_likes = (
  SELECT COUNT(*) 
  FROM favorito 
  WHERE favorito.producto_id = producto.producto_id
),
fecha_actualizacion = CURRENT_TIMESTAMP;

-- 2. Verificar productos con más likes
SELECT 
  producto_id,
  titulo,
  total_likes,
  fecha_actualizacion
FROM producto 
WHERE total_likes > 0
ORDER BY total_likes DESC
LIMIT 10;

-- 3. Verificar productos sin likes
SELECT 
  producto_id,
  titulo,
  total_likes
FROM producto 
WHERE total_likes = 0 OR total_likes IS NULL
LIMIT 10;

-- 4. Estadísticas generales
SELECT 
  COUNT(*) as total_productos,
  SUM(total_likes) as total_likes_sistema,
  AVG(total_likes) as promedio_likes,
  MAX(total_likes) as max_likes
FROM producto;
