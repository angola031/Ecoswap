-- =============================================
-- AJUSTES PARA INTEGRAR SUPABASE AUTH CON ECOSWAP
-- =============================================

-- 1. Modificar la tabla USUARIO para usar UUID de Supabase Auth
-- Primero, agregar la columna user_id como UUID
ALTER TABLE USUARIO ADD COLUMN auth_user_id UUID;

-- 2. Crear una función para generar un ID numérico único
CREATE OR REPLACE FUNCTION generate_user_id() RETURNS INTEGER AS $$
DECLARE
    new_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(user_id), 0) + 1 INTO new_id FROM USUARIO;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear función para manejar nuevos usuarios de Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_user_id INTEGER;
    user_name TEXT;
    user_phone TEXT;
    user_location TEXT;
BEGIN
    -- Generar un nuevo ID numérico
    new_user_id := generate_user_id();
    
    -- Extraer datos del metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario');
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_location := NEW.raw_user_meta_data->>'location';

    -- Crear perfil en la tabla USUARIO
    INSERT INTO public.USUARIO (
        user_id,
        auth_user_id,
        nombre,
        apellido,
        email,
        telefono,
        password_hash,
        fecha_nacimiento,
        biografia,
        foto_perfil,
        calificacion_promedio,
        total_intercambios,
        eco_puntos,
        verificado,
        activo,
        ultima_conexion
    ) VALUES (
        new_user_id,
        NEW.id,
        SPLIT_PART(user_name, ' ', 1),
        CASE 
            WHEN array_length(string_to_array(user_name, ' '), 1) > 1 
            THEN array_to_string(string_to_array(user_name, ' ')[2:], ' ')
            ELSE ''
        END,
        NEW.email,
        user_phone,
        NULL, -- No necesitamos hash porque Supabase Auth maneja las contraseñas
        NULL,
        NULL,
        NULL,
        0.00,
        0,
        0,
        NEW.email_confirmed_at IS NOT NULL,
        true,
        NOW()
    );

    -- Crear ubicación principal si se proporciona
    IF user_location IS NOT NULL THEN
        INSERT INTO public.UBICACION (
            user_id,
            pais,
            departamento,
            ciudad,
            barrio,
            latitud,
            longitud,
            es_principal
        ) VALUES (
            new_user_id,
            'Colombia',
            CASE 
                WHEN position(',' in user_location) > 0 
                THEN TRIM(SPLIT_PART(user_location, ',', 2))
                ELSE 'Colombia'
            END,
            CASE 
                WHEN position(',' in user_location) > 0 
                THEN TRIM(SPLIT_PART(user_location, ',', 1))
                ELSE user_location
            END,
            NULL,
            NULL,
            NULL,
            true
        );
    END IF;

    -- Crear configuración por defecto
    INSERT INTO public.CONFIGURACION_USUARIO (
        usuario_id,
        notif_nuevas_propuestas,
        notif_mensajes,
        notif_actualizaciones,
        notif_newsletter,
        perfil_publico,
        mostrar_ubicacion_exacta,
        mostrar_telefono,
        recibir_mensajes_desconocidos,
        distancia_maxima_km,
        categorias_interes
    ) VALUES (
        new_user_id,
        true,
        true,
        false,
        true,
        true,
        false,
        false,
        true,
        50,
        NULL
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Función para actualizar el estado de verificación
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger AS $$
BEGIN
    -- Actualizar el estado de verificación en la tabla USUARIO
    UPDATE public.USUARIO 
    SET verificado = (NEW.email_confirmed_at IS NOT NULL)
    WHERE auth_user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para actualizar verificación
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE PROCEDURE public.handle_user_verification();

-- 7. Función para actualizar última conexión
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
    -- Actualizar última conexión
    UPDATE public.USUARIO 
    SET ultima_conexion = NOW()
    WHERE auth_user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para actualizar última conexión
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE PROCEDURE public.handle_user_login();

-- 9. Función para manejar eliminación de usuarios
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger AS $$
BEGIN
    -- Marcar como inactivo en lugar de eliminar
    UPDATE public.USUARIO 
    SET activo = false
    WHERE auth_user_id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear trigger para manejar eliminación
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deletion();

-- =============================================
-- ACTUALIZAR POLÍTICAS RLS
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE UBICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE CATEGORIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRODUCTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE IMAGEN_PRODUCTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE INTERCAMBIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE CHAT ENABLE ROW LEVEL SECURITY;
ALTER TABLE MENSAJE ENABLE ROW LEVEL SECURITY;
ALTER TABLE CALIFICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE INSIGNIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE USUARIO_INSIGNIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE NOTIFICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE FAVORITO ENABLE ROW LEVEL SECURITY;
ALTER TABLE USUARIO_SEGUIDO ENABLE ROW LEVEL SECURITY;
ALTER TABLE REPORTE ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONFIGURACION_USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE HISTORIAL_PRECIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE ESTADISTICA_PRODUCTO ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO
-- =============================================

-- Permitir lectura de usuarios activos
CREATE POLICY "Usuarios activos son visibles" ON USUARIO
FOR SELECT USING (activo = true);

-- Permitir inserción de nuevos usuarios
CREATE POLICY "Cualquiera puede registrarse" ON USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización del propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil" ON USUARIO
FOR UPDATE USING (auth_user_id = auth.uid());

-- =============================================
-- POLÍTICAS PARA TABLA UBICACION
-- =============================================

-- Permitir lectura de ubicaciones
CREATE POLICY "Ubicaciones son visibles" ON UBICACION
FOR SELECT USING (true);

-- Permitir inserción de ubicaciones
CREATE POLICY "Cualquiera puede crear ubicaciones" ON UBICACION
FOR INSERT WITH CHECK (true);

-- Permitir actualización de ubicaciones
CREATE POLICY "Ubicaciones pueden ser actualizadas" ON UBICACION
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA CONFIGURACION_USUARIO
-- =============================================

-- Permitir lectura de configuración
CREATE POLICY "Configuración es visible" ON CONFIGURACION_USUARIO
FOR SELECT USING (true);

-- Permitir inserción de configuración
CREATE POLICY "Cualquiera puede crear configuración" ON CONFIGURACION_USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de configuración
CREATE POLICY "Configuración puede ser actualizada" ON CONFIGURACION_USUARIO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA CATEGORIA
-- =============================================

-- Permitir lectura de categorías activas
CREATE POLICY "Categorías activas son visibles" ON CATEGORIA
FOR SELECT USING (activa = true);

-- =============================================
-- POLÍTICAS PARA TABLA PRODUCTO
-- =============================================

-- Permitir lectura de productos activos
CREATE POLICY "Productos activos son visibles" ON PRODUCTO
FOR SELECT USING (estado_publicacion = 'activo');

-- Permitir inserción de productos
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de productos propios
CREATE POLICY "Usuarios pueden actualizar sus productos" ON PRODUCTO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA IMAGEN_PRODUCTO
-- =============================================

-- Permitir lectura de imágenes
CREATE POLICY "Imágenes son visibles" ON IMAGEN_PRODUCTO
FOR SELECT USING (true);

-- Permitir inserción de imágenes
CREATE POLICY "Imágenes pueden ser creadas" ON IMAGEN_PRODUCTO
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA INTERCAMBIO
-- =============================================

-- Permitir lectura de intercambios
CREATE POLICY "Intercambios son visibles" ON INTERCAMBIO
FOR SELECT USING (true);

-- Permitir inserción de intercambios
CREATE POLICY "Intercambios pueden ser creados" ON INTERCAMBIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de intercambios
CREATE POLICY "Intercambios pueden ser actualizados" ON INTERCAMBIO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA CHAT
-- =============================================

-- Permitir lectura de chats
CREATE POLICY "Chats son visibles" ON CHAT
FOR SELECT USING (true);

-- Permitir inserción de chats
CREATE POLICY "Chats pueden ser creados" ON CHAT
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA MENSAJE
-- =============================================

-- Permitir lectura de mensajes
CREATE POLICY "Mensajes son visibles" ON MENSAJE
FOR SELECT USING (true);

-- Permitir inserción de mensajes
CREATE POLICY "Mensajes pueden ser creados" ON MENSAJE
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA CALIFICACION
-- =============================================

-- Permitir lectura de calificaciones públicas
CREATE POLICY "Calificaciones públicas son visibles" ON CALIFICACION
FOR SELECT USING (es_publica = true);

-- Permitir inserción de calificaciones
CREATE POLICY "Calificaciones pueden ser creadas" ON CALIFICACION
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA INSIGNIA
-- =============================================

-- Permitir lectura de insignias activas
CREATE POLICY "Insignias activas son visibles" ON INSIGNIA
FOR SELECT USING (activa = true);

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO_INSIGNIA
-- =============================================

-- Permitir lectura de insignias de usuario
CREATE POLICY "Insignias de usuario son visibles" ON USUARIO_INSIGNIA
FOR SELECT USING (true);

-- Permitir inserción de insignias de usuario
CREATE POLICY "Insignias de usuario pueden ser creadas" ON USUARIO_INSIGNIA
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA NOTIFICACION
-- =============================================

-- Permitir lectura de notificaciones
CREATE POLICY "Notificaciones son visibles" ON NOTIFICACION
FOR SELECT USING (true);

-- Permitir inserción de notificaciones
CREATE POLICY "Notificaciones pueden ser creadas" ON NOTIFICACION
FOR INSERT WITH CHECK (true);

-- Permitir actualización de notificaciones
CREATE POLICY "Notificaciones pueden ser actualizadas" ON NOTIFICACION
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA FAVORITO
-- =============================================

-- Permitir lectura de favoritos
CREATE POLICY "Favoritos son visibles" ON FAVORITO
FOR SELECT USING (true);

-- Permitir inserción de favoritos
CREATE POLICY "Favoritos pueden ser creados" ON FAVORITO
FOR INSERT WITH CHECK (true);

-- Permitir eliminación de favoritos
CREATE POLICY "Favoritos pueden ser eliminados" ON FAVORITO
FOR DELETE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO_SEGUIDO
-- =============================================

-- Permitir lectura de seguimientos
CREATE POLICY "Seguimientos son visibles" ON USUARIO_SEGUIDO
FOR SELECT USING (true);

-- Permitir inserción de seguimientos
CREATE POLICY "Seguimientos pueden ser creados" ON USUARIO_SEGUIDO
FOR INSERT WITH CHECK (true);

-- Permitir eliminación de seguimientos
CREATE POLICY "Seguimientos pueden ser eliminados" ON USUARIO_SEGUIDO
FOR DELETE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA REPORTE
-- =============================================

-- Permitir lectura de reportes
CREATE POLICY "Reportes son visibles" ON REPORTE
FOR SELECT USING (true);

-- Permitir inserción de reportes
CREATE POLICY "Reportes pueden ser creados" ON REPORTE
FOR INSERT WITH CHECK (true);

-- Permitir actualización de reportes
CREATE POLICY "Reportes pueden ser actualizados" ON REPORTE
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA HISTORIAL_PRECIO
-- =============================================

-- Permitir lectura de historial de precios
CREATE POLICY "Historial de precios es visible" ON HISTORIAL_PRECIO
FOR SELECT USING (true);

-- Permitir inserción de historial de precios
CREATE POLICY "Historial de precios puede ser creado" ON HISTORIAL_PRECIO
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA ESTADISTICA_PRODUCTO
-- =============================================

-- Permitir lectura de estadísticas
CREATE POLICY "Estadísticas son visibles" ON ESTADISTICA_PRODUCTO
FOR SELECT USING (true);

-- Permitir inserción de estadísticas
CREATE POLICY "Estadísticas pueden ser creadas" ON ESTADISTICA_PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de estadísticas
CREATE POLICY "Estadísticas pueden ser actualizadas" ON ESTADISTICA_PRODUCTO
FOR UPDATE USING (true);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuario_email ON USUARIO(email);

-- Índice para búsquedas por auth_user_id
CREATE INDEX IF NOT EXISTS idx_usuario_auth_id ON USUARIO(auth_user_id);

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_usuario_user_id ON USUARIO(user_id);

-- Índice para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_ubicacion_user_id ON UBICACION(user_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_ciudad ON UBICACION(ciudad);

-- Índice para configuración
CREATE INDEX IF NOT EXISTS idx_config_usuario_id ON CONFIGURACION_USUARIO(usuario_id);

-- Índice para productos
CREATE INDEX IF NOT EXISTS idx_producto_user_id ON PRODUCTO(user_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON PRODUCTO(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_estado ON PRODUCTO(estado_publicacion);

-- Índice para intercambios
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_propone ON INTERCAMBIO(usuario_propone_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_recibe ON INTERCAMBIO(usuario_recibe_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_estado ON INTERCAMBIO(estado);
