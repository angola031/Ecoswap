-- Script para configurar intercambios válidos usando el esquema real de la base de datos
-- Basado en el esquema completo proporcionado

-- 1. Verificar el estado actual de la base de datos
SELECT 
    '=== ESTADO ACTUAL DE LA BASE DE DATOS ===' as info;

-- Verificar usuarios activos
SELECT 
    'Usuarios activos en el sistema:' as seccion,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.activo,
    u.verificado,
    u.total_intercambios,
    u.eco_puntos
FROM public.usuario u
WHERE u.activo = true
ORDER BY u.user_id;

-- Verificar productos activos
SELECT 
    'Productos activos disponibles:' as seccion,
    p.producto_id,
    p.titulo,
    p.user_id,
    u.nombre AS propietario,
    p.estado_publicacion,
    p.tipo_transaccion,
    p.precio
FROM public.producto p
LEFT JOIN public.usuario u ON p.user_id = u.user_id
WHERE p.estado_publicacion = 'activo'
ORDER BY p.user_id, p.producto_id;

-- Verificar intercambios existentes
SELECT 
    'Intercambios existentes:' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        WHEN i.estado = 'pendiente' 
        THEN '⏳ Pendiente de aceptación'
        WHEN i.estado = 'aceptado' 
        THEN '✅ Aceptado'
        WHEN i.estado = 'completado' 
        THEN '✅ Completado'
        WHEN i.estado = 'fallido' 
        THEN '❌ Fallido'
        WHEN i.estado = 'rechazado' 
        THEN '❌ Rechazado'
        WHEN i.estado = 'cancelado' 
        THEN '❌ Cancelado'
        ELSE '❓ Estado no reconocido'
    END AS estado_descripcion
FROM public.intercambio i
ORDER BY i.fecha_propuesta DESC;

-- 2. Configurar intercambios válidos para validación
DO $$
DECLARE
    _usuario_1 RECORD;
    _usuario_2 RECORD;
    _producto_1 RECORD;
    _producto_2 RECORD;
    _intercambios_creados INTEGER := 0;
    _intercambios_configurados INTEGER := 0;
