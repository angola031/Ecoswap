-- Script para arreglar la función handle_new_user
-- (Ejecutar después de ver el código de la función)

-- 1. Ver el código actual de la función
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 2. Posible solución: Crear una versión corregida de la función
-- (Reemplazar con la función corregida una vez que veamos el código)

/*
-- Ejemplo de función corregida (adaptar según el código actual):
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuario (
    auth_user_id,
    nombre,
    apellido,
    email,
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
    'supabase_auth',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true,
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar la inserción del usuario
    RAISE LOG 'Error en handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- 3. Para volver a habilitar el trigger después de arreglar la función:
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;



















