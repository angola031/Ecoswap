-- Crear trigger para actualizar automáticamente el contador de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Función para actualizar el contador de likes
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador cuando se agrega un favorito
    UPDATE producto 
    SET total_likes = total_likes + 1,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = NEW.producto_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador cuando se elimina un favorito
    UPDATE producto 
    SET total_likes = GREATEST(total_likes - 1, 0),
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE producto_id = OLD.producto_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear trigger para INSERT
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON favorito;
CREATE TRIGGER trigger_update_likes_on_insert
  AFTER INSERT ON favorito
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();

-- 3. Crear trigger para DELETE
DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON favorito;
CREATE TRIGGER trigger_update_likes_on_delete
  AFTER DELETE ON favorito
  FOR EACH ROW
  EXECUTE FUNCTION update_product_likes_count();

-- 4. Actualizar contadores existentes (sincronizar datos)
UPDATE producto 
SET total_likes = (
  SELECT COUNT(*) 
  FROM favorito 
  WHERE favorito.producto_id = producto.producto_id
);

-- 5. Verificar que el trigger funciona
SELECT 
  producto_id,
  titulo,
  total_likes
FROM producto 
WHERE producto_id = 18;
