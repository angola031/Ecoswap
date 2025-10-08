-- Script dinámico para configurar intercambios para validación
-- NO hardcodea ningún ID específico, usa los que existen en la base de datos

-- 1. Mostrar estado actual de intercambios para validación
SELECT 
    '=== ESTADO ACTUAL DE INTERCAMBIOS PARA VALIDACIÓN ===' as info;

SELECT
    'Intercambios existentes para validación:' as seccion,
    i.intercambio_id,
    i.estado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.fecha_propuesta,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        ELSE '❌ No puede validarse'
    END AS puede_validar
FROM public.intercambio i
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.intercambio_id DESC;

-- 2. Configurar intercambios dinámicamente
DO $$
DECLARE
    _intercambio_record RECORD;
    _intercambios_configurados INTEGER := 0;
    _total_intercambios INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando configuración dinámica de intercambios para validación...';
    
    -- Contar total de intercambios existentes
    SELECT COUNT(*) INTO _total_intercambios FROM public.intercambio;
    RAISE NOTICE 'Total de intercambios en la base de datos: %', _total_intercambios;
    
    -- Buscar intercambios que pueden ser configurados para validación
    -- (estados que no sean completado, fallido, o ya válidos para validación)
    FOR _intercambio_record IN 
        SELECT 
            intercambio_id, 
            estado, 
            usuario_propone_id, 
            usuario_recibe_id,
            fecha_propuesta
        FROM public.intercambio 
        WHERE estado NOT IN ('completado', 'fallido', 'en_progreso', 'pendiente_validacion')
        ORDER BY intercambio_id DESC
        LIMIT 5 -- Configurar máximo 5 intercambios para no sobrecargar
    LOOP
        -- Actualizar intercambio a estado válido para validación
        UPDATE public.intercambio 
        SET 
            estado = 'pendiente_validacion',
            fecha_encuentro = NOW() - INTERVAL '1 hour',
            lugar_encuentro = 'Parque Principal, Centro de la ciudad',
            notas_encuentro = 'Configurado automáticamente para validación'
        WHERE intercambio_id = _intercambio_record.intercambio_id;
        
        -- Crear chat si no existe
        INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
        SELECT _intercambio_record.intercambio_id, NOW(), true
        WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = _intercambio_record.intercambio_id);
        
        -- Limpiar validaciones previas
        DELETE FROM public.validacion_intercambio WHERE intercambio_id = _intercambio_record.intercambio_id;
        
        _intercambios_configurados := _intercambios_configurados + 1;
        RAISE NOTICE 'Intercambio % configurado (estado: % -> pendiente_validacion, usuarios: % <-> %)', 
                     _intercambio_record.intercambio_id, 
                     _intercambio_record.estado,
                     _intercambio_record.usuario_propone_id,
                     _intercambio_record.usuario_recibe_id;
    END LOOP;
    
    RAISE NOTICE 'Total de intercambios configurados para validación: %', _intercambios_configurados;
    
    -- Si no se configuró ninguno, crear uno nuevo
    IF _intercambios_configurados = 0 THEN
        RAISE NOTICE 'No hay intercambios para configurar. Creando nuevo intercambio...';
        
        DECLARE
            _usuario_1 RECORD;
            _usuario_2 RECORD;
            _producto_1 RECORD;
            _producto_2 RECORD;
            _nuevo_intercambio_id INTEGER;
        BEGIN
            -- Obtener dos usuarios activos diferentes
            SELECT user_id, nombre INTO _usuario_1 FROM public.usuario WHERE activo = true ORDER BY user_id LIMIT 1;
            SELECT user_id, nombre INTO _usuario_2 FROM public.usuario WHERE activo = true AND user_id != _usuario_1.user_id ORDER BY user_id LIMIT 1;
            
            -- Obtener productos de ambos usuarios
            SELECT producto_id, titulo INTO _producto_1 FROM public.producto WHERE user_id = _usuario_1.user_id AND estado_publicacion = 'activo' ORDER BY producto_id LIMIT 1;
            SELECT producto_id, titulo INTO _producto_2 FROM public.producto WHERE user_id = _usuario_2.user_id AND estado_publicacion = 'activo' ORDER BY producto_id LIMIT 1;
            
            -- Crear intercambio si tenemos todos los datos
            IF _usuario_1.user_id IS NOT NULL AND _usuario_2.user_id IS NOT NULL AND 
               _producto_1.producto_id IS NOT NULL AND _producto_2.producto_id IS NOT NULL THEN
                
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
                    _producto_1.producto_id,
                    _producto_2.producto_id,
                    _usuario_1.user_id,
                    _usuario_2.user_id,
                    'Intercambio creado automáticamente para pruebas de validación',
                    'pendiente_validacion',
                    NOW() - INTERVAL '1 day',
                    'Parque Principal',
                    NOW() - INTERVAL '1 hour'
                ) RETURNING intercambio_id INTO _nuevo_intercambio_id;
                
                -- Crear chat
                INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
                VALUES (_nuevo_intercambio_id, NOW(), true);
                
                RAISE NOTICE 'Nuevo intercambio % creado: % (% <-> %) intercambia % con %', 
                             _nuevo_intercambio_id,
                             _usuario_1.nombre,
                             _usuario_1.user_id,
                             _usuario_2.user_id,
                             _producto_1.titulo,
                             _producto_2.titulo;
                _intercambios_configurados := 1;
            ELSE
                RAISE NOTICE 'No se pudo crear intercambio: datos insuficientes';
                RAISE NOTICE 'Usuario 1: % (%), Usuario 2: % (%), Producto 1: % (%), Producto 2: % (%)', 
                             _usuario_1.user_id, _usuario_1.nombre,
                             _usuario_2.user_id, _usuario_2.nombre,
                             _producto_1.producto_id, _producto_1.titulo,
                             _producto_2.producto_id, _producto_2.titulo;
            END IF;
        END;
    END IF;
    
    RAISE NOTICE 'Configuración completada. Intercambios listos para validación: %', _intercambios_configurados;
END $$;

-- 3. Verificar el resultado final
SELECT 
    '=== ESTADO FINAL - INTERCAMBIOS PARA VALIDACIÓN ===' as info;

SELECT
    'Intercambios disponibles para validación:' as seccion,
    i.intercambio_id,
    i.estado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.fecha_encuentro,
    i.lugar_encuentro,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    c.chat_id,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id) as validaciones_count
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.intercambio_id DESC;

-- 4. Mostrar resumen de usuarios involucrados
SELECT 
    'Usuarios involucrados en intercambios para validación:' as seccion,
    u.user_id,
    u.nombre,
    u.apellido,
    COUNT(i.intercambio_id) as total_intercambios,
    STRING_AGG(i.intercambio_id::text, ', ') as intercambio_ids
FROM public.usuario u
JOIN public.intercambio i ON (i.usuario_propone_id = u.user_id OR i.usuario_recibe_id = u.user_id)
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
GROUP BY u.user_id, u.nombre, u.apellido
ORDER BY total_intercambios DESC;

SELECT '=== CONFIGURACIÓN COMPLETADA ===' as info;
