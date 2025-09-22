-- =============================================
-- SISTEMA DE VALIDACIÓN DE PRODUCTOS PARA ECOSWAP
-- =============================================

-- 1. Agregar campos de validación a la tabla PRODUCTO si no existen
ALTER TABLE PRODUCTO 
ADD COLUMN IF NOT EXISTS estado_validacion VARCHAR(20) DEFAULT 'pending' CHECK (estado_validacion IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validado_por INTEGER,
ADD COLUMN IF NOT EXISTS comentarios_validacion TEXT,
ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Crear función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para actualizar timestamp automáticamente
DROP TRIGGER IF EXISTS update_product_timestamp_trigger ON PRODUCTO;
CREATE TRIGGER update_product_timestamp_trigger
    BEFORE UPDATE ON PRODUCTO
    FOR EACH ROW
    EXECUTE FUNCTION update_product_timestamp();

-- 4. Actualizar políticas RLS para productos
DROP POLICY IF EXISTS "Productos activos son visibles" ON PRODUCTO;
CREATE POLICY "Productos aprobados son visibles" ON PRODUCTO
FOR SELECT USING (estado_validacion = 'approved' AND estado_publicacion = 'activo');

-- 5. Permitir a usuarios crear productos (pero con estado pending)
DROP POLICY IF EXISTS "Usuarios pueden crear productos" ON PRODUCTO;
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- 6. Permitir a usuarios actualizar sus propios productos (solo si no están aprobados)
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus productos" ON PRODUCTO;
CREATE POLICY "Usuarios pueden actualizar sus productos pendientes" ON PRODUCTO
FOR UPDATE USING (
    user_id = (
        SELECT user_id FROM USUARIO WHERE auth_user_id = auth.uid()
    ) AND estado_validacion = 'pending'
);

-- 7. Crear política para administradores
CREATE POLICY "Administradores pueden validar productos" ON PRODUCTO
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM USUARIO u
        JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id
        JOIN ROL r ON ur.rol_id = r.rol_id
        WHERE u.auth_user_id = auth.uid()
        AND r.nombre IN ('Administrador', 'Super Administrador')
        AND r.activo = true
    )
);

-- 8. Crear función para validar producto
CREATE OR REPLACE FUNCTION validate_product(
    p_producto_id INTEGER,
    p_estado_validacion VARCHAR(20),
    p_comentarios TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_user_id INTEGER;
BEGIN
    -- Obtener ID del administrador actual
    SELECT u.user_id INTO v_admin_user_id
    FROM USUARIO u
    JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id
    JOIN ROL r ON ur.rol_id = r.rol_id
    WHERE u.auth_user_id = auth.uid()
    AND r.nombre IN ('Administrador', 'Super Administrador')
    AND r.activo = true;

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

-- 9. Crear función para obtener productos pendientes de validación
CREATE OR REPLACE FUNCTION get_pending_products()
RETURNS TABLE (
    producto_id INTEGER,
    titulo VARCHAR(255),
    descripcion TEXT,
    precio DECIMAL(10,2),
    estado VARCHAR(50),
    tipo_transaccion VARCHAR(20),
    fecha_creacion TIMESTAMP WITH TIME ZONE,
    user_id INTEGER,
    usuario_nombre VARCHAR(100),
    usuario_apellido VARCHAR(100),
    usuario_email VARCHAR(255),
    categoria_nombre VARCHAR(100)
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

-- 10. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_producto_estado_validacion ON PRODUCTO(estado_validacion);
CREATE INDEX IF NOT EXISTS idx_producto_fecha_creacion ON PRODUCTO(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_producto_validado_por ON PRODUCTO(validado_por);

-- 11. Crear vista para productos públicos (solo aprobados)
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

-- 12. Comentarios para documentación
COMMENT ON COLUMN PRODUCTO.estado_validacion IS 'Estado de validación del producto: pending, approved, rejected';
COMMENT ON COLUMN PRODUCTO.fecha_validacion IS 'Fecha y hora cuando el producto fue validado';
COMMENT ON COLUMN PRODUCTO.validado_por IS 'ID del usuario administrador que validó el producto';
COMMENT ON COLUMN PRODUCTO.comentarios_validacion IS 'Comentarios del administrador sobre la validación';
COMMENT ON FUNCTION validate_product IS 'Función para que administradores validen productos';
COMMENT ON FUNCTION get_pending_products IS 'Función para obtener productos pendientes de validación';
COMMENT ON VIEW PRODUCTOS_PUBLICOS IS 'Vista que muestra solo productos aprobados y públicos';
