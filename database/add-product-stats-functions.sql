-- =============================================
-- FUNCIONES PARA ESTADÍSTICAS DE PRODUCTOS
-- =============================================

-- Función para incrementar contador de vistas
CREATE OR REPLACE FUNCTION increment_product_views(p_producto_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Actualizar contador de vistas en la tabla producto
    UPDATE PRODUCTO 
    SET fecha_actualizacion = NOW()
    WHERE producto_id = p_producto_id;
    
    -- Insertar o actualizar estadística de vistas
    INSERT INTO ESTADISTICA_PRODUCTO (
        producto_id,
        tipo_estadistica,
        valor,
        fecha_registro
    ) VALUES (
        p_producto_id,
        'vista',
        1,
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de un producto
CREATE OR REPLACE FUNCTION get_product_stats(p_producto_id INTEGER)
RETURNS TABLE (
    total_vistas INTEGER,
    total_likes INTEGER,
    total_interacciones INTEGER,
    ultima_actividad TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN ep.tipo_estadistica = 'vista' THEN ep.valor ELSE 0 END), 0)::INTEGER as total_vistas,
        COALESCE(SUM(CASE WHEN ep.tipo_estadistica = 'like' THEN ep.valor ELSE 0 END), 0)::INTEGER as total_likes,
        COALESCE(SUM(ep.valor), 0)::INTEGER as total_interacciones,
        MAX(ep.fecha_registro) as ultima_actividad
    FROM ESTADISTICA_PRODUCTO ep
    WHERE ep.producto_id = p_producto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para agregar like a un producto
CREATE OR REPLACE FUNCTION add_product_like(p_producto_id INTEGER, p_usuario_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar si ya existe el like
    IF EXISTS (
        SELECT 1 FROM ESTADISTICA_PRODUCTO 
        WHERE producto_id = p_producto_id 
        AND tipo_estadistica = 'like'
        AND metadata->>'usuario_id' = p_usuario_id::TEXT
    ) THEN
        RETURN FALSE; -- Ya existe el like
    END IF;
    
    -- Insertar like
    INSERT INTO ESTADISTICA_PRODUCTO (
        producto_id,
        tipo_estadistica,
        valor,
        metadata,
        fecha_registro
    ) VALUES (
        p_producto_id,
        'like',
        1,
        json_build_object('usuario_id', p_usuario_id),
        NOW()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para remover like de un producto
CREATE OR REPLACE FUNCTION remove_product_like(p_producto_id INTEGER, p_usuario_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM ESTADISTICA_PRODUCTO 
    WHERE producto_id = p_producto_id 
    AND tipo_estadistica = 'like'
    AND metadata->>'usuario_id' = p_usuario_id::TEXT;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear tabla ESTADISTICA_PRODUCTO si no existe
CREATE TABLE IF NOT EXISTS ESTADISTICA_PRODUCTO (
    estadistica_id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES PRODUCTO(producto_id) ON DELETE CASCADE,
    tipo_estadistica VARCHAR(50) NOT NULL, -- 'vista', 'like', 'interaccion', etc.
    valor INTEGER DEFAULT 1,
    metadata JSONB, -- Para datos adicionales como usuario_id
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_estadistica_producto_id ON ESTADISTICA_PRODUCTO(producto_id);
CREATE INDEX IF NOT EXISTS idx_estadistica_tipo ON ESTADISTICA_PRODUCTO(tipo_estadistica);
CREATE INDEX IF NOT EXISTS idx_estadistica_fecha ON ESTADISTICA_PRODUCTO(fecha_registro);

-- Habilitar RLS
ALTER TABLE ESTADISTICA_PRODUCTO ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura de estadísticas
CREATE POLICY "Estadísticas son visibles" ON ESTADISTICA_PRODUCTO
FOR SELECT USING (true);

-- Política para permitir inserción de estadísticas
CREATE POLICY "Estadísticas pueden ser creadas" ON ESTADISTICA_PRODUCTO
FOR INSERT WITH CHECK (true);
