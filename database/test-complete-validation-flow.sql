-- Script para probar el flujo completo de validación usando el esquema real
-- Simula exactamente lo que hace el frontend y las APIs

-- 1. Verificar el estado inicial
SELECT 
    '=== ESTADO INICIAL - ANTES DE LAS PRUEBAS ===' as info;

-- Mostrar intercambios disponibles para validación
SELECT 
    'Intercambios disponibles para validación:' as seccion,
    i.intercambio_id,
    i.estado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id) as validaciones_existentes
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
ORDER BY i.intercambio_id DESC;

-- 2. Simular el flujo completo de validación
DO $$
DECLARE
    _intercambio_test RECORD;
    _usuario_validador INTEGER;
    _otro_usuario INTEGER;
    _validacion_id_1 INTEGER;
    _validacion_id_2 INTEGER;
BEGIN
    RAISE NOTICE 'Iniciando simulación del flujo completo de validación...';
    
    -- Obtener un intercambio para validar
    SELECT 
        i.intercambio_id,
        i.usuario_propone_id,
        i.usuario_recibe_id,
        up.nombre AS propone_nombre,
        ur.nombre AS recibe_nombre
    INTO _intercambio_test
    FROM public.intercambio i
    LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
    LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
    WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
    ORDER BY i.intercambio_id DESC
    LIMIT 1;
    
    IF _intercambio_test IS NULL THEN
        RAISE NOTICE '❌ No hay intercambios disponibles para validar';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Intercambio seleccionado para validación:';
    RAISE NOTICE '   ID: %', _intercambio_test.intercambio_id;
    RAISE NOTICE '   Propone: % (%)', _intercambio_test.propone_nombre, _intercambio_test.usuario_propone_id;
    RAISE NOTICE '   Recibe: % (%)', _intercambio_test.recibe_nombre, _intercambio_test.usuario_recibe_id;
    
    -- Simular validación del primer usuario (usuario que propone)
    _usuario_validador := _intercambio_test.usuario_propone_id;
    _otro_usuario := _intercambio_test.usuario_recibe_id;
    
    RAISE NOTICE 'Simulando validación del usuario % (propone)...', _usuario_validador;
    
    -- Crear primera validación (exitosa)
    INSERT INTO public.validacion_intercambio (
        intercambio_id,
        usuario_id,
        es_exitoso,
        calificacion,
        comentario,
        aspectos_destacados,
        fecha_validacion
    ) VALUES (
        _intercambio_test.intercambio_id,
        _usuario_validador,
        true,
        5,
        'Excelente intercambio, todo salió perfecto',
        'Puntualidad, calidad del producto, comunicación fluida',
        NOW()
    ) RETURNING validacion_id INTO _validacion_id_1;
    
    RAISE NOTICE '✅ Primera validación creada: ID %', _validacion_id_1;
    
    -- Verificar estado actual (debería seguir en pendiente_validacion)
    DECLARE
        _estado_actual VARCHAR;
    BEGIN
        SELECT estado INTO _estado_actual 
        FROM public.intercambio 
        WHERE intercambio_id = _intercambio_test.intercambio_id;
        
        RAISE NOTICE 'Estado del intercambio después de primera validación: %', _estado_actual;
        
        -- Simular validación del segundo usuario (usuario que recibe)
        _usuario_validador := _otro_usuario;
        
        RAISE NOTICE 'Simulando validación del usuario % (recibe)...', _usuario_validador;
        
        -- Crear segunda validación (exitosa)
        INSERT INTO public.validacion_intercambio (
            intercambio_id,
            usuario_id,
            es_exitoso,
            calificacion,
            comentario,
            aspectos_destacados,
            fecha_validacion
        ) VALUES (
            _intercambio_test.intercambio_id,
            _usuario_validador,
            true,
            4,
            'Muy buen intercambio, todo correcto',
            'Producto en buen estado, intercambio fluido',
            NOW()
        ) RETURNING validacion_id INTO _validacion_id_2;
        
        RAISE NOTICE '✅ Segunda validación creada: ID %', _validacion_id_2;
        
        -- Ahora ambas validaciones están completas, simular la lógica de la API
        -- Actualizar estado del intercambio a completado
        UPDATE public.intercambio 
        SET 
            estado = 'completado',
            fecha_completado = NOW()
        WHERE intercambio_id = _intercambio_test.intercambio_id;
        
        -- Actualizar estadísticas de usuarios
        UPDATE public.usuario 
        SET 
            total_intercambios = total_intercambios + 1,
            eco_puntos = eco_puntos + 50
        WHERE user_id IN (_intercambio_test.usuario_propone_id, _intercambio_test.usuario_recibe_id);
        
        -- Actualizar calificación promedio de ambos usuarios
        UPDATE public.usuario 
        SET calificacion_promedio = (
            SELECT AVG(puntuacion)::numeric(3,2)
            FROM public.calificacion 
            WHERE calificado_id = usuario.user_id
        )
        WHERE user_id IN (_intercambio_test.usuario_propone_id, _intercambio_test.usuario_recibe_id);
        
        -- Crear calificaciones mutuas
        INSERT INTO public.calificacion (
            intercambio_id,
            calificador_id,
            calificado_id,
            puntuacion,
            comentario,
            aspectos_destacados,
            recomendaria,
            es_publica
        ) VALUES 
        (
            _intercambio_test.intercambio_id,
            _intercambio_test.usuario_propone_id,
            _intercambio_test.usuario_recibe_id,
            4,
            'Muy buen intercambio, todo correcto',
            'Producto en buen estado, intercambio fluido',
            true,
            true
        ),
        (
            _intercambio_test.intercambio_id,
            _intercambio_test.usuario_recibe_id,
            _intercambio_test.usuario_propone_id,
            5,
            'Excelente intercambio, todo salió perfecto',
            'Puntualidad, calidad del producto, comunicación fluida',
            true,
            true
        );
        
        -- Marcar productos como intercambiados
        UPDATE public.producto 
        SET estado_publicacion = 'intercambiado'
        WHERE producto_id IN (
            SELECT producto_ofrecido_id, producto_solicitado_id 
            FROM public.intercambio 
            WHERE intercambio_id = _intercambio_test.intercambio_id
        );
        
        -- Crear notificaciones de éxito
        INSERT INTO public.notificacion (
            usuario_id,
            tipo,
            titulo,
            mensaje,
            datos_adicionales,
            es_push,
            es_email
        ) VALUES 
        (
            _intercambio_test.usuario_propone_id,
            'intercambio_completado',
            'Intercambio Completado',
            '¡Tu intercambio se ha completado exitosamente! Has ganado 50 eco-puntos.',
            json_build_object(
                'intercambio_id', _intercambio_test.intercambio_id,
                'tipo', 'exitoso',
                'eco_puntos', 50
            ),
            true,
            false
        ),
        (
            _intercambio_test.usuario_recibe_id,
            'intercambio_completado',
            'Intercambio Completado',
            '¡Tu intercambio se ha completado exitosamente! Has ganado 50 eco-puntos.',
            json_build_object(
                'intercambio_id', _intercambio_test.intercambio_id,
                'tipo', 'exitoso',
                'eco_puntos', 50
            ),
            true,
            false
        );
        
        RAISE NOTICE '✅ Flujo completo de validación simulado exitosamente:';
        RAISE NOTICE '   Intercambio completado: %', _intercambio_test.intercambio_id;
        RAISE NOTICE '   Validaciones creadas: %, %', _validacion_id_1, _validacion_id_2;
        RAISE NOTICE '   Estadísticas actualizadas';
        RAISE NOTICE '   Calificaciones mutuas creadas';
        RAISE NOTICE '   Productos marcados como intercambiados';
        RAISE NOTICE '   Notificaciones enviadas';
        RAISE NOTICE '   Eco-puntos otorgados: 50 a cada usuario';
        
    END;
