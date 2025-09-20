-- =============================================
-- ASIGNAR ROL DE SUPER ADMIN AL USUARIO ADMINISTRADOR
-- =============================================

-- Script simple para asignar el rol de Super Admin al usuario ecoswap03@gmail.com
-- Ejecutar este script después de haber creado las tablas ROL_USUARIO y USUARIO_ROL

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
    
    -- Verificar que ambos existen
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario ecoswap03@gmail.com no encontrado en la tabla USUARIO';
    END IF;
    
    IF super_admin_rol_id IS NULL THEN
        RAISE EXCEPTION 'Rol super_admin no encontrado en la tabla ROL_USUARIO';
    END IF;
    
    -- Asignar el rol de super_admin al usuario
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
    
    -- Mostrar información del usuario actualizado
    RAISE NOTICE 'Información del usuario:';
    RAISE NOTICE 'Email: ecoswap03@gmail.com';
    RAISE NOTICE 'Es Admin: %', (SELECT es_admin FROM USUARIO WHERE user_id = admin_user_id);
    RAISE NOTICE 'Admin desde: %', (SELECT admin_desde FROM USUARIO WHERE user_id = admin_user_id);
    RAISE NOTICE 'Rol asignado: Super Admin';
    
END $$;

-- Verificar la asignación
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