BEGIN
    RAISE NOTICE 'Iniciando configuración de intercambios para validación...';
    
    -- Obtener dos usuarios activos diferentes
    SELECT user_id, nombre, apellido, email, activo, verificado 
    INTO _usuario_1 
    FROM public.usuario 
    WHERE activo = true 
    ORDER BY user_id 
    LIMIT 1;
    
    SELECT user_id, nombre, apellido, email, activo, verificado 
    INTO _usuario_2 
    FROM public.usuario 
    WHERE activo = true AND user_id != _usuario_1.user_id 
    ORDER BY user_id 
    LIMIT 1;
    
    -- Obtener productos de ambos usuarios
    SELECT producto_id, titulo, user_id, estado_publicacion, tipo_transaccion, precio
    INTO _producto_1 
    FROM public.producto 
    WHERE user_id = _usuario_1.user_id AND estado_publicacion = 'activo' 
    ORDER BY producto_id 
    LIMIT 1;
    
    SELECT producto_id, titulo, user_id, estado_publicacion, tipo_transaccion, precio
    INTO _producto_2 
    FROM public.producto 
    WHERE user_id = _usuario_2.user_id AND estado_publicacion = 'activo' 
    ORDER BY producto_id 
    LIMIT 1;
    
    RAISE NOTICE 'Datos encontrados:';
    RAISE NOTICE 'Usuario 1: % (%) - Producto: % (%)', _usuario_1.nombre, _usuario_1.user_id, _producto_1.titulo, _producto_1.producto_id;
    RAISE NOTICE 'Usuario 2: % (%) - Producto: % (%)', _usuario_2.nombre, _usuario_2.user_id, _producto_2.titulo, _producto_2.producto_id;
    
    -- Verificar si ya existe un intercambio válido entre estos usuarios
    IF NOT EXISTS (
        SELECT 1 FROM public.intercambio 
        WHERE ((usuario_propone_id = _usuario_1.user_id AND usuario_recibe_id = _usuario_2.user_id) OR
               (usuario_propone_id = _usuario_2.user_id AND usuario_recibe_id = _usuario_1.user_id))
          AND estado IN ('en_progreso', 'pendiente_validacion')
    ) THEN
        
        -- Crear nuevo intercambio
        INSERT INTO public.intercambio (
            producto_ofrecido_id,
            producto_solicitado_id,
            usuario_propone_id,
            usuario_recibe_id,
            mensaje_propuesta,
            monto_adicional,
            condiciones_adicionales,
            estado,
            fecha_encuentro,
            lugar_encuentro,
            notas_encuentro
        ) VALUES (
            _producto_1.producto_id,
            _producto_2.producto_id,
            _usuario_1.user_id,
            _usuario_2.user_id,
            'Intercambio configurado automáticamente para pruebas de validación',
            0,
            'Configurado desde el script de setup',
            'pendiente_validacion',
            NOW() - INTERVAL '1 hour',
            'Parque Principal, Centro de la ciudad',
            'Intercambio listo para validación'
        );
        
        -- Obtener el ID del intercambio recién creado
        DECLARE
            _nuevo_intercambio_id INTEGER;
        BEGIN
            SELECT intercambio_id INTO _nuevo_intercambio_id 
            FROM public.intercambio 
            WHERE usuario_propone_id = _usuario_1.user_id 
              AND usuario_recibe_id = _usuario_2.user_id 
              AND estado = 'pendiente_validacion'
            ORDER BY fecha_propuesta DESC 
            LIMIT 1;
            
            -- Crear chat asociado
            INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
            VALUES (_nuevo_intercambio_id, NOW(), true);
            
            -- Crear notificación para el usuario receptor
            INSERT INTO public.notificacion (
                usuario_id,
                tipo,
                titulo,
                mensaje,
                datos_adicionales,
                es_push,
                es_email
            ) VALUES (
                _usuario_2.user_id,
                'nueva_propuesta_intercambio',
                'Nueva Propuesta de Intercambio',
                _usuario_1.nombre || ' te ha propuesto un intercambio: ' || _producto_1.titulo || ' por ' || _producto_2.titulo,
                json_build_object(
                    'intercambio_id', _nuevo_intercambio_id,
                    'usuario_propone_id', _usuario_1.user_id,
                    'producto_ofrecido_id', _producto_1.producto_id,
                    'producto_solicitado_id', _producto_2.producto_id
                ),
                true,
                false
            );
            
            RAISE NOTICE '✅ Nuevo intercambio creado:';
            RAISE NOTICE '   Intercambio ID: %', _nuevo_intercambio_id;
            RAISE NOTICE '   Estado: pendiente_validacion';
            RAISE NOTICE '   Chat y notificación creados';
            
            _intercambios_creados := 1;
        END;
        
    ELSE
        RAISE NOTICE 'Ya existe un intercambio válido entre estos usuarios';
    END IF;
    
    -- Configurar intercambios existentes que no estén en estado válido para validación
    FOR rec IN 
        SELECT intercambio_id, estado, usuario_propone_id, usuario_recibe_id
        FROM public.intercambio 
        WHERE estado NOT IN ('completado', 'fallido', 'en_progreso', 'pendiente_validacion')
        ORDER BY intercambio_id DESC
        LIMIT 3
    LOOP
        -- Actualizar a estado válido para validación
        UPDATE public.intercambio 
        SET 
            estado = 'pendiente_validacion',
            fecha_encuentro = NOW() - INTERVAL '1 hour',
            lugar_encuentro = 'Parque Principal, Centro de la ciudad',
            notas_encuentro = 'Configurado automáticamente para validación'
        WHERE intercambio_id = rec.intercambio_id;
        
        -- Asegurar que existe un chat
        INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
        SELECT rec.intercambio_id, NOW(), true
        WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = rec.intercambio_id);
        
        -- Limpiar validaciones previas
        DELETE FROM public.validacion_intercambio WHERE intercambio_id = rec.intercambio_id;
        
        RAISE NOTICE '✅ Intercambio % configurado para validación (estado: % -> pendiente_validacion)', 
                     rec.intercambio_id, rec.estado;
        
        _intercambios_configurados := _intercambios_configurados + 1;
    END LOOP;
    
    RAISE NOTICE 'Resumen de configuración:';
    RAISE NOTICE '   Intercambios nuevos creados: %', _intercambios_creados;
    RAISE NOTICE '   Intercambios existentes configurados: %', _intercambios_configurados;
    RAISE NOTICE '   Total intercambios listos para validación: %', _intercambios_creados + _intercambios_configurados;
