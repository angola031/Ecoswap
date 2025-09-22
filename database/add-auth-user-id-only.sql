-- =============================================
-- AGREGAR SOLO LA COLUMNA auth_user_id A USUARIO
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

-- Función para sincronizar usuarios existentes
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
COMMENT ON FUNCTION sync_existing_auth_users IS 'Función para sincronizar usuarios existentes de Auth';

-- Verificar que la columna se agregó
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'USUARIO' 
AND column_name = 'auth_user_id';

-- Mostrar instrucciones
SELECT 'Ejecuta SELECT * FROM sync_existing_auth_users(); para sincronizar usuarios existentes' as instrucciones;
