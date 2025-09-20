-- =============================================
-- CORRECCIONES AL ESQUEMA PARA SISTEMA DE ADMINISTRACIÓN
-- =============================================

-- 1. Agregar columnas de suspensión a USUARIO
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS motivo_suspension TEXT;
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS fecha_suspension TIMESTAMP;
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS fecha_desbloqueo TIMESTAMP;
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS suspendido_por INTEGER REFERENCES USUARIO(user_id);
ALTER TABLE USUARIO ADD COLUMN IF NOT EXISTS total_reportes INTEGER DEFAULT 0;

-- 2. Agregar columna es_admin a MENSAJE para chat con administradores
ALTER TABLE MENSAJE ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;

-- 3. Agregar columna es_admin a NOTIFICACION
ALTER TABLE NOTIFICACION ADD COLUMN IF NOT EXISTS es_admin BOOLEAN DEFAULT FALSE;

-- 4. Función para incrementar contador de reportes
CREATE OR REPLACE FUNCTION increment_user_reports(user_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE USUARIO 
    SET total_reportes = total_reportes + 1 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION es_admin(usuario_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM USUARIO u
        LEFT JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id AND ur.activo = true
        LEFT JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id AND r.activo = true
        WHERE u.email = usuario_email
        AND (u.es_admin = true OR r.nombre IN ('super_admin', 'admin_validacion', 'admin_soporte', 'moderador'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION es_super_admin(usuario_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM USUARIO u
        LEFT JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id AND ur.activo = true
        LEFT JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id AND r.activo = true
        WHERE u.email = usuario_email
        AND r.nombre = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para obtener roles de un usuario
CREATE OR REPLACE FUNCTION obtener_roles_usuario(usuario_email TEXT)
RETURNS TABLE(rol_nombre TEXT, rol_descripcion TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.nombre::TEXT, r.descripcion::TEXT
    FROM USUARIO u
    LEFT JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id AND ur.activo = true
    LEFT JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id AND r.activo = true
    WHERE u.email = usuario_email
    AND (u.es_admin = true OR r.nombre IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_usuario_es_admin ON USUARIO(es_admin);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_activo ON USUARIO_ROL(usuario_id, activo);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_nombre ON ROL_USUARIO(nombre);
CREATE INDEX IF NOT EXISTS idx_mensaje_es_admin ON MENSAJE(es_admin);
CREATE INDEX IF NOT EXISTS idx_notificacion_es_admin ON NOTIFICACION(es_admin);
CREATE INDEX IF NOT EXISTS idx_reporte_estado ON REPORTE(estado);
CREATE INDEX IF NOT EXISTS idx_reporte_fecha ON REPORTE(fecha_reporte);

-- 9. Políticas RLS para las nuevas funcionalidades
ALTER TABLE USUARIO_ROL ENABLE ROW LEVEL SECURITY;
ALTER TABLE ROL_USUARIO ENABLE ROW LEVEL SECURITY;

-- Política para ROL_USUARIO
CREATE POLICY "Roles son visibles para todos" ON ROL_USUARIO
FOR SELECT USING (activo = true);

-- Política para USUARIO_ROL
CREATE POLICY "Roles de usuario son visibles para admins" ON USUARIO_ROL
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM USUARIO u 
        WHERE u.user_id = usuario_id 
        AND (u.es_admin = true OR u.email = auth.jwt() ->> 'email')
    )
);

-- 10. Asignar rol de Super Admin al usuario ecoswap03@gmail.com
DO $$
DECLARE
    super_admin_rol_id INTEGER;
    admin_user_id INTEGER;
BEGIN
    -- Obtener el ID del rol super_admin
    SELECT rol_id INTO super_admin_rol_id
    FROM ROL_USUARIO 
    WHERE nombre = 'super_admin';
    
    -- Obtener el ID del usuario administrador
    SELECT user_id INTO admin_user_id
    FROM USUARIO 
    WHERE email = 'ecoswap03@gmail.com';
    
    -- Si ambos existen, asignar el rol
    IF admin_user_id IS NOT NULL AND super_admin_rol_id IS NOT NULL THEN
        -- Insertar o actualizar la asignación de rol
        INSERT INTO USUARIO_ROL (usuario_id, rol_id, activo, asignado_por)
        VALUES (admin_user_id, super_admin_rol_id, true, admin_user_id)
        ON CONFLICT (usuario_id, rol_id) 
        DO UPDATE SET 
            activo = true,
            fecha_asignacion = CURRENT_TIMESTAMP,
            asignado_por = admin_user_id;
        
        -- Marcar como admin en la tabla USUARIO
        UPDATE USUARIO 
        SET es_admin = true, admin_desde = CURRENT_TIMESTAMP
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE 'Usuario ecoswap03@gmail.com asignado como Super Admin exitosamente';
    ELSE
        RAISE NOTICE 'Usuario ecoswap03@gmail.com no encontrado o rol super_admin no existe';
    END IF;
END $$;

-- 11. Verificar la asignación
SELECT 
    u.email,
    u.nombre,
    u.apellido,
    u.es_admin,
    u.admin_desde,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    ur.fecha_asignacion
FROM USUARIO u
LEFT JOIN USUARIO_ROL ur ON u.user_id = ur.usuario_id AND ur.activo = true
LEFT JOIN ROL_USUARIO r ON ur.rol_id = r.rol_id AND r.activo = true
WHERE u.email = 'ecoswap03@gmail.com';
