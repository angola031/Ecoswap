-- Script de diagnóstico para intercambio ID 7
-- Ejecutar este script para verificar el estado del intercambio

-- 1. Verificar si el intercambio existe
SELECT 
    intercambio_id,
    usuario_propone_id,
    usuario_recibe_id,
    estado,
    fecha_propuesta,
    fecha_completado,
    producto_ofrecido_id,
    producto_solicitado_id
FROM intercambio 
WHERE intercambio_id = 7;

-- 2. Verificar validaciones existentes para este intercambio
SELECT 
    v.validacion_id,
    v.intercambio_id,
    v.usuario_id,
    v.es_exitoso,
    v.calificacion,
    v.fecha_validacion,
    u.nombre,
    u.apellido
FROM validacion_intercambio v
LEFT JOIN usuario u ON v.usuario_id = u.user_id
WHERE v.intercambio_id = 7;

-- 3. Verificar productos relacionados
SELECT 
    'Producto Ofrecido' as tipo,
    p.producto_id,
    p.titulo,
    p.estado_publicacion,
    u.nombre as propietario_nombre
FROM intercambio i
JOIN producto p ON i.producto_ofrecido_id = p.producto_id
JOIN usuario u ON p.user_id = u.user_id
WHERE i.intercambio_id = 7

UNION ALL

SELECT 
    'Producto Solicitado' as tipo,
    p.producto_id,
    p.titulo,
    p.estado_publicacion,
    u.nombre as propietario_nombre
FROM intercambio i
JOIN producto p ON i.producto_solicitado_id = p.producto_id
JOIN usuario u ON p.user_id = u.user_id
WHERE i.intercambio_id = 7;

-- 4. Verificar usuarios involucrados
SELECT 
    'Usuario Propone' as rol,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.activo
FROM intercambio i
JOIN usuario u ON i.usuario_propone_id = u.user_id
WHERE i.intercambio_id = 7

UNION ALL

SELECT 
    'Usuario Recibe' as rol,
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.activo
FROM intercambio i
JOIN usuario u ON i.usuario_recibe_id = u.user_id
WHERE i.intercambio_id = 7;

-- 5. Verificar si hay chats relacionados
SELECT 
    c.chat_id,
    c.fecha_creacion,
    c.ultimo_mensaje,
    c.activo,
    COUNT(m.mensaje_id) as total_mensajes
FROM intercambio i
LEFT JOIN chat c ON i.intercambio_id = c.intercambio_id
LEFT JOIN mensaje m ON c.chat_id = m.chat_id
WHERE i.intercambio_id = 7
GROUP BY c.chat_id, c.fecha_creacion, c.ultimo_mensaje, c.activo;

-- 6. Verificar propuestas relacionadas (si existen)
SELECT 
    p.propuesta_id,
    p.tipo_propuesta,
    p.estado,
    p.fecha_creacion,
    up.nombre as propone_nombre,
    ur.nombre as recibe_nombre
FROM intercambio i
LEFT JOIN chat c ON i.intercambio_id = c.intercambio_id
LEFT JOIN propuesta p ON c.chat_id = p.chat_id
LEFT JOIN usuario up ON p.usuario_propone_id = up.user_id
LEFT JOIN usuario ur ON p.usuario_recibe_id = ur.user_id
WHERE i.intercambio_id = 7;
