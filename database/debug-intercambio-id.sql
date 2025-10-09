-- =====================================================
-- DEBUG: ANÁLISIS DEL INTERCAMBIO_ID
-- =====================================================
-- Este script te ayuda a identificar exactamente qué está pasando con el intercambio_id

-- 1. VERIFICAR TODOS LOS INTERCAMBIOS EXISTENTES
-- =====================================================
SELECT 
    '=== TODOS LOS INTERCAMBIOS EN LA BASE DE DATOS ===' as seccion,
    'Lista completa de intercambios:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id,
    -- Verificar si tiene chat
    CASE 
        WHEN c.chat_id IS NOT NULL THEN '✅ Tiene chat'
        ELSE '❌ Sin chat'
    END as chat_status,
    -- Verificar usuarios
    CASE 
        WHEN up.user_id IS NOT NULL AND ur.user_id IS NOT NULL THEN '✅ Usuarios OK'
        ELSE '❌ Usuario faltante'
    END as usuarios_status,
    -- Verificar productos
    CASE 
        WHEN po.producto_id IS NOT NULL AND ps.producto_id IS NOT NULL THEN '✅ Productos OK'
        ELSE '❌ Producto faltante'
    END as productos_status
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
ORDER BY i.intercambio_id DESC;

-- 2. CONTAR INTERCAMBIOS POR ESTADO
-- =====================================================
SELECT 
    '=== CONTEO POR ESTADO ===' as seccion,
    estado,
    COUNT(*) as total
FROM public.intercambio
GROUP BY estado
ORDER BY total DESC;

-- 3. INTERCAMBIOS VÁLIDOS PARA VALIDACIÓN (ESTADO CORRECTO)
-- =====================================================
SELECT 
    '=== INTERCAMBIOS VÁLIDOS PARA VALIDACIÓN ===' as seccion,
    'Intercambios en estado correcto:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    up.nombre || ' ' || up.apellido AS propone_nombre,
    ur.nombre || ' ' || ur.apellido AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    -- Verificar validaciones existentes
    (SELECT COUNT(*) FROM public.validacion_intercambio vi WHERE vi.intercambio_id = i.intercambio_id) as validaciones_count
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
WHERE i.estado IN ('aceptado', 'en_progreso', 'pendiente_validacion')
  AND up.user_id IS NOT NULL 
  AND ur.user_id IS NOT NULL
  AND po.producto_id IS NOT NULL 
  AND ps.producto_id IS NOT NULL
  AND up.activo = true 
  AND ur.activo = true
  AND po.estado_publicacion = 'activo' 
  AND ps.estado_publicacion = 'activo'
ORDER BY i.intercambio_id DESC;

-- 4. VERIFICAR UN INTERCAMBIO ESPECÍFICO (REEMPLAZA EL ID)
-- =====================================================
-- Cambia el número 1 por el intercambio_id que estás intentando validar

DO $$
DECLARE
    _intercambio_id INTEGER := 1; -- CAMBIAR ESTE NÚMERO
    _intercambio RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO INTERCAMBIO ID: % ===', _intercambio_id;
    
    -- Buscar el intercambio
    SELECT 
        i.intercambio_id,
        i.estado,
        i.usuario_propone_id,
        i.usuario_recibe_id,
        i.producto_ofrecido_id,
        i.producto_solicitado_id,
        i.fecha_propuesta,
        up.nombre AS propone_nombre,
        ur.nombre AS recibe_nombre,
        po.titulo AS producto_ofrecido,
        ps.titulo AS producto_solicitado,
        c.chat_id
    INTO _intercambio
    FROM public.intercambio i
    LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
    LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
    LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
    LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
    LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
    WHERE i.intercambio_id = _intercambio_id;
    
    IF _intercambio.intercambio_id IS NULL THEN
        RAISE NOTICE '❌ INTERCAMBIO NO ENCONTRADO: ID %', _intercambio_id;
        RAISE NOTICE '   Este es el problema - el intercambio no existe en la base de datos';
    ELSE
        RAISE NOTICE '✅ INTERCAMBIO ENCONTRADO:';
        RAISE NOTICE '   ID: %', _intercambio.intercambio_id;
        RAISE NOTICE '   Estado: %', _intercambio.estado;
        RAISE NOTICE '   Usuario propone: % (%)', _intercambio.propone_nombre, _intercambio.usuario_propone_id;
        RAISE NOTICE '   Usuario recibe: % (%)', _intercambio.recibe_nombre, _intercambio.usuario_recibe_id;
        RAISE NOTICE '   Producto ofrecido: % (%)', _intercambio.producto_ofrecido, _intercambio.producto_ofrecido_id;
        RAISE NOTICE '   Producto solicitado: % (%)', _intercambio.producto_solicitado, _intercambio.producto_solicitado_id;
        RAISE NOTICE '   Chat ID: %', _intercambio.chat_id;
        
        -- Verificar si puede ser validado
        IF _intercambio.estado IN ('aceptado', 'en_progreso', 'pendiente_validacion') THEN
            RAISE NOTICE '✅ ESTADO VÁLIDO para validación';
        ELSE
            RAISE NOTICE '❌ ESTADO INVÁLIDO para validación: %', _intercambio.estado;
            RAISE NOTICE '   Estados válidos: aceptado, en_progreso, pendiente_validacion';
        END IF;
    END IF;