END $$;

-- 3. Verificar el resultado final
SELECT 
    '=== RESULTADO FINAL - INTERCAMBIOS PARA VALIDACIÓN ===' as info;

-- Mostrar intercambios listos para validación
SELECT 
    'Intercambios disponibles para validación:' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    i.lugar_encuentro,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    c.chat_id,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id) as validaciones_count
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.intercambio_id DESC;

-- Mostrar usuarios involucrados
SELECT 
    'Usuarios involucrados en intercambios para validación:' as seccion,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    COUNT(i.intercambio_id) as total_intercambios,
    STRING_AGG(i.intercambio_id::text, ', ') as intercambio_ids
FROM public.usuario u
JOIN public.intercambio i ON (i.usuario_propone_id = u.user_id OR i.usuario_recibe_id = u.user_id)
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
GROUP BY u.user_id, u.nombre, u.apellido, u.email
ORDER BY total_intercambios DESC;

-- Mostrar chats asociados
SELECT 
    'Chats asociados a intercambios:' as seccion,
    c.chat_id,
    c.intercambio_id,
    c.fecha_creacion,
    c.activo,
    i.estado as intercambio_estado
FROM public.chat c
LEFT JOIN public.intercambio i ON c.intercambio_id = i.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY c.fecha_creacion DESC;

-- Mostrar notificaciones creadas
SELECT 
    'Notificaciones relacionadas:' as seccion,
    n.notificacion_id,
    n.usuario_id,
    n.tipo,
    n.titulo,
    n.mensaje,
    n.fecha_creacion,
    n.leida,
    u.nombre AS usuario_nombre
FROM public.notificacion n
LEFT JOIN public.usuario u ON n.usuario_id = u.user_id
WHERE n.tipo = 'nueva_propuesta_intercambio'
ORDER BY n.fecha_creacion DESC;

-- 4. Mostrar instrucciones para probar desde el frontend
SELECT 
    '=== INSTRUCCIONES PARA PROBAR DESDE EL FRONTEND ===' as info;

SELECT 
    '1. Endpoint para listar intercambios pendientes de validación:' as paso,
    'GET /api/intercambios/pending-validation?userId={userId}' as endpoint,
    'Authorization: Bearer {token}' as headers;

SELECT 
    '2. Endpoint para validar un intercambio:' as paso,
    'PATCH /api/intercambios/{intercambio_id}/validate' as endpoint,
    'Authorization: Bearer {token}' as headers;

SELECT 
    '3. Ejemplo de payload para validación exitosa:' as paso,
    json_build_object(
        'userId', 1,
        'isValid', true,
        'rating', 5,
        'comment', 'Excelente intercambio, muy recomendado',
        'aspects', 'Puntualidad, calidad del producto, comunicación'
    ) as payload_ejemplo;

SELECT 
    '4. Ejemplo de payload para validación fallida:' as paso,
    json_build_object(
        'userId', 1,
        'isValid', false,
        'comment', 'El producto no coincidía con la descripción y había daños no mencionados'
    ) as payload_ejemplo;

SELECT '=== CONFIGURACIÓN COMPLETADA ===' as info;
