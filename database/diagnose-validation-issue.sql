-- Diagnóstico completo del problema de validación

-- 1. Verificar si el intercambio ID 11 existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.intercambio WHERE intercambio_id = 11) 
        THEN 'EXISTE' 
        ELSE 'NO EXISTE' 
    END AS intercambio_11_status;

-- 2. Mostrar todos los intercambios disponibles con sus estados
SELECT
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    producto_ofrecido_id,
    producto_solicitado_id,
    fecha_propuesta,
    CASE 
        WHEN estado IN ('aceptado', 'en_progreso', 'pendiente_validacion') 
        THEN '✅ Puede validarse'
        WHEN estado = 'completado' 
        THEN '✅ Ya completado'
        WHEN estado = 'fallido' 
        THEN '❌ Falló'
        ELSE '❓ Estado no válido para validación'
    END AS estado_validacion
FROM public.intercambio 
ORDER BY intercambio_id DESC;

-- 3. Verificar usuario ID 1
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    activo,
    CASE 
        WHEN activo = true 
        THEN '✅ Activo' 
        ELSE '❌ Inactivo' 
    END AS usuario_status
FROM public.usuario 
WHERE user_id = 1;

-- 4. Mostrar intercambios donde el usuario ID 1 está involucrado
SELECT
    i.intercambio_id,
    i.estado,
    CASE 
        WHEN i.usuario_propone_id = 1 THEN 'Propone'
        WHEN i.usuario_recibe_id = 1 THEN 'Recibe'
        ELSE 'No involucrado'
    END AS rol_usuario,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
WHERE i.usuario_propone_id = 1 OR i.usuario_recibe_id = 1
ORDER BY i.intercambio_id DESC;

-- 5. Mostrar validaciones existentes
SELECT
    vi.validacion_id,
    vi.intercambio_id,
    vi.usuario_id,
    u.nombre AS usuario_nombre,
    vi.es_exitoso,
    vi.calificacion,
    vi.fecha_validacion
FROM public.validacion_intercambio vi
LEFT JOIN public.usuario u ON vi.usuario_id = u.user_id
ORDER BY vi.intercambio_id DESC, vi.fecha_validacion DESC;
