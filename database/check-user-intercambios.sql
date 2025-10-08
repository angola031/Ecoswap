-- Verificar todos los intercambios para el usuario ID 1

-- 1. Verificar si el usuario ID 1 existe y está activo
SELECT 
    'Usuario 1:' as info,
    user_id,
    nombre,
    apellido,
    email,
    activo,
    CASE 
        WHEN activo = true THEN '✅ Activo' 
        ELSE '❌ Inactivo' 
    END AS status
FROM public.usuario 
WHERE user_id = 1;

-- 2. Buscar todos los intercambios donde el usuario 1 está involucrado
SELECT
    'Intercambios del usuario 1:' as info,
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    i.lugar_encuentro,
    CASE 
        WHEN i.usuario_propone_id = 1 THEN 'Propone'
        WHEN i.usuario_recibe_id = 1 THEN 'Recibe'
        ELSE 'No involucrado'
    END AS rol_usuario,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        WHEN i.estado = 'completado' 
        THEN '✅ Ya completado'
        WHEN i.estado = 'fallido' 
        THEN '❌ Falló'
        WHEN i.estado = 'pendiente'
        THEN '⏳ Pendiente de aceptación'
        WHEN i.estado = 'aceptado'
        THEN '✅ Aceptado (debería estar en progreso)'
        ELSE '❓ Estado no reconocido'
    END AS estado_validacion
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
WHERE i.usuario_propone_id = 1 OR i.usuario_recibe_id = 1
ORDER BY i.intercambio_id DESC;

-- 3. Contar intercambios por estado para el usuario 1
SELECT
    'Conteo por estado para usuario 1:' as info,
    estado,
    COUNT(*) as total,
    CASE 
        WHEN estado IN ('en_progreso', 'pendiente_validacion') 
        THEN '✅ Pueden validarse'
        ELSE '❌ No pueden validarse'
    END AS puede_validar
FROM public.intercambio 
WHERE usuario_propone_id = 1 OR usuario_recibe_id = 1
GROUP BY estado
ORDER BY total DESC;

-- 4. Verificar validaciones existentes para intercambios del usuario 1
SELECT
    'Validaciones existentes:' as info,
    vi.intercambio_id,
    vi.usuario_id,
    u.nombre AS usuario_nombre,
    vi.es_exitoso,
    vi.calificacion,
    vi.fecha_validacion
FROM public.validacion_intercambio vi
LEFT JOIN public.usuario u ON vi.usuario_id = u.user_id
WHERE vi.intercambio_id IN (
    SELECT intercambio_id 
    FROM public.intercambio 
    WHERE usuario_propone_id = 1 OR usuario_recibe_id = 1
)
ORDER BY vi.intercambio_id DESC, vi.fecha_validacion DESC;
