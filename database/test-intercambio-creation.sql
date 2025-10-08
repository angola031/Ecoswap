-- Script para probar la creación de intercambios desde el frontend
-- Este script simula lo que haría el frontend al llamar al endpoint POST /api/intercambios

-- 1. Verificar usuarios y productos disponibles para crear intercambios
SELECT 
    '=== USUARIOS Y PRODUCTOS DISPONIBLES PARA INTERCAMBIOS ===' as info;

-- Mostrar usuarios activos
SELECT 
    'Usuarios activos:' as seccion,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.activo,
    u.verificado,
    COUNT(p.producto_id) as productos_activos
FROM public.usuario u
LEFT JOIN public.producto p ON u.user_id = p.user_id AND p.estado_publicacion = 'activo'
WHERE u.activo = true
GROUP BY u.user_id, u.nombre, u.apellido, u.email, u.activo, u.verificado
ORDER BY u.user_id;

-- Mostrar productos activos disponibles
SELECT 
    'Productos activos disponibles:' as seccion,
    p.producto_id,
    p.titulo,
    p.user_id,
    u.nombre AS propietario,
    p.estado_publicacion,
    p.tipo_transaccion
FROM public.producto p
LEFT JOIN public.usuario u ON p.user_id = u.user_id
WHERE p.estado_publicacion = 'activo'
ORDER BY p.user_id, p.producto_id;

-- 2. Simular la creación de un intercambio (lo que haría el endpoint POST)
DO $$
DECLARE
    _usuario_propone_id INTEGER;
    _usuario_recibe_id INTEGER;
    _producto_ofrecido_id INTEGER;
    _producto_solicitado_id INTEGER;
    _nuevo_intercambio_id INTEGER;
    _nuevo_chat_id INTEGER;
BEGIN
    RAISE NOTICE 'Simulando creación de intercambio desde el frontend...';
    
    -- Obtener dos usuarios diferentes activos
    SELECT user_id INTO _usuario_propone_id 
    FROM public.usuario 
    WHERE activo = true 
    ORDER BY user_id 
    LIMIT 1;
    
    SELECT user_id INTO _usuario_recibe_id 
    FROM public.usuario 
    WHERE activo = true AND user_id != _usuario_propone_id 
    ORDER BY user_id 
    LIMIT 1;
    
    -- Obtener productos de ambos usuarios
    SELECT producto_id INTO _producto_ofrecido_id 
    FROM public.producto 
    WHERE user_id = _usuario_propone_id AND estado_publicacion = 'activo' 
    ORDER BY producto_id 
    LIMIT 1;
    
    SELECT producto_id INTO _producto_solicitado_id 
    FROM public.producto 
    WHERE user_id = _usuario_recibe_id AND estado_publicacion = 'activo' 
    ORDER BY producto_id 
    LIMIT 1;
    
    -- Verificar que tenemos todos los datos necesarios
    IF _usuario_propone_id IS NOT NULL AND _usuario_recibe_id IS NOT NULL AND 
       _producto_ofrecido_id IS NOT NULL AND _producto_solicitado_id IS NOT NULL THEN
        
        RAISE NOTICE 'Datos para el intercambio:';
        RAISE NOTICE 'Usuario propone: %', _usuario_propone_id;
        RAISE NOTICE 'Usuario recibe: %', _usuario_recibe_id;
        RAISE NOTICE 'Producto ofrecido: %', _producto_ofrecido_id;
        RAISE NOTICE 'Producto solicitado: %', _producto_solicitado_id;
        
        -- Crear el intercambio (simulando lo que hace el endpoint POST)
        INSERT INTO public.intercambio (
            producto_ofrecido_id,
            producto_solicitado_id,
            usuario_propone_id,
            usuario_recibe_id,
            mensaje_propuesta,
            monto_adicional,
            condiciones_adicionales,
            estado
        ) VALUES (
            _producto_ofrecido_id,
            _producto_solicitado_id,
            _usuario_propone_id,
            _usuario_recibe_id,
            'Propuesta de intercambio creada desde el frontend - prueba de integración',
            0,
            'Condiciones especiales de prueba',
            'pendiente'
        ) RETURNING intercambio_id INTO _nuevo_intercambio_id;
        
        -- Crear chat asociado
        INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
        VALUES (_nuevo_intercambio_id, NOW(), true)
        RETURNING chat_id INTO _nuevo_chat_id;
        
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
            _usuario_recibe_id,
            'nueva_propuesta_intercambio',
            'Nueva Propuesta de Intercambio',
            'Un usuario te ha propuesto un intercambio desde el frontend',
            json_build_object(
                'intercambio_id', _nuevo_intercambio_id,
                'usuario_propone_id', _usuario_propone_id,
                'producto_ofrecido_id', _producto_ofrecido_id,
                'producto_solicitado_id', _producto_solicitado_id
            ),
            true,
            false
        );
        
        -- Marcar productos como pausados temporalmente
        UPDATE public.producto 
        SET estado_publicacion = 'pausado'
        WHERE producto_id IN (_producto_ofrecido_id, _producto_solicitado_id);
        
        RAISE NOTICE '✅ Intercambio creado exitosamente:';
        RAISE NOTICE '   Intercambio ID: %', _nuevo_intercambio_id;
        RAISE NOTICE '   Chat ID: %', _nuevo_chat_id;
        RAISE NOTICE '   Estado: pendiente';
        RAISE NOTICE '   Productos pausados: %, %', _producto_ofrecido_id, _producto_solicitado_id;
        
    ELSE
        RAISE NOTICE '❌ No se pudo crear intercambio: datos insuficientes';
        RAISE NOTICE '   Usuario propone: %', _usuario_propone_id;
        RAISE NOTICE '   Usuario recibe: %', _usuario_recibe_id;
        RAISE NOTICE '   Producto ofrecido: %', _producto_ofrecido_id;
        RAISE NOTICE '   Producto solicitado: %', _producto_solicitado_id;
    END IF;
