-- =====================================================
-- CONSULTAS DE DIAGNÓSTICO PARA ERROR DE VALIDACIÓN
-- =====================================================
-- Este script ayuda a identificar por qué falla la validación de intercambios

-- 1. DIAGNÓSTICO GENERAL DEL SISTEMA
-- =====================================================

-- Verificar estado general de la base de datos
SELECT 
    '=== DIAGNÓSTICO GENERAL DEL SISTEMA ===' as seccion,
    'Verificando integridad de datos...' as info;

-- Contar registros en tablas principales
SELECT 
    'Conteo de registros por tabla:' as info,
    'usuarios' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN activo = true THEN 1 END) as activos,
    COUNT(CASE WHEN verificado = true THEN 1 END) as verificados
FROM public.usuario
UNION ALL
SELECT 
    'productos' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN estado_publicacion = 'activo' THEN 1 END) as activos,
    COUNT(CASE WHEN estado_validacion = 'approved' THEN 1 END) as verificados
FROM public.producto
UNION ALL
SELECT 
    'intercambios' as tabla,
    COUNT(*) as total_registros,
    COUNT(CASE WHEN estado IN ('en_progreso', 'pendiente_validacion') THEN 1 END) as activos,
    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as verificados
FROM public.intercambio;

-- 2. ANÁLISIS ESPECÍFICO DE INTERCAMBIOS
-- =====================================================

-- Verificar todos los intercambios y su estado
SELECT 
    '=== ANÁLISIS DE INTERCAMBIOS ===' as seccion,
    'Todos los intercambios existentes:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    i.lugar_encuentro,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id,
    -- Verificar usuarios
    CASE 
        WHEN up.user_id IS NULL THEN '❌ Usuario propone no existe'
        WHEN ur.user_id IS NULL THEN '❌ Usuario recibe no existe'
        WHEN NOT up.activo THEN '❌ Usuario propone inactivo'
        WHEN NOT ur.activo THEN '❌ Usuario recibe inactivo'
        ELSE '✅ Usuarios válidos'
    END as validacion_usuarios,
    -- Verificar productos
    CASE 
        WHEN po.producto_id IS NULL THEN '❌ Producto ofrecido no existe'
        WHEN ps.producto_id IS NULL THEN '❌ Producto solicitado no existe'
        WHEN po.estado_publicacion != 'activo' THEN '❌ Producto ofrecido inactivo'
        WHEN ps.estado_publicacion != 'activo' THEN '❌ Producto solicitado inactivo'
        ELSE '✅ Productos válidos'
    END as validacion_productos,
    -- Verificar chat
    CASE 
        WHEN c.chat_id IS NULL THEN '❌ Sin chat asociado'
        ELSE '✅ Chat existe'
    END as validacion_chat
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
ORDER BY i.intercambio_id DESC;

-- 3. IDENTIFICAR INTERCAMBIOS VÁLIDOS PARA VALIDACIÓN
-- =====================================================

-- Intercambios que pueden ser validados
SELECT 
    '=== INTERCAMBIOS VÁLIDOS PARA VALIDACIÓN ===' as seccion,
    'Intercambios en estado correcto para validación:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_encuentro,
    i.lugar_encuentro,
    up.nombre || ' ' || up.apellido AS propone_nombre,
    ur.nombre || ' ' || ur.apellido AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    c.chat_id,
    -- Verificar si ya tiene validaciones
    (SELECT COUNT(*) FROM public.validacion_intercambio vi WHERE vi.intercambio_id = i.intercambio_id) as validaciones_existentes
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
  AND up.user_id IS NOT NULL 
  AND ur.user_id IS NOT NULL
  AND po.producto_id IS NOT NULL 
  AND ps.producto_id IS NOT NULL
  AND up.activo = true 
  AND ur.activo = true
  AND po.estado_publicacion = 'activo' 
  AND ps.estado_publicacion = 'activo'
ORDER BY i.fecha_encuentro DESC;

-- 4. PROBLEMAS COMUNES Y SOLUCIONES
-- =====================================================

