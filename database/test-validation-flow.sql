-- Script completo para probar el flujo de validación
-- Este script simula exactamente lo que hace la API /api/intercambios/pending-validation

-- 1. Verificar el estado actual de la base de datos
SELECT '=== DIAGNÓSTICO COMPLETO DEL FLUJO DE VALIDACIÓN ===' as info;

-- 2. Verificar usuario 1
SELECT 
    'Usuario 1:' as seccion,
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE user_id = 1;

-- 3. Buscar intercambios para validación (simulando la API)
-- Esta es exactamente la consulta que hace /api/intercambios/pending-validation
SELECT 
    'Intercambios para validación (API query):' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    i.lugar_encuentro,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    CASE 
        WHEN i.usuario_propone_id = 1 THEN 'Usuario 1 propone'
        WHEN i.usuario_recibe_id = 1 THEN 'Usuario 1 recibe'
        ELSE 'Usuario 1 no involucrado'
    END AS rol_usuario_1,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        ELSE '❌ No puede validarse'
    END AS puede_validar
FROM public.intercambio i
WHERE (i.usuario_propone_id = 1 OR i.usuario_recibe_id = 1)
  AND i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.fecha_propuesta DESC;

-- 4. Si no hay resultados, mostrar todos los intercambios del usuario 1
SELECT 
    'Todos los intercambios del usuario 1:' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    CASE 
        WHEN i.usuario_propone_id = 1 THEN 'Usuario 1 propone'
        WHEN i.usuario_recibe_id = 1 THEN 'Usuario 1 recibe'
        ELSE 'Usuario 1 no involucrado'
    END AS rol_usuario_1,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        WHEN i.estado = 'aceptado' 
        THEN '⚠️ Aceptado pero no en progreso'
        WHEN i.estado = 'pendiente' 
        THEN '⚠️ Pendiente de aceptación'
        WHEN i.estado = 'completado' 
        THEN '✅ Ya completado'
        WHEN i.estado = 'fallido' 
        THEN '❌ Falló'
        ELSE '❓ Estado no reconocido'
    END AS estado_validacion
FROM public.intercambio i
WHERE i.usuario_propone_id = 1 OR i.usuario_recibe_id = 1
ORDER BY i.intercambio_id DESC;

-- 5. Configurar intercambios válidos dinámicamente (sin hardcodear IDs)
DO $$
DECLARE
    _usuario_1_id INTEGER := 1;
    _intercambio_record RECORD;
    _intercambios_configurados INTEGER := 0;