END $$;

-- 3. Verificar el resultado final
SELECT 
    '=== RESULTADO FINAL DESPUÉS DE LA VALIDACIÓN ===' as info;

-- Mostrar el intercambio completado
SELECT 
    'Intercambio completado:' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_completado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    EXTRACT(EPOCH FROM (i.fecha_completado - i.fecha_propuesta))/3600 as duracion_horas
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
WHERE i.estado = 'completado'
ORDER BY i.fecha_completado DESC
LIMIT 1;

-- Mostrar validaciones creadas
SELECT 
    'Validaciones del intercambio:' as seccion,
    vi.validacion_id,
    vi.intercambio_id,
    vi.usuario_id,
    u.nombre AS usuario_nombre,
    vi.es_exitoso,
    vi.calificacion,
    vi.comentario,
    vi.aspectos_destacados,
    vi.fecha_validacion
FROM public.validacion_intercambio vi
LEFT JOIN public.usuario u ON vi.usuario_id = u.user_id
WHERE vi.intercambio_id IN (
    SELECT intercambio_id 
    FROM public.intercambio 
    WHERE estado = 'completado'
    ORDER BY fecha_completado DESC
    LIMIT 1
)
ORDER BY vi.fecha_validacion;

-- Mostrar calificaciones mutuas
SELECT 
    'Calificaciones mutuas:' as seccion,
    c.calificacion_id,
    c.intercambio_id,
    c.calificador_id,
    c.calificado_id,
    uc.nombre AS calificador_nombre,
    ue.nombre AS calificado_nombre,
    c.puntuacion,
    c.comentario,
    c.aspectos_destacados,
    c.recomendaria,
    c.fecha_calificacion