-- Intercambios con problemas que necesitan corrección
SELECT 
    '=== INTERCAMBIOS CON PROBLEMAS ===' as seccion,
    'Intercambios que necesitan corrección:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    'PROBLEMA: ' || 
    CASE 
        WHEN up.user_id IS NULL THEN 'Usuario propone no existe'
        WHEN ur.user_id IS NULL THEN 'Usuario recibe no existe'
        WHEN NOT up.activo THEN 'Usuario propone inactivo'
        WHEN NOT ur.activo THEN 'Usuario recibe inactivo'
        WHEN po.producto_id IS NULL THEN 'Producto ofrecido no existe'
        WHEN ps.producto_id IS NULL THEN 'Producto solicitado no existe'
        WHEN po.estado_publicacion != 'activo' THEN 'Producto ofrecido inactivo'
        WHEN ps.estado_publicacion != 'activo' THEN 'Producto solicitado inactivo'
        WHEN c.chat_id IS NULL THEN 'Sin chat asociado'
        ELSE 'Estado inválido para validación'
    END as problema,
    'SOLUCIÓN: ' ||
    CASE 
        WHEN up.user_id IS NULL THEN 'Eliminar intercambio o crear usuario'
        WHEN ur.user_id IS NULL THEN 'Eliminar intercambio o crear usuario'
        WHEN NOT up.activo THEN 'Activar usuario o cambiar propone_id'
        WHEN NOT ur.activo THEN 'Activar usuario o cambiar recibe_id'
        WHEN po.producto_id IS NULL THEN 'Eliminar intercambio o crear producto'
        WHEN ps.producto_id IS NULL THEN 'Eliminar intercambio o crear producto'
        WHEN po.estado_publicacion != 'activo' THEN 'Activar producto o cambiar ofrecido_id'
        WHEN ps.estado_publicacion != 'activo' THEN 'Activar producto o cambiar solicitado_id'
        WHEN c.chat_id IS NULL THEN 'Crear chat asociado'
        ELSE 'Cambiar estado a pendiente_validacion o en_progreso'
    END as solucion
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
  AND (
    up.user_id IS NULL 
    OR ur.user_id IS NULL
    OR NOT up.activo 
    OR NOT ur.activo
    OR po.producto_id IS NULL 
    OR ps.producto_id IS NULL
    OR po.estado_publicacion != 'activo' 
    OR ps.estado_publicacion != 'activo'
    OR c.chat_id IS NULL
  );

-- 5. CONSULTAS PARA CORREGIR PROBLEMAS
-- =====================================================

-- Crear intercambios válidos si no existen
DO $$
DECLARE
    _usuario_1 RECORD;
    _usuario_2 RECORD;
    _producto_1 RECORD;
    _producto_2 RECORD;
    _intercambios_validos INTEGER;
    _intercambio_id INTEGER;
BEGIN
    RAISE NOTICE '=== CORRIGIENDO PROBLEMAS DE INTERCAMBIOS ===';
    
    -- Contar intercambios válidos
    SELECT COUNT(*) INTO _intercambios_validos
    FROM public.intercambio i
    JOIN public.usuario up ON i.usuario_propone_id = up.user_id
    JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
    JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
    JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
    WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
      AND up.activo = true 
      AND ur.activo = true
      AND po.estado_publicacion = 'activo' 
      AND ps.estado_publicacion = 'activo';
    
    RAISE NOTICE 'Intercambios válidos encontrados: %', _intercambios_validos;
    
    -- Si no hay intercambios válidos, crear uno
    IF _intercambios_validos = 0 THEN
        RAISE NOTICE 'No hay intercambios válidos. Creando uno nuevo...';
        
        -- Obtener dos usuarios activos
        SELECT user_id, nombre, apellido, email 
        INTO _usuario_1 
        FROM public.usuario 
        WHERE activo = true AND verificado = true
        ORDER BY user_id 
        LIMIT 1;
        
        SELECT user_id, nombre, apellido, email 
        INTO _usuario_2 
        FROM public.usuario 
        WHERE activo = true AND verificado = true AND user_id != _usuario_1.user_id
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
                'Intercambio creado automáticamente para pruebas',
                'pendiente_validacion',
                NOW() - INTERVAL '1 hour',
                'Parque Principal',
                'Listo para validación'
            ) RETURNING intercambio_id INTO _intercambio_id;
            
            -- Crear chat asociado
            INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
            VALUES (_intercambio_id, NOW(), true);
            
            RAISE NOTICE '✅ Intercambio creado exitosamente: ID %', _intercambio_id;
            RAISE NOTICE '   Usuario propone: % (%)', _usuario_1.nombre, _usuario_1.user_id;
            RAISE NOTICE '   Usuario recibe: % (%)', _usuario_2.nombre, _usuario_2.user_id;
            RAISE NOTICE '   Producto ofrecido: % (%)', _producto_1.titulo, _producto_1.producto_id;
            RAISE NOTICE '   Producto solicitado: % (%)', _producto_2.titulo, _producto_2.producto_id;
            
        ELSE
            RAISE NOTICE '❌ No se pudieron crear intercambios válidos:';
            RAISE NOTICE '   Usuario 1: %', CASE WHEN _usuario_1.user_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Usuario 2: %', CASE WHEN _usuario_2.user_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Producto 1: %', CASE WHEN _producto_1.producto_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
            RAISE NOTICE '   Producto 2: %', CASE WHEN _producto_2.producto_id IS NULL THEN 'No encontrado' ELSE 'OK' END;
        END IF;
    ELSE
        RAISE NOTICE '✅ Ya existen intercambios válidos en el sistema';
    END IF;
