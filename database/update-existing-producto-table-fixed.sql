-- =============================================
-- ACTUALIZACIÓN DE TABLA PRODUCTO EXISTENTE (CORREGIDO)
-- =============================================

-- Agregar columnas de validación a la tabla PRODUCTO existente
ALTER TABLE PRODUCTO 
ADD COLUMN IF NOT EXISTS estado_validacion VARCHAR(20) DEFAULT 'pending' CHECK (estado_validacion IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validado_por INTEGER REFERENCES USUARIO(user_id),
ADD COLUMN IF NOT EXISTS comentarios_validacion TEXT,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Actualizar fecha_creacion para productos existentes si es NULL
UPDATE PRODUCTO 
SET fecha_creacion = fecha_publicacion 
WHERE fecha_creacion IS NULL;

-- Crear función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_product_timestamp_trigger ON PRODUCTO;
CREATE TRIGGER update_product_timestamp_trigger
    BEFORE UPDATE ON PRODUCTO
    FOR EACH ROW
    EXECUTE FUNCTION update_product_timestamp();

-- Actualizar políticas RLS existentes
DROP POLICY IF EXISTS "Productos activos son visibles" ON PRODUCTO;
CREATE POLICY "Productos aprobados son visibles" ON PRODUCTO
FOR SELECT USING (estado_validacion = 'approved' AND estado_publicacion = 'activo');

-- Permitir a usuarios crear productos (pero con estado pending)
DROP POLICY IF EXISTS "Usuarios pueden crear productos" ON PRODUCTO;
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir a usuarios actualizar sus propios productos (solo si no están aprobados)
-- NOTA: Política simple para productos pendientes (se actualizará cuando se conecte Auth)
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus productos" ON PRODUCTO;
CREATE POLICY "Usuarios pueden actualizar sus productos pendientes" ON PRODUCTO
FOR UPDATE USING (estado_validacion = 'pending');

-- Crear política para administradores (se actualizará cuando se conecte Auth)
-- Por ahora, permitir actualización a todos (se restringirá después)
CREATE POLICY "Administradores pueden validar productos" ON PRODUCTO
FOR UPDATE USING (true); -- Temporalmente permitir a todos

-- Función para validar producto (adaptada para tu esquema)
CREATE OR REPLACE FUNCTION validate_product(
    p_producto_id INTEGER,
    p_estado_validacion VARCHAR(20),
    p_comentarios TEXT DEFAULT NULL,
    p_admin_user_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_user_id INTEGER;
BEGIN
    -- Si se proporciona el admin_user_id, usarlo directamente
    IF p_admin_user_id IS NOT NULL THEN
        v_admin_user_id := p_admin_user_id;
    ELSE
        -- Intentar obtener el admin actual (esto puede necesitar ajuste según tu sistema de auth)
        SELECT u.user_id INTO v_admin_user_id
        FROM USUARIO u
        JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id
        JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id
        WHERE u.es_admin = true  -- Usar tu campo es_admin
        AND ur.activo = true
        LIMIT 1;
    END IF;

    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autorizado para validar productos';
    END IF;

    -- Actualizar el producto
    UPDATE PRODUCTO 
    SET 
        estado_validacion = p_estado_validacion,
        fecha_validacion = NOW(),
        validado_por = v_admin_user_id,
        comentarios_validacion = p_comentarios,
        fecha_actualizacion = NOW()
    WHERE producto_id = p_producto_id;

    -- Crear notificación para el usuario propietario del producto
    INSERT INTO NOTIFICACION (
        usuario_id,
        tipo,
        titulo,
        mensaje,
        fecha_creacion,
        leida
    )
    SELECT 
        p.user_id,
        'product_validation',
        CASE 
            WHEN p_estado_validacion = 'approved' THEN 'Producto Aprobado'
            ELSE 'Producto Rechazado'
        END,
        CASE 
            WHEN p_estado_validacion = 'approved' THEN 'Tu producto "' || p.titulo || '" ha sido aprobado y publicado en la plataforma.'
            ELSE 'Tu producto "' || p.titulo || '" ha sido rechazado. ' || COALESCE(p_comentarios, '')
        END,
        NOW(),
        false
    FROM PRODUCTO p
    WHERE p.producto_id = p_producto_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener productos pendientes de validación
CREATE OR REPLACE FUNCTION get_pending_products()
RETURNS TABLE (
    producto_id INTEGER,
    titulo VARCHAR(100),
    descripcion TEXT,
    precio DECIMAL(12,2),
    estado VARCHAR(20),
    tipo_transaccion VARCHAR(20),
    fecha_creacion TIMESTAMP WITH TIME ZONE,
    user_id INTEGER,
    usuario_nombre VARCHAR(50),
    usuario_apellido VARCHAR(50),
    usuario_email VARCHAR(100),
    categoria_nombre VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.producto_id,
        p.titulo,
        p.descripcion,
        p.precio,
        p.estado,
        p.tipo_transaccion,
        p.fecha_creacion,
        p.user_id,
        u.nombre,
        u.apellido,
        u.email,
        c.nombre as categoria_nombre
    FROM PRODUCTO p
    LEFT JOIN USUARIO u ON p.user_id = u.user_id
    LEFT JOIN CATEGORIA c ON p.categoria_id = c.categoria_id
    WHERE p.estado_validacion = 'pending'
    ORDER BY p.fecha_creacion ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear vista para productos públicos (solo aprobados)
CREATE OR REPLACE VIEW PRODUCTOS_PUBLICOS AS
SELECT 
    p.producto_id,
    p.titulo,
    p.descripcion,
    p.precio,
    p.estado,
    p.tipo_transaccion,
    p.precio_negociable,
    p.condiciones_intercambio,
    p.que_busco_cambio,
    p.fecha_creacion,
    p.fecha_actualizacion,
    p.fecha_publicacion,
    u.user_id,
    u.nombre as usuario_nombre,
    u.apellido as usuario_apellido,
    u.foto_perfil as usuario_foto,
    u.calificacion_promedio as usuario_calificacion,
    u.total_intercambios as usuario_total_intercambios,
    c.nombre as categoria_nombre,
    ub.ciudad,
    ub.departamento
FROM PRODUCTO p
LEFT JOIN USUARIO u ON p.user_id = u.user_id
LEFT JOIN CATEGORIA c ON p.categoria_id = c.categoria_id
LEFT JOIN UBICACION ub ON u.user_id = ub.user_id AND ub.es_principal = true
WHERE p.estado_validacion = 'approved' 
AND p.estado_publicacion = 'activo'
AND u.activo = true;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_producto_estado_validacion ON PRODUCTO(estado_validacion);
CREATE INDEX IF NOT EXISTS idx_producto_fecha_creacion ON PRODUCTO(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_producto_validado_por ON PRODUCTO(validado_por);

-- Comentarios para documentación
COMMENT ON COLUMN PRODUCTO.estado_validacion IS 'Estado de validación del producto: pending, approved, rejected';
COMMENT ON COLUMN PRODUCTO.fecha_validacion IS 'Fecha y hora cuando el producto fue validado';
COMMENT ON COLUMN PRODUCTO.validado_por IS 'ID del usuario administrador que validó el producto';
COMMENT ON COLUMN PRODUCTO.comentarios_validacion IS 'Comentarios del administrador sobre la validación';
COMMENT ON FUNCTION validate_product IS 'Función para que administradores validen productos';
COMMENT ON FUNCTION get_pending_products IS 'Función para obtener productos pendientes de validación';
COMMENT ON VIEW PRODUCTOS_PUBLICOS IS 'Vista que muestra solo productos aprobados y públicos';

-- Actualizar productos existentes para que tengan estado 'approved' por defecto
-- (Solo si quieres que los productos existentes sean visibles inmediatamente)
UPDATE PRODUCTO 
SET estado_validacion = 'approved', 
    fecha_validacion = NOW()
WHERE estado_validacion = 'pending' 
AND estado_publicacion = 'activo';

-- Mostrar resumen de la actualización
SELECT 
    'Productos actualizados: ' || COUNT(*) as resumen
FROM PRODUCTO 
WHERE estado_validacion = 'approved';

-- Crear función para incrementar contador de vistas (adaptada para tu esquema)
CREATE OR REPLACE FUNCTION increment_product_views(p_producto_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Actualizar contador de vistas en la tabla producto
    UPDATE PRODUCTO 
    SET visualizaciones = visualizaciones + 1,
        fecha_actualizacion = NOW()
    WHERE producto_id = p_producto_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para obtener estadísticas de un producto (adaptada para tu esquema)
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
        COALESCE(p.visualizaciones, 0)::INTEGER as total_vistas,
        0::INTEGER as total_likes, -- Por ahora 0, se puede implementar después
        COALESCE(p.visualizaciones, 0)::INTEGER as total_interacciones,
        p.fecha_actualizacion as ultima_actividad
    FROM PRODUCTO p
    WHERE p.producto_id = p_producto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios adicionales
COMMENT ON FUNCTION increment_product_views IS 'Función para incrementar contador de vistas de productos';
COMMENT ON FUNCTION get_product_stats IS 'Función para obtener estadísticas de un producto';
