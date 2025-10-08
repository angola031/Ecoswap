-- Listar todos los intercambios disponibles en la base de datos
SELECT
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_completado,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido_titulo,
    ps.titulo AS producto_solicitado_titulo,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id) AS total_validaciones,
    CASE 
        WHEN i.estado IN ('aceptado', 'en_progreso', 'pendiente_validacion') THEN 'Puede validarse'
        WHEN i.estado = 'completado' THEN 'Ya completado'
        WHEN i.estado = 'fallido' THEN 'Falló'
        ELSE 'No se puede validar'
    END AS estado_validacion
FROM
    public.intercambio i
LEFT JOIN
    public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN
    public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN
    public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN
    public.producto ps ON i.producto_solicitado_id = ps.producto_id
ORDER BY
    i.intercambio_id DESC;

-- Mostrar solo intercambios que pueden ser validados
SELECT
    i.intercambio_id,
    i.estado,
    up.nombre AS propone_nombre,
    ur.nombre AS recibe_nombre,
    po.titulo AS producto_ofrecido
FROM
    public.intercambio i
LEFT JOIN
    public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN
    public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN
    public.producto po ON i.producto_ofrecido_id = po.producto_id
WHERE
    i.estado IN ('aceptado', 'en_progreso', 'pendiente_validacion')
ORDER BY
    i.intercambio_id DESC;

-- Verificar usuarios disponibles
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE activo = true
ORDER BY user_id;