END $$;

-- 6. VERIFICACIÓN FINAL
-- =====================================================

-- Mostrar el estado final
SELECT 
    '=== ESTADO FINAL DESPUÉS DE CORRECCIONES ===' as seccion,
    'Intercambios listos para validación:' as info;

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_encuentro,
    i.lugar_encuentro,
    up.nombre || ' ' || up.apellido AS propone_nombre,
    ur.nombre || ' ' || ur.apellido AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    c.chat_id,
    '✅ LISTO PARA VALIDAR' as status
FROM public.intercambio i
JOIN public.usuario up ON i.usuario_propone_id = up.user_id
JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.estado IN ('en_progreso', 'pendiente_validacion')
  AND up.activo = true 
  AND ur.activo = true
  AND po.estado_publicacion = 'activo' 
  AND ps.estado_publicacion = 'activo'
ORDER BY i.intercambio_id DESC;

-- 7. CONSULTA DE VALIDACIÓN ESPECÍFICA
-- =====================================================

-- Esta es la consulta que debería usar tu API para validar intercambios
SELECT 
    '=== CONSULTA PARA API DE VALIDACIÓN ===' as seccion,
    'Usar esta consulta en tu endpoint de validación:' as info;

-- Función para validar un intercambio específico (reemplaza {INTERCAMBIO_ID} con el ID real)
SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_encuentro,
    i.lugar_encuentro,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    c.chat_id,
    -- Verificar si puede ser validado
    CASE 
        WHEN i.estado NOT IN ('en_progreso', 'pendiente_validacion') THEN false
        WHEN up.user_id IS NULL OR ur.user_id IS NULL THEN false
        WHEN NOT up.activo OR NOT ur.activo THEN false
        WHEN po.producto_id IS NULL OR ps.producto_id IS NULL THEN false
        WHEN po.estado_publicacion != 'activo' OR ps.estado_publicacion != 'activo' THEN false
        WHEN c.chat_id IS NULL THEN false
        ELSE true
    END as puede_validarse,
    -- Mensaje de error si no puede validarse
    CASE 
        WHEN i.estado NOT IN ('en_progreso', 'pendiente_validacion') THEN 'Estado inválido: ' || i.estado
        WHEN up.user_id IS NULL THEN 'Usuario propone no existe'
        WHEN ur.user_id IS NULL THEN 'Usuario recibe no existe'
        WHEN NOT up.activo THEN 'Usuario propone inactivo'
        WHEN NOT ur.activo THEN 'Usuario recibe inactivo'
        WHEN po.producto_id IS NULL THEN 'Producto ofrecido no existe'
        WHEN ps.producto_id IS NULL THEN 'Producto solicitado no existe'
        WHEN po.estado_publicacion != 'activo' THEN 'Producto ofrecido inactivo'
        WHEN ps.estado_publicacion != 'activo' THEN 'Producto solicitado inactivo'
        WHEN c.chat_id IS NULL THEN 'Chat no existe'
        ELSE 'OK'
    END as mensaje_validacion
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.intercambio_id = 1  -- Reemplaza con el ID del intercambio a validar
LIMIT 1;

SELECT '=== DIAGNÓSTICO COMPLETADO ===' as info;