END $$;

-- 5. MOSTRAR LOS ÚLTIMOS 5 INTERCAMBIOS CREADOS
-- =====================================================
SELECT 
    '=== ÚLTIMOS 5 INTERCAMBIOS CREADOS ===' as seccion,
    'Para identificar IDs válidos:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    up.nombre AS propone,
    ur.nombre AS recibe,
    po.titulo AS ofrecido,
    ps.titulo AS solicitado
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
ORDER BY i.fecha_propuesta DESC
LIMIT 5;

-- 6. CREAR UN INTERCAMBIO DE PRUEBA SI NO HAY NINGUNO
-- =====================================================
DO $$
DECLARE
    _usuario_1 RECORD;
    _usuario_2 RECORD;
    _producto_1 RECORD;
    _producto_2 RECORD;
    _nuevo_intercambio_id INTEGER;
    _intercambios_existentes INTEGER;
BEGIN
    -- Contar intercambios existentes
    SELECT COUNT(*) INTO _intercambios_existentes FROM public.intercambio;
    
    RAISE NOTICE '=== INTERCAMBIOS EXISTENTES: % ===', _intercambios_existentes;
    
    -- Si no hay intercambios, crear uno de prueba
    IF _intercambios_existentes = 0 THEN
        RAISE NOTICE 'No hay intercambios. Creando uno de prueba...';
        
        -- Obtener dos usuarios activos
        SELECT user_id, nombre, apellido, email 
        INTO _usuario_1 
        FROM public.usuario 
        WHERE activo = true 
        ORDER BY user_id 
        LIMIT 1;
        
        SELECT user_id, nombre, apellido, email 
        INTO _usuario_2 
        FROM public.usuario 
        WHERE activo = true AND user_id != _usuario_1.user_id
        ORDER BY user_id 
        LIMIT 1;
        
        -- Obtener productos de estos usuarios
        SELECT producto_id, titulo, user_id
        INTO _producto_1 
        FROM public.producto 
        WHERE user_id = _usuario_1.user_id AND estado_publicacion = 'activo'
        ORDER BY producto_id 
        LIMIT 1;
        
        SELECT producto_id, titulo, user_id
        INTO _producto_2 
        FROM public.producto 
        WHERE user_id = _usuario_2.user_id AND estado_publicacion = 'activo'
        ORDER BY producto_id 
        LIMIT 1;
        
        -- Verificar que tenemos datos suficientes
        IF _usuario_1.user_id IS NOT NULL AND _usuario_2.user_id IS NOT NULL 
           AND _producto_1.producto_id IS NOT NULL AND _producto_2.producto_id IS NOT NULL THEN
            
            -- Crear intercambio
            INSERT INTO public.intercambio (
                producto_ofrecido_id,
                producto_solicitado_id,
                usuario_propone_id,
                usuario_recibe_id,
                mensaje_propuesta,
                estado,
                fecha_encuentro,
                lugar_encuentro,
                notas_encuentro
            ) VALUES (
                _producto_1.producto_id,
                _producto_2.producto_id,
                _usuario_1.user_id,
                _usuario_2.user_id,
                'Intercambio de prueba para validación',
                'pendiente_validacion',
                NOW() - INTERVAL '1 hour',
                'Parque Principal',
                'Listo para validación'
            ) RETURNING intercambio_id INTO _nuevo_intercambio_id;
            
            -- Crear chat asociado
            INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
            VALUES (_nuevo_intercambio_id, NOW(), true);
            
            RAISE NOTICE '✅ INTERCAMBIO DE PRUEBA CREADO:';
            RAISE NOTICE '   ID: %', _nuevo_intercambio_id;
            RAISE NOTICE '   Usa este ID para probar la validación';
            RAISE NOTICE '   Usuario propone: % (%)', _usuario_1.nombre, _usuario_1.user_id;
            RAISE NOTICE '   Usuario recibe: % (%)', _usuario_2.nombre, _usuario_2.user_id;
            
        ELSE
            RAISE NOTICE '❌ No se pudo crear intercambio de prueba:';
            RAISE NOTICE '   Usuario 1: %', CASE WHEN _usuario_1.user_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Usuario 2: %', CASE WHEN _usuario_2.user_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Producto 1: %', CASE WHEN _producto_1.producto_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Producto 2: %', CASE WHEN _producto_2.producto_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
        END IF;
    ELSE
        RAISE NOTICE 'Ya existen intercambios en la base de datos';
    END IF;
END $$;

-- 7. INSTRUCCIONES PARA DEBUGGING
-- =====================================================
SELECT 
    '=== INSTRUCCIONES PARA DEBUGGING ===' as seccion,
    'Cómo identificar el problema:' as info;

SELECT 
    '1. Verifica que el intercambio_id existe en la tabla intercambio' as paso,
    '2. Asegúrate de usar un ID numérico válido' as paso,
    '3. El intercambio debe estar en estado: aceptado, en_progreso, o pendiente_validacion' as paso,
    '4. Los usuarios y productos deben existir y estar activos' as paso,
    '5. Revisa los logs de la consola para ver el intercambio_id que se está enviando' as paso;

SELECT '=== DEBUG COMPLETADO ===' as info;
