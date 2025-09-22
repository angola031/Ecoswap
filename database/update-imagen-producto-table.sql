-- =============================================
-- ACTUALIZACIÓN DE TABLA IMAGEN_PRODUCTO
-- =============================================

-- La tabla IMAGEN_PRODUCTO ya existe y está bien estructurada
-- Solo necesitamos agregar políticas RLS si no existen

-- Habilitar RLS si no está habilitado
ALTER TABLE IMAGEN_PRODUCTO ENABLE ROW LEVEL SECURITY;

-- Crear políticas para IMAGEN_PRODUCTO
CREATE POLICY "Imágenes son visibles" ON IMAGEN_PRODUCTO
FOR SELECT USING (true);

CREATE POLICY "Imágenes pueden ser creadas" ON IMAGEN_PRODUCTO
FOR INSERT WITH CHECK (true);

CREATE POLICY "Imágenes pueden ser actualizadas" ON IMAGEN_PRODUCTO
FOR UPDATE USING (true);

CREATE POLICY "Imágenes pueden ser eliminadas" ON IMAGEN_PRODUCTO
FOR DELETE USING (true);

-- Crear función para obtener imágenes de un producto
CREATE OR REPLACE FUNCTION get_product_images(p_producto_id INTEGER)
RETURNS TABLE (
    imagen_id INTEGER,
    url_imagen VARCHAR(500),
    descripcion_alt VARCHAR(200),
    es_principal BOOLEAN,
    orden INTEGER,
    fecha_subida TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ip.imagen_id,
        ip.url_imagen,
        ip.descripcion_alt,
        ip.es_principal,
        ip.orden,
        ip.fecha_subida
    FROM IMAGEN_PRODUCTO ip
    WHERE ip.producto_id = p_producto_id
    ORDER BY ip.orden ASC, ip.fecha_subida ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para agregar imagen a un producto
CREATE OR REPLACE FUNCTION add_product_image(
    p_producto_id INTEGER,
    p_url_imagen VARCHAR(500),
    p_descripcion_alt VARCHAR(200) DEFAULT NULL,
    p_es_principal BOOLEAN DEFAULT FALSE,
    p_orden INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
    v_imagen_id INTEGER;
BEGIN
    -- Si es la imagen principal, marcar otras como no principales
    IF p_es_principal THEN
        UPDATE IMAGEN_PRODUCTO 
        SET es_principal = FALSE 
        WHERE producto_id = p_producto_id;
    END IF;
    
    -- Insertar nueva imagen
    INSERT INTO IMAGEN_PRODUCTO (
        producto_id,
        url_imagen,
        descripcion_alt,
        es_principal,
        orden,
        fecha_subida
    ) VALUES (
        p_producto_id,
        p_url_imagen,
        p_descripcion_alt,
        p_es_principal,
        p_orden,
        NOW()
    ) RETURNING imagen_id INTO v_imagen_id;
    
    RETURN v_imagen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_imagen_producto_producto_id ON IMAGEN_PRODUCTO(producto_id);
CREATE INDEX IF NOT EXISTS idx_imagen_producto_principal ON IMAGEN_PRODUCTO(es_principal);
CREATE INDEX IF NOT EXISTS idx_imagen_producto_orden ON IMAGEN_PRODUCTO(orden);

-- Comentarios
COMMENT ON FUNCTION get_product_images IS 'Función para obtener imágenes de un producto específico';
COMMENT ON FUNCTION add_product_image IS 'Función para agregar una imagen a un producto';
