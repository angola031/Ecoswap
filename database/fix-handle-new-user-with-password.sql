-- SOLUCIÓN: Arreglar la función handle_new_user para manejar password_hash correctamente

-- 1. Ver la función actual (para referencia)
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';

-- 2. Crear/Reemplazar la función con la versión corregida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insertar en la tabla usuario con todos los campos requeridos
  INSERT INTO public.usuario (
    auth_user_id,
    nombre,
    apellido,
    email,
    password_hash,  -- Campo requerido que estaba causando el error
    telefono,
    fecha_nacimiento,
    biografia,
    foto_perfil,
    calificacion_promedio,
    total_intercambios,
    eco_puntos,
    verificado,
    activo,
    ultima_conexion
  )
  VALUES (
    NEW.id,  -- ID del usuario de Supabase Auth
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'EcoSwap'),
    NEW.email,
    'supabase_auth',  -- Marcador para usuarios de Supabase Auth
    NEW.raw_user_meta_data->>'phone',
    NULL,  -- fecha_nacimiento
    NULL,  -- biografia
    NULL,  -- foto_perfil
    0.00,  -- calificacion_promedio
    0,     -- total_intercambios
    0,     -- eco_puntos
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true,  -- activo
    NOW()  -- ultima_conexion
  );
  
  -- Crear ubicación por defecto si se proporciona en metadata
  IF NEW.raw_user_meta_data->>'location' IS NOT NULL THEN
    INSERT INTO public.ubicacion (
      user_id,
      pais,
      departamento,
      ciudad,
      es_principal
    )
    VALUES (
      (SELECT user_id FROM public.usuario WHERE auth_user_id = NEW.id),
      'Colombia',
      SPLIT_PART(NEW.raw_user_meta_data->>'location', ', ', 2),
      SPLIT_PART(NEW.raw_user_meta_data->>'location', ', ', 1),
      true
    );
  END IF;
  
  -- Crear configuración por defecto
  INSERT INTO public.configuracion_usuario (
    usuario_id,
    notif_nuevas_propuestas,
    notif_mensajes,
    notif_actualizaciones,
    notif_newsletter,
    perfil_publico,
    mostrar_ubicacion_exacta,
    mostrar_telefono,
    recibir_mensajes_desconocidos,
    distancia_maxima_km
  )
  VALUES (
    (SELECT user_id FROM public.usuario WHERE auth_user_id = NEW.id),
    true,   -- notif_nuevas_propuestas
    true,   -- notif_mensajes
    false,  -- notif_actualizaciones
    true,   -- notif_newsletter
    true,   -- perfil_publico
    false,  -- mostrar_ubicacion_exacta
    false,  -- mostrar_telefono
    true,   -- recibir_mensajes_desconocidos
    50      -- distancia_maxima_km
  );
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log del error pero no fallar la inserción del usuario en auth.users
    RAISE LOG 'Error en handle_new_user para usuario %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar que la función se creó correctamente
SELECT 
    p.proname as function_name,
    CASE 
        WHEN p.prosrc IS NULL THEN 'FUNCIÓN SIN CÓDIGO'
        WHEN p.prosrc = '' THEN 'FUNCIÓN VACÍA'
        ELSE 'FUNCIÓN ACTUALIZADA (' || length(p.prosrc) || ' caracteres)'
    END as estado
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'handle_new_user';


