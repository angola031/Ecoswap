-- Script para configurar un intercambio válido para el usuario 1
-- Este script crea o actualiza un intercambio para que esté en estado válido para validación

-- 1. Verificar usuarios disponibles
SELECT 
    'Usuarios disponibles:' as info,
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE activo = true
ORDER BY user_id;

-- 2. Verificar productos disponibles
SELECT 
    'Productos disponibles:' as info,
    producto_id,
    titulo,
    user_id,
    estado_publicacion,
    u.nombre AS propietario
FROM public.producto p
LEFT JOIN public.usuario u ON p.user_id = u.user_id
WHERE estado_publicacion = 'activo'
ORDER BY producto_id;

-- 3. Crear o actualizar un intercambio para el usuario 1
-- Opción A: Actualizar el intercambio ID 2 (que sabemos que existe)
UPDATE public.intercambio 
SET 
    estado = 'pendiente_validacion',
    fecha_encuentro = NOW() - INTERVAL '1 hour',
    lugar_encuentro = 'Parque Principal, Centro de la ciudad',
    notas_encuentro = 'Intercambio configurado para validación del usuario 1'
WHERE intercambio_id = 2;

-- Verificar que se actualizó
SELECT 
    'Intercambio 2 actualizado:' as info,
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    fecha_encuentro,
    lugar_encuentro
FROM public.intercambio 
WHERE intercambio_id = 2;

-- 4. Asegurar que existe un chat para este intercambio
INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
SELECT 2, NOW(), true
WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = 2);

-- 5. Limpiar validaciones previas para empezar limpio
DELETE FROM public.validacion_intercambio WHERE intercambio_id = 2;

-- 6. Verificar el estado final
SELECT 
    'Estado final del intercambio 2:' as info,
    i.intercambio_id,
    i.estado,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.fecha_encuentro,
    i.lugar_encuentro,
    c.chat_id,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = 2) as validaciones_count
FROM public.intercambio i
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.intercambio_id = 2;

-- 7. Si el intercambio 2 no es adecuado para el usuario 1, crear uno nuevo
-- Primero verificar si el usuario 1 está involucrado en el intercambio 2
SELECT 
    'Verificación de participación del usuario 1 en intercambio 2:' as info,
    intercambio_id,
    usuario_propone_id,
    usuario_recibe_id,
    CASE 
        WHEN usuario_propone_id = 1 THEN '✅ Usuario 1 propone'
        WHEN usuario_recibe_id = 1 THEN '✅ Usuario 1 recibe'
        ELSE '❌ Usuario 1 no está involucrado'
    END AS participacion
FROM public.intercambio 
WHERE intercambio_id = 2;

-- Si el usuario 1 no está involucrado en el intercambio 2, crear uno nuevo
DO $$
DECLARE
    _usuario_1_id INTEGER := 1;
    _otro_usuario_id INTEGER;
    _producto_1_id INTEGER;
    _producto_2_id INTEGER;
BEGIN
    -- Verificar si el usuario 1 está en el intercambio 2
    IF NOT EXISTS (
        SELECT 1 FROM public.intercambio 
        WHERE intercambio_id = 2 
        AND (usuario_propone_id = _usuario_1_id OR usuario_recibe_id = _usuario_1_id)
    ) THEN
        RAISE NOTICE 'Usuario 1 no está involucrado en intercambio 2. Creando nuevo intercambio...';
        
        -- Obtener otro usuario activo
        SELECT user_id INTO _otro_usuario_id 
        FROM public.usuario 
        WHERE activo = true AND user_id != _usuario_1_id 
        LIMIT 1;
        
        -- Obtener productos de ambos usuarios
        SELECT producto_id INTO _producto_1_id 
        FROM public.producto 
        WHERE user_id = _usuario_1_id AND estado_publicacion = 'activo' 
        LIMIT 1;
        
        SELECT producto_id INTO _producto_2_id 
        FROM public.producto 
        WHERE user_id = _otro_usuario_id AND estado_publicacion = 'activo' 
        LIMIT 1;
        
        -- Crear nuevo intercambio
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
                'Intercambio de prueba para validación del usuario 1',
                'pendiente_validacion',
                NOW() - INTERVAL '1 day',
                'Parque Principal',
                NOW() - INTERVAL '1 hour'
            );
            
            RAISE NOTICE 'Nuevo intercambio creado para usuario 1 con ID %', (SELECT LASTVAL());
        ELSE
            RAISE NOTICE 'No se pudo crear intercambio: otros datos no disponibles';
        END IF;
    ELSE
        RAISE NOTICE 'Usuario 1 ya está involucrado en intercambio 2. No se creó nuevo intercambio.';
    END IF;
END $$;
