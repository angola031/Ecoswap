-- Diagnóstico para intercambio_id = 11
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
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id AND es_exitoso = TRUE) AS validaciones_exitosas,
    (SELECT COUNT(*) FROM public.validacion_intercambio WHERE intercambio_id = i.intercambio_id AND es_exitoso = FALSE) AS validaciones_fallidas
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
WHERE
    i.intercambio_id = 11;

-- Verificar si el intercambio existe
SELECT 
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    producto_ofrecido_id,
    producto_solicitado_id,
    fecha_propuesta
FROM public.intercambio 
WHERE intercambio_id = 11;

-- Verificar usuario ID 1
SELECT 
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE user_id = 1;

-- Validaciones específicas para el intercambio 11
SELECT * FROM public.validacion_intercambio WHERE intercambio_id = 11;

-- Chats relacionados con el intercambio 11
SELECT * FROM public.chat WHERE intercambio_id = 11;

-- Propuestas relacionadas con el chat del intercambio 11 (si existe un chat)
SELECT p.*
FROM public.propuesta p
JOIN public.chat c ON p.chat_id = c.chat_id
WHERE c.intercambio_id = 11;
