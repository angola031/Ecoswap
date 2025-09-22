-- =============================================
-- CONFIGURAR USUARIO ADMINISTRADOR
-- =============================================

-- Función para crear o actualizar un usuario administrador
CREATE OR REPLACE FUNCTION setup_admin_user(
    p_email TEXT,
    p_nombre TEXT DEFAULT 'Administrador',
    p_apellido TEXT DEFAULT 'Sistema'
) RETURNS TABLE (
    user_id INTEGER,
    email TEXT,
    es_admin BOOLEAN,
    action TEXT
) AS $$
DECLARE
    v_user_id INTEGER;
    v_auth_user_id UUID;
BEGIN
    -- Buscar si ya existe un usuario con este email
    SELECT u.user_id INTO v_user_id
    FROM USUARIO u
    WHERE u.email = p_email;

    -- Buscar el auth_user_id correspondiente
    SELECT au.id INTO v_auth_user_id
    FROM auth.users au
    WHERE au.email = p_email;

    IF v_user_id IS NULL THEN
        -- Crear nuevo usuario administrador
        INSERT INTO USUARIO (
            auth_user_id,
            nombre,
            apellido,
            email,
            password_hash,
            es_admin,
            verificado,
            activo,
            fecha_registro
        ) VALUES (
            v_auth_user_id,
            p_nombre,
            p_apellido,
            p_email,
            '', -- Password manejado por Supabase
            true,
            true,
            true,
            NOW()
        ) RETURNING user_id INTO v_user_id;
        
        RETURN QUERY SELECT v_user_id, p_email, true, 'CREATED'::TEXT;
    ELSE
        -- Actualizar usuario existente como administrador
        UPDATE USUARIO 
        SET 
            es_admin = true,
            verificado = true,
            activo = true,
            auth_user_id = COALESCE(auth_user_id, v_auth_user_id)
        WHERE user_id = v_user_id;
        
        RETURN QUERY SELECT v_user_id, p_email, true, 'UPDATED'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejemplo de uso: Configurar administrador
-- SELECT * FROM setup_admin_user('tu_email@ejemplo.com', 'Tu Nombre', 'Tu Apellido');

-- Verificar usuarios administradores
SELECT 
    u.user_id,
    u.email,
    u.nombre,
    u.apellido,
    u.es_admin,
    u.verificado,
    u.activo,
    u.auth_user_id,
    CASE 
        WHEN u.auth_user_id IS NOT NULL THEN 'Conectado'
        ELSE 'No conectado'
    END as estado_auth
FROM USUARIO u
WHERE u.es_admin = true
ORDER BY u.fecha_registro DESC;

-- Verificar usuarios en auth.users
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.role
FROM auth.users au
ORDER BY au.created_at DESC;

-- Comentarios para documentación
COMMENT ON FUNCTION setup_admin_user IS 'Función para crear o actualizar un usuario como administrador';

-- Mostrar instrucciones
SELECT 'Ejecuta: SELECT * FROM setup_admin_user(''tu_email@ejemplo.com'', ''Tu Nombre'', ''Tu Apellido'');' as instrucciones;
