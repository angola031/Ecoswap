-- =============================================
-- CREAR SOLO LAS TABLAS DE ROLES (SIN ASIGNAR ROLES)
-- =============================================

-- 1. Crear tabla de roles de usuario
CREATE TABLE IF NOT EXISTS ROL_USUARIO (
    rol_id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de asignación de roles a usuarios
CREATE TABLE IF NOT EXISTS USUARIO_ROL (
    usuario_rol_id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES USUARIO(user_id) ON DELETE CASCADE,
    rol_id INTEGER REFERENCES ROL_USUARIO(rol_id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    asignado_por INTEGER REFERENCES USUARIO(user_id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, rol_id)
);

-- 3. Insertar roles predefinidos
INSERT INTO ROL_USUARIO (nombre, descripcion, permisos) VALUES
('super_admin', 'Super Administrador', '["gestionar_usuarios", "gestionar_admins", "gestionar_reportes", "gestionar_verificaciones", "acceso_total"]'),
('admin_validacion', 'Administrador de Validaciones', '["gestionar_verificaciones", "aprobar_usuarios", "rechazar_usuarios"]'),
('admin_soporte', 'Administrador de Soporte', '["gestionar_reportes", "responder_chats", "gestionar_quejas"]'),
('moderador', 'Moderador', '["gestionar_reportes", "responder_chats"]')
ON CONFLICT (nombre) DO NOTHING;

-- 4. Habilitar RLS en las nuevas tablas
ALTER TABLE ROL_USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE USUARIO_ROL ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS para ROL_USUARIO
CREATE POLICY "Roles son visibles para todos" ON ROL_USUARIO
FOR SELECT USING (activo = true);

-- 6. Crear políticas RLS para USUARIO_ROL
CREATE POLICY "Roles de usuario son visibles para admins" ON USUARIO_ROL
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM USUARIO u 
        WHERE u.user_id = usuario_id 
        AND (u.es_admin = true OR u.email = auth.jwt() ->> 'email')
    )
);

-- 7. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuario_rol_usuario_id ON USUARIO_ROL(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_rol_id ON USUARIO_ROL(rol_id);
CREATE INDEX IF NOT EXISTS idx_usuario_rol_activo ON USUARIO_ROL(activo);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_nombre ON ROL_USUARIO(nombre);
CREATE INDEX IF NOT EXISTS idx_rol_usuario_activo ON ROL_USUARIO(activo);

-- 8. Verificar que las tablas se crearon correctamente
SELECT 'Tablas creadas exitosamente' as resultado;

-- 9. Mostrar los roles disponibles
SELECT rol_id, nombre, descripcion, activo
FROM ROL_USUARIO
ORDER BY nombre;