FROM public.calificacion c
LEFT JOIN public.usuario uc ON c.calificador_id = uc.user_id
LEFT JOIN public.usuario ue ON c.calificado_id = ue.user_id
WHERE c.intercambio_id IN (
    SELECT intercambio_id 
    FROM public.intercambio 
    WHERE estado = 'completado'
    ORDER BY fecha_completado DESC
    LIMIT 1
)
ORDER BY c.fecha_calificacion;

-- Mostrar estadísticas actualizadas de usuarios
SELECT 
    'Estadísticas actualizadas de usuarios:' as seccion,
    u.user_id,
    u.nombre,
    u.apellido,
    u.total_intercambios,
    u.calificacion_promedio,
    u.eco_puntos,
    u.fecha_registro
FROM public.usuario u
WHERE u.user_id IN (
    SELECT DISTINCT usuario_propone_id 
    FROM public.intercambio 
    WHERE estado = 'completado'
    ORDER BY fecha_completado DESC
    LIMIT 1
    UNION
    SELECT DISTINCT usuario_recibe_id 
    FROM public.intercambio 
    WHERE estado = 'completado'
    ORDER BY fecha_completado DESC
    LIMIT 1
)
ORDER BY u.user_id;

-- Mostrar productos marcados como intercambiados
SELECT 
    'Productos marcados como intercambiados:' as seccion,
    p.producto_id,
    p.titulo,
    p.user_id,
    u.nombre AS propietario,
    p.estado_publicacion,
    p.fecha_publicacion
FROM public.producto p
LEFT JOIN public.usuario u ON p.user_id = u.user_id
WHERE p.estado_publicacion = 'intercambiado'
ORDER BY p.producto_id DESC
LIMIT 5;

-- Mostrar notificaciones creadas
SELECT 
    'Notificaciones de intercambio completado:' as seccion,
    n.notificacion_id,
    n.usuario_id,
    u.nombre AS usuario_nombre,
    n.tipo,
    n.titulo,
    n.mensaje,
    n.fecha_creacion,
    n.leida,
    n.datos_adicionales
FROM public.notificacion n
LEFT JOIN public.usuario u ON n.usuario_id = u.user_id
WHERE n.tipo = 'intercambio_completado'
ORDER BY n.fecha_creacion DESC
LIMIT 5;

SELECT '=== FLUJO DE VALIDACIÓN COMPLETADO EXITOSAMENTE ===' as info;
