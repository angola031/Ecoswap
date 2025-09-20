-- =============================================
-- CONFIGURACIÓN DE SUPABASE AUTH PARA ECOSWAP
-- =============================================

-- 1. Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Crear perfil en la tabla USUARIO cuando se registra un nuevo usuario
  INSERT INTO public.USUARIO (
    user_id,
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
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    '',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    NULL, -- No necesitamos hash porque Supabase Auth maneja las contraseñas
    NULL,
    NULL,
    NULL,
    0.00,
    0,
    0,
    NEW.email_confirmed_at IS NOT NULL, -- Verificado si el email está confirmado
    true,
    NOW()
  );

  -- Crear ubicación principal si se proporciona
  IF NEW.raw_user_meta_data->>'location' IS NOT NULL THEN
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
      NEW.id,
      'Colombia',
      SPLIT_PART(NEW.raw_user_meta_data->>'location', ', ', 2),
      SPLIT_PART(NEW.raw_user_meta_data->>'location', ', ', 1),
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
    NEW.id,
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

-- 2. Crear trigger para ejecutar la función cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Función para actualizar el estado de verificación cuando se confirma el email
CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS trigger AS $$
BEGIN
  -- Actualizar el estado de verificación en la tabla USUARIO
  UPDATE public.USUARIO 
  SET verificado = (NEW.email_confirmed_at IS NOT NULL)
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para actualizar verificación
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE PROCEDURE public.handle_user_verification();

-- 5. Función para actualizar última conexión
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  -- Actualizar última conexión
  UPDATE public.USUARIO 
  SET ultima_conexion = NOW()
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Crear trigger para actualizar última conexión
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE PROCEDURE public.handle_user_login();

-- 7. Función para manejar eliminación de usuarios
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS trigger AS $$
BEGIN
  -- Marcar como inactivo en lugar de eliminar
  UPDATE public.USUARIO 
  SET activo = false
  WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para manejar eliminación
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deletion();

-- =============================================
-- CONFIGURACIÓN DE RLS PARA AUTH
-- =============================================

-- Permitir que los usuarios vean su propia información
CREATE POLICY "Users can view own profile" ON public.USUARIO
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON public.USUARIO
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Permitir que los usuarios vean perfiles públicos
CREATE POLICY "Public profiles are visible" ON public.USUARIO
FOR SELECT USING (perfil_publico = true AND activo = true);

-- Permitir que los usuarios vean su propia configuración
CREATE POLICY "Users can view own config" ON public.CONFIGURACION_USUARIO
FOR SELECT USING (auth.uid()::text = usuario_id::text);

-- Permitir que los usuarios actualicen su propia configuración
CREATE POLICY "Users can update own config" ON public.CONFIGURACION_USUARIO
FOR UPDATE USING (auth.uid()::text = usuario_id::text);

-- Permitir que los usuarios vean su propia ubicación
CREATE POLICY "Users can view own location" ON public.UBICACION
FOR SELECT USING (auth.uid()::text = user_id::text);

-- Permitir que los usuarios actualicen su propia ubicación
CREATE POLICY "Users can update own location" ON public.UBICACION
FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- CONFIGURACIÓN DE EMAIL
-- =============================================

-- Configurar URL de redirección para desarrollo
-- (Esto se hace en el dashboard de Supabase, no en SQL)
-- Site URL: http://localhost:3000
-- Redirect URLs: 
--   - http://localhost:3000/verificacion
--   - http://localhost:3000/auth/callback

-- =============================================
-- CONFIGURACIÓN DE SEGURIDAD
-- =============================================

-- Configurar políticas de seguridad adicionales
ALTER TABLE public.USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.UBICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.CONFIGURACION_USUARIO ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuario_email ON public.USUARIO(email);

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_usuario_user_id ON public.USUARIO(user_id);

-- Índice para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_ubicacion_user_id ON public.UBICACION(user_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_ciudad ON public.UBICACION(ciudad);

-- Índice para configuración
CREATE INDEX IF NOT EXISTS idx_config_usuario_id ON public.CONFIGURACION_USUARIO(usuario_id);