BEGIN
    RAISE NOTICE 'Configurando intercambios válidos para usuario %...', _usuario_1_id;
    
    -- Buscar todos los intercambios del usuario 1 que NO están en estado válido para validación
    FOR _intercambio_record IN 
        SELECT intercambio_id, estado, usuario_propone_id, usuario_recibe_id
        FROM public.intercambio 
        WHERE (usuario_propone_id = _usuario_1_id OR usuario_recibe_id = _usuario_1_id)
          AND estado NOT IN ('en_progreso', 'pendiente_validacion', 'completado', 'fallido')
        ORDER BY intercambio_id DESC
        LIMIT 3 -- Configurar máximo 3 intercambios para pruebas
    LOOP
        -- Actualizar intercambio existente a estado válido para validación
        UPDATE public.intercambio 
        SET 
            estado = 'pendiente_validacion',
            fecha_encuentro = NOW() - INTERVAL '1 hour',
            lugar_encuentro = 'Parque Principal, Centro de la ciudad',
            notas_encuentro = 'Intercambio configurado automáticamente para validación'
        WHERE intercambio_id = _intercambio_record.intercambio_id;
        
        -- Asegurar que existe un chat para este intercambio
        INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
        SELECT _intercambio_record.intercambio_id, NOW(), true
        WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = _intercambio_record.intercambio_id);
        
        -- Limpiar validaciones previas para este intercambio
        DELETE FROM public.validacion_intercambio WHERE intercambio_id = _intercambio_record.intercambio_id;
        
        _intercambios_configurados := _intercambios_configurados + 1;
        RAISE NOTICE 'Intercambio % configurado para validación (estado: % -> pendiente_validacion)', 
                     _intercambio_record.intercambio_id, _intercambio_record.estado;
    END LOOP;
    
    -- Si no hay intercambios existentes, crear uno nuevo dinámicamente
    IF _intercambios_configurados = 0 THEN
        RAISE NOTICE 'No hay intercambios existentes. Creando nuevo intercambio...';
        
        DECLARE
            _otro_usuario_id INTEGER;
            _producto_1_id INTEGER;
            _producto_2_id INTEGER;
            _nuevo_intercambio_id INTEGER;
        BEGIN
            -- Obtener otro usuario activo (cualquiera que no sea el usuario 1)
            SELECT user_id INTO _otro_usuario_id 
            FROM public.usuario 
            WHERE activo = true AND user_id != _usuario_1_id 
            ORDER BY user_id
            LIMIT 1;
            
            -- Obtener productos de ambos usuarios
            SELECT producto_id INTO _producto_1_id 
            FROM public.producto 
            WHERE user_id = _usuario_1_id AND estado_publicacion = 'activo' 
            ORDER BY producto_id
            LIMIT 1;
            
            SELECT producto_id INTO _producto_2_id 
            FROM public.producto 
            WHERE user_id = _otro_usuario_id AND estado_publicacion = 'activo' 
            ORDER BY producto_id
            LIMIT 1;
            
            -- Crear nuevo intercambio si tenemos todos los datos necesarios
            IF _otro_usuario_id IS NOT NULL AND _producto_1_id IS NOT NULL AND _producto_2_id IS NOT NULL THEN
                INSERT INTO public.intercambio (
                    producto_ofrecido_id,
                    producto_solicitado_id,
                    usuario_propone_id,
                    usuario_recibe_id,
                    mensaje_propuesta,
                    estado,
                    fecha_propuesta,
                    lugar_encuentro,
                    fecha_encuentro
                ) VALUES (
                    _producto_1_id,
                    _producto_2_id,
                    _usuario_1_id,
                    _otro_usuario_id,
                    'Intercambio creado automáticamente para validación',
                    'pendiente_validacion',
                    NOW() - INTERVAL '1 day',
                    'Parque Principal',
                    NOW() - INTERVAL '1 hour'
                ) RETURNING intercambio_id INTO _nuevo_intercambio_id;
                
                -- Crear chat para el nuevo intercambio
                INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
                VALUES (_nuevo_intercambio_id, NOW(), true);
                
                RAISE NOTICE 'Nuevo intercambio % creado para validación (usuario: %, otro: %, productos: % <-> %)', 
                             _nuevo_intercambio_id, _usuario_1_id, _otro_usuario_id, _producto_1_id, _producto_2_id;
                _intercambios_configurados := 1;
            ELSE
                RAISE NOTICE 'No se pudo crear intercambio: datos insuficientes (otro_usuario: %, producto_1: %, producto_2: %)', 
                             _otro_usuario_id, _producto_1_id, _producto_2_id;
            END IF;
        END;
    END IF;
    
    RAISE NOTICE 'Total de intercambios configurados para validación: %', _intercambios_configurados;
END $$;

-- 6. Verificar el estado final
SELECT 
    'Estado final - Intercambios para validación:' as seccion,
    i.intercambio_id,
    i.estado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.fecha_encuentro,
    i.lugar_encuentro,
    CASE 
        WHEN i.usuario_propone_id = 1 THEN 'Usuario 1 propone'
        WHEN i.usuario_recibe_id = 1 THEN 'Usuario 1 recibe'
        ELSE 'Usuario 1 no involucrado'
    END AS rol_usuario_1,
    c.chat_id,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id) as validaciones_count
FROM public.intercambio i
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE (i.usuario_propone_id = 1 OR i.usuario_recibe_id = 1)
  AND i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.intercambio_id DESC;

SELECT '=== FIN DEL DIAGNÓSTICO ===' as info;
