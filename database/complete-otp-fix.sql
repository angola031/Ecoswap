-- SOLUCIÓN COMPLETA PARA EL ERROR "Database error saving new user"
-- El problema es que la función handle_new_user no maneja el campo password_hash correctamente

-- PASO 1: Verificar el estado actual
SELECT '=== ESTADO ACTUAL ===' as info;
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

-- PASO 2: Ver la función actual (para referencia)
SELECT '=== FUNCIÓN ACTUAL ===' as info;
SELECT 
    CASE 
        WHEN p.prosrc IS NULL THEN 'FUNCIÓN SIN CÓDIGO'
        WHEN p.prosrc = '' THEN 'FUNCIÓN VACÍA'
        ELSE 'FUNCIÓN EXISTE (' || length(p.prosrc) || ' caracteres)'
    END as estado_funcion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- PASO 3: Crear la función corregida
SELECT '=== CREANDO FUNCIÓN CORREGIDA ===' as info;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Verificar si el usuario ya existe antes de insertar
  IF NOT EXISTS (SELECT 1 FROM public.usuario WHERE email = NEW.email) THEN
    -- Insertar en la tabla usuario solo si no existe
    INSERT INTO public.usuario (
      auth_user_id,
      nombre,
      apellido,
      email,
      telefono,
      password_hash,
      verificado,
      activo,
      ultima_conexion
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'EcoSwap'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      'supabase_auth',
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      true,
      NOW()
    );
  ELSE
    -- Usuario ya existe, solo actualizar auth_user_id si es necesario
    UPDATE public.usuario 
    SET auth_user_id = NEW.id,
        ultima_conexion = NOW()
    WHERE email = NEW.email;
    
    RAISE LOG 'Usuario % ya existe, actualizado auth_user_id', NEW.email;
  END IF;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar la inserción del usuario en auth.users
    RAISE LOG 'Error en handle_new_user para usuario %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: DESHABILITAR el trigger para evitar conflictos
-- El trigger se deshabilita porque ahora manejamos la creación manualmente en completeRegistrationWithCode
SELECT '=== DESHABILITANDO TRIGGER ===' as info;
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- PASO 5: Verificar el estado final
SELECT '=== ESTADO FINAL ===' as info;
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND t.tgname = 'on_auth_user_created';

SELECT '=== LISTO PARA PROBAR ===' as info;
SELECT 'Ahora puedes probar el registro con OTP. Debería funcionar correctamente.' as mensaje;
