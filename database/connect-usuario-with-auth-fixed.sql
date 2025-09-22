-- =============================================
-- CONECTAR TABLA USUARIO CON SUPABASE AUTH (CORREGIDO)
-- =============================================

-- Agregar columna auth_user_id a la tabla USUARIO
ALTER TABLE USUARIO 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_auth_user_id ON USUARIO(auth_user_id);

-- Crear función para sincronizar usuarios de Auth con tabla USUARIO
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Buscar si ya existe un usuario con este email
    IF EXISTS (SELECT 1 FROM USUARIO WHERE email = NEW.email) THEN
        -- Actualizar el auth_user_id del usuario existente
        UPDATE USUARIO 
        SET auth_user_id = NEW.id
        WHERE email = NEW.email;
    ELSE
        -- Crear nuevo usuario en la tabla USUARIO
        INSERT INTO USUARIO (
            auth_user_id,
            nombre,
            apellido,
            email,
            password_hash, -- Se puede dejar vacío ya que Supabase maneja la autenticación
            fecha_registro,
            verificado,
            activo
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'apellido', 'Sin apellido'),
            NEW.email,
            '', -- Password manejado por Supabase
            NEW.created_at,
            NEW.email_confirmed_at IS NOT NULL,
            true
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para obtener usuario actual desde auth
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
    user_id INTEGER,
    auth_user_id UUID,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    email VARCHAR(100),
    verificado BOOLEAN,
    es_admin BOOLEAN,
    roles TEXT[]
) AS $$
DECLARE
    current_auth_id UUID;
BEGIN
    -- Obtener el ID del usuario autenticado
    current_auth_id := auth.uid();
    
    IF current_auth_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        u.user_id,
        u.auth_user_id,
        u.nombre,
        u.apellido,
        u.email,
        u.verificado,
        u.es_admin,
        ARRAY(
            SELECT r.nombre 
            FROM USUARIO_ROL ur
            JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = u.user_id 
            AND ur.activo = true
        ) as roles
    FROM USUARIO u
    WHERE u.auth_user_id = current_auth_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CORREGIR: Actualizar políticas RLS para evitar comparación integer = uuid
DROP POLICY IF EXISTS "Productos aprobados son visibles" ON PRODUCTO;
CREATE POLICY "Productos aprobados son visibles" ON PRODUCTO
FOR SELECT USING (estado_validacion = 'approved' AND estado_publicacion = 'activo');

-- Permitir a usuarios crear productos
DROP POLICY IF EXISTS "Usuarios pueden crear productos" ON PRODUCTO;
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- CORREGIR: Usar subquery para evitar comparación directa integer = uuid
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus productos pendientes" ON PRODUCTO;
CREATE POLICY "Usuarios pueden actualizar sus productos pendientes" ON PRODUCTO
FOR UPDATE USING (
    estado_validacion = 'pending' AND
    EXISTS (
        SELECT 1 FROM USUARIO u 
        WHERE u.user_id = PRODUCTO.user_id 
        AND u.auth_user_id = auth.uid()
    )
);

-- CORREGIR: Política para administradores usando subquery
DROP POLICY IF EXISTS "Administradores pueden validar productos" ON PRODUCTO;
CREATE POLICY "Administradores pueden validar productos" ON PRODUCTO
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM USUARIO u
        WHERE u.auth_user_id = auth.uid()
        AND (
            u.es_admin = true 
            OR EXISTS (
                SELECT 1 FROM USUARIO_ROL ur
                JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id
                WHERE ur.usuario_id = u.user_id
                AND r.nombre IN ('super_admin', 'admin_soporte', 'admin_validacion')
                AND ur.activo = true
            )
        )
    )
);

-- Actualizar función de validación para usar auth.uid()
CREATE OR REPLACE FUNCTION validate_product(
    p_producto_id INTEGER,
    p_estado_validacion VARCHAR(20),
    p_comentarios TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_admin_user_id INTEGER;
    current_auth_id UUID;
BEGIN
    -- Obtener el ID del usuario autenticado
    current_auth_id := auth.uid();
    
    IF current_auth_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;
    
    -- Buscar el usuario administrador
    SELECT u.user_id INTO v_admin_user_id
    FROM USUARIO u
    WHERE u.auth_user_id = current_auth_id
    AND (
        u.es_admin = true 
        OR EXISTS (
            SELECT 1 FROM USUARIO_ROL ur
            JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id
            WHERE ur.usuario_id = u.user_id
            AND r.nombre IN ('super_admin', 'admin_soporte', 'admin_validacion')
            AND ur.activo = true
        )
    );

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

-- Función para sincronizar usuarios existentes (ejecutar manualmente)
CREATE OR REPLACE FUNCTION sync_existing_auth_users()
RETURNS TABLE (
    auth_id UUID,
    email TEXT,
    action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        CASE 
            WHEN u.user_id IS NULL THEN 'CREATED'
            ELSE 'UPDATED'
        END as action
    FROM auth.users au
    LEFT JOIN USUARIO u ON au.email = u.email
    WHERE au.email IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON COLUMN USUARIO.auth_user_id IS 'UUID del usuario en Supabase Auth';
COMMENT ON FUNCTION handle_new_user IS 'Trigger que sincroniza usuarios de Auth con tabla USUARIO';
COMMENT ON FUNCTION get_current_user IS 'Función para obtener información del usuario autenticado';
COMMENT ON FUNCTION sync_existing_auth_users IS 'Función para sincronizar usuarios existentes de Auth';

-- Mostrar instrucciones
SELECT 'Ejecuta SELECT * FROM sync_existing_auth_users(); para sincronizar usuarios existentes' as instrucciones;