END $$;

-- 3. Verificar el resultado
SELECT 
    '=== RESULTADO DE LA CREACIÓN DE INTERCAMBIO ===' as info;

-- Mostrar el intercambio recién creado
SELECT 
    'Intercambio creado:' as seccion,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.mensaje_propuesta,
    i.monto_adicional,
    i.condiciones_adicionales,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id
FROM public.intercambio i
ORDER BY i.fecha_propuesta DESC
LIMIT 1;

-- Mostrar el chat asociado
SELECT 
    'Chat asociado:' as seccion,
    c.chat_id,
    c.intercambio_id,
    c.fecha_creacion,
    c.activo
FROM public.chat c
ORDER BY c.fecha_creacion DESC
LIMIT 1;

-- Mostrar la notificación creada
SELECT 
    'Notificación creada:' as seccion,
    n.notificacion_id,
    n.usuario_id,
    n.tipo,
    n.titulo,
    n.mensaje,
    n.fecha_creacion,
    n.leida
FROM public.notificacion n
WHERE n.tipo = 'nueva_propuesta_intercambio'
ORDER BY n.fecha_creacion DESC
LIMIT 1;

-- Mostrar el estado de los productos
SELECT 
    'Estado de productos:' as seccion,
    p.producto_id,
    p.titulo,
    p.user_id,
    p.estado_publicacion,
    CASE 
        WHEN p.estado_publicacion = 'pausado' THEN '✅ Pausado por intercambio'
        WHEN p.estado_publicacion = 'activo' THEN '✅ Disponible'
        ELSE '❓ Otro estado'
    END AS estado_descripcion
FROM public.producto p
ORDER BY p.producto_id DESC
LIMIT 5;

-- 4. Mostrar cómo probar desde el frontend
SELECT 
    '=== INSTRUCCIONES PARA PROBAR DESDE EL FRONTEND ===' as info;

SELECT 
    'Endpoint POST /api/intercambios' as endpoint,
    'Crear intercambio desde el frontend' as descripcion,
    'POST' as metodo,
    'application/json' as content_type,
    'Bearer {token}' as authorization;

SELECT 
    'Ejemplo de payload:' as ejemplo,
    json_build_object(
        'producto_ofrecido_id', 1,
        'producto_solicitado_id', 2,
        'usuario_recibe_id', 19,
        'mensaje_propuesta', 'Me interesa intercambiar mi producto por el tuyo',
        'monto_adicional', 0,
        'condiciones_adicionales', 'Condiciones especiales del intercambio'
    ) as payload_ejemplo;

SELECT '=== FIN DE LA PRUEBA ===' as info;
