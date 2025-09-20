-- =============================================
-- SOLUCIÓN PARA ERROR DE RELACIONES MÚLTIPLES EN USUARIO_ROL
-- =============================================

-- El problema es que la tabla usuario_rol tiene dos foreign keys hacia usuario:
-- 1. usuario_id -> usuario(user_id) 
-- 2. asignado_por -> usuario(user_id)

-- Esto causa el error: "Could not embed because more than one relationship was found for 'usuario' and 'usuario_rol'"

-- SOLUCIÓN 1: Renombrar las foreign keys para que sean más específicas
-- =============================================

-- 1. Eliminar las foreign keys existentes
ALTER TABLE usuario_rol DROP CONSTRAINT IF EXISTS usuario_rol_usuario_id_fkey;
ALTER TABLE usuario_rol DROP CONSTRAINT IF EXISTS usuario_rol_asignado_por_fkey;

-- 2. Recrear las foreign keys con nombres más específicos
ALTER TABLE usuario_rol 
ADD CONSTRAINT fk_usuario_rol_usuario 
FOREIGN KEY (usuario_id) REFERENCES usuario(user_id) ON DELETE CASCADE;

ALTER TABLE usuario_rol 
ADD CONSTRAINT fk_usuario_rol_asignado_por 
FOREIGN KEY (asignado_por) REFERENCES usuario(user_id) ON DELETE SET NULL;

-- 3. Verificar que las relaciones estén correctas
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='usuario_rol';

-- =============================================
-- SOLUCIÓN 2: Crear vistas para facilitar las consultas
-- =============================================

-- Vista para obtener usuarios con sus roles (relación principal)
CREATE OR REPLACE VIEW vista_usuario_roles AS
SELECT 
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.es_admin,
    u.admin_desde,
    r.rol_id,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    ur.activo as rol_activo,
    ur.fecha_asignacion,
    u_asignador.nombre as asignado_por_nombre,
    u_asignador.email as asignado_por_email
FROM usuario u
LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
LEFT JOIN usuario u_asignador ON ur.asignado_por = u_asignador.user_id
WHERE u.activo = true;

-- Vista para obtener roles con usuarios asignados
CREATE OR REPLACE VIEW vista_rol_usuarios AS
SELECT 
    r.rol_id,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    r.permisos,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    ur.fecha_asignacion,
    u_asignador.nombre as asignado_por_nombre
FROM rol_usuario r
LEFT JOIN usuario_rol ur ON r.rol_id = ur.rol_id AND ur.activo = true
LEFT JOIN usuario u ON ur.usuario_id = u.user_id AND u.activo = true
LEFT JOIN usuario u_asignador ON ur.asignado_por = u_asignador.user_id
WHERE r.activo = true;

-- =============================================
-- SOLUCIÓN 3: Funciones helper para consultas específicas
-- =============================================

-- Función para obtener usuario con roles (usando la relación principal)
CREATE OR REPLACE FUNCTION obtener_usuario_con_roles(usuario_email TEXT)
RETURNS TABLE(
    user_id INTEGER,
    nombre TEXT,
    apellido TEXT,
    email TEXT,
    es_admin BOOLEAN,
    admin_desde TIMESTAMP,
    roles JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.nombre::TEXT,
        u.apellido::TEXT,
        u.email::TEXT,
        u.es_admin,
        u.admin_desde,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'rol_id', r.rol_id,
                    'rol_nombre', r.nombre,
                    'rol_descripcion', r.descripcion,
                    'fecha_asignacion', ur.fecha_asignacion,
                    'asignado_por', u_asignador.nombre
                )
            ) FILTER (WHERE r.rol_id IS NOT NULL),
            '[]'::jsonb
        ) as roles
    FROM usuario u
    LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id AND ur.activo = true
    LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id AND r.activo = true
    LEFT JOIN usuario u_asignador ON ur.asignado_por = u_asignador.user_id
    WHERE u.email = usuario_email
    AND u.activo = true
    GROUP BY u.user_id, u.nombre, u.apellido, u.email, u.es_admin, u.admin_desde;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EJEMPLOS DE USO CON LAS NUEVAS RELACIONES
-- =============================================

-- Ejemplo 1: Obtener usuario con roles usando la vista
-- SELECT * FROM vista_usuario_roles WHERE email = 'ecoswap03@gmail.com';

-- Ejemplo 2: Obtener usuario con roles usando la función
-- SELECT * FROM obtener_usuario_con_roles('ecoswap03@gmail.com');

-- Ejemplo 3: Consulta directa especificando la relación
-- SELECT u.*, ur.*, r.*
-- FROM usuario u
-- LEFT JOIN usuario_rol ur ON u.user_id = ur.usuario_id
-- LEFT JOIN rol_usuario r ON ur.rol_id = r.rol_id
-- WHERE u.email = 'ecoswap03@gmail.com';

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que las foreign keys estén correctas
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
AND conrelid::regclass::text = 'usuario_rol';

-- Mostrar información de la tabla usuario_rol
\d usuario_rol;
