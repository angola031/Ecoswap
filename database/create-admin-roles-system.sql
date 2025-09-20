-- =============================================
-- SISTEMA DE ROLES DE ADMINISTRADOR PARA ECOSWAP
-- =============================================

-- 1. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS rol_usuario (
    rol_id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de asignación de roles a usuarios
CREATE TABLE IF NOT EXISTS usuario_rol (
    usuario_rol_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(user_id) ON DELETE CASCADE,
    rol_id INTEGER REFERENCES rol_usuario(rol_id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    asignado_por INTEGER REFERENCES usuario(user_id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, rol_id)
);

-- 3. Insertar roles predefinidos
INSERT INTO rol_usuario (nombre, descripcion, permisos) VALUES
('super_admin', 'Super Administrador', '["gestionar_usuarios", "gestionar_admins", "gestionar_reportes", "gestionar_verificaciones", "acceso_total"]'),
('admin_validacion', 'Administrador de Validaciones', '["gestionar_verificaciones", "aprobar_usuarios", "rechazar_usuarios"]'),
('admin_soporte', 'Administrador de Soporte', '["gestionar_reportes", "responder_chats", "gestionar_quejas"]'),
('moderador', 'Moderador', '["gestionar_reportes", "responder_chats"]')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Habilitar RLS en las nuevas tablas
ALTER TABLE rol_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_rol ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS para rol_usuario
CREATE POLICY "Roles son visibles para todos" ON rol_usuario
FOR SELECT USING (activo = true);

-- 6. Crear políticas RLS para usuario_rol
CREATE POLICY "Roles de usuario son visibles para admins" ON usuario_rol
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM usuario u 
        WHERE u.user_id = usuario_id 
        AND (u.es_admin = true OR u.email = auth.jwt() ->> 'email')
    )
);

-- 7. Función para verificar si un usuario es admin
CREATE OR REPLACE FUNCTION es_admin(usuario_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuario u
        LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
        LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
        WHERE u.email = usuario_email
        AND (u.es_admin = true OR r.nombre IN ('super_admin', 'admin_validacion', 'admin_soporte', 'moderador'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para verificar si un usuario es super admin
CREATE OR REPLACE FUNCTION es_super_admin(usuario_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuario u
        LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
        LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
        WHERE u.email = usuario_email
        AND r.nombre = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para obtener roles de un usuario
CREATE OR REPLACE FUNCTION obtener_roles_usuario(usuario_email TEXT)
RETURNS TABLE(rol_nombre TEXT, rol_descripcion TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT r.nombre::TEXT, r.descripcion::TEXT
    FROM usuario u
    LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
    LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
    WHERE u.email = usuario_email
    AND (u.es_admin = true OR r.nombre IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ASIGNAR ROL DE SUPER ADMIN AL USUARIO ADMINISTRADOR
-- =============================================

-- 10. Obtener el ID del rol super_admin
DO $$
DECLARE
    super_admin_rol_id INTEGER;
    admin_user_id INTEGER;
BEGIN
    -- Obtener el ID del rol super_admin
    SELECT rol_id INTO super_admin_rol_id
    FROM rol_usuario 
    WHERE nombre = 'super_admin';
    
    -- Obtener el ID del usuario administrador (ecoswap03@gmail.com)
    SELECT user_id INTO admin_user_id
    FROM usuario 
    WHERE email = 'ecoswap03@gmail.com';
    
    -- Si el usuario existe, asignarle el rol de super_admin
    IF admin_user_id IS NOT NULL AND super_admin_rol_id IS NOT NULL THEN
        -- Insertar o actualizar la asignación de rol
        INSERT INTO usuario_rol (usuario_id, rol_id, activo, asignado_por)
        VALUES (admin_user_id, super_admin_rol_id, true, admin_user_id)
        ON CONFLICT (usuario_id, rol_id) 
        DO UPDATE SET 
            activo = true,
            fecha_asignacion = CURRENT_TIMESTAMP,
            asignado_por = admin_user_id;
        
        -- También marcar como admin en la tabla usuario
        UPDATE usuario 
        SET es_admin = true, admin_desde = CURRENT_TIMESTAMP
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE 'Usuario ecoswap03@gmail.com asignado como Super Admin exitosamente';
    ELSE
        RAISE NOTICE 'Usuario ecoswap03@gmail.com no encontrado o rol super_admin no existe';
    END IF;
END $$;

-- =============================================
-- VERIFICACIÓN Y CONSULTAS ÚTILES
-- =============================================

-- 11. Consulta para verificar el rol del usuario administrador
SELECT 
    u.email,
    u.nombre,
    u.apellido,
    u.es_admin,
    u.admin_desde,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    ur.fecha_asignacion
FROM usuario u
LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
WHERE u.email = 'ecoswap03@gmail.com';

-- 12. Consulta para ver todos los roles disponibles
SELECT rol_id, nombre, descripcion, permisos, activo
FROM rol_usuario
ORDER BY nombre;

-- 13. Consulta para ver todos los usuarios con roles de admin
SELECT 
    u.email,
    u.nombre,
    u.apellido,
    u.es_admin,
    r.nombre as rol_nombre,
    ur.fecha_asignacion
FROM usuario u
LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
WHERE u.es_admin = true OR r.nombre IS NOT NULL
ORDER BY u.email;

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- 14. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_rol_usuario_id ON usuario_rol(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_rol_id ON usuario_rol(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_activo ON usuario_rol(activo);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_nombre ON rol_usuario(nombre);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_activo ON rol_usuario(activo);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_es_admin ON usuario(es_admin);
