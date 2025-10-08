-- Script para listar todos los intercambios disponibles
-- Útil para verificar qué intercambios existen en la base de datos

-- 1. Listar todos los intercambios con información básica
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
ORDER BY intercambio_id DESC
LIMIT 20;

-- 2. Contar intercambios por estado
SELECT 
    estado,
    COUNT(*) as cantidad
FROM intercambio 
GROUP BY estado
ORDER BY cantidad DESC;

-- 3. Intercambios recientes (últimos 30 días)
SELECT 
    intercambio_id,
    estado,
    fecha_propuesta,
    usuario_propone_id,
    usuario_recibe_id
FROM intercambio 
WHERE fecha_propuesta >= NOW() - INTERVAL '30 days'
ORDER BY fecha_propuesta DESC;

-- 4. Intercambios pendientes de validación
SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    COUNT(v.validacion_id) as validaciones_realizadas,
    CASE 
        WHEN COUNT(v.validacion_id) = 0 THEN 'Sin validaciones'
        WHEN COUNT(v.validacion_id) = 1 THEN 'Pendiente de validación'
        WHEN COUNT(v.validacion_id) = 2 THEN 'Ambos validaron'
        ELSE 'Error en validaciones'
    END as estado_validacion
FROM intercambio i
LEFT JOIN validacion_intercambio v ON i.intercambio_id = v.intercambio_id
WHERE i.estado IN ('aceptado', 'en_progreso', 'pendiente_validacion')
GROUP BY i.intercambio_id, i.estado, i.fecha_propuesta
ORDER BY i.intercambio_id DESC;

-- 5. Verificar usuarios activos que tienen intercambios
SELECT 
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.activo,
    COUNT(i.intercambio_id) as total_intercambios
FROM usuario u
JOIN intercambio i ON (u.user_id = i.usuario_propone_id OR u.user_id = i.usuario_recibe_id)
WHERE u.activo = true
GROUP BY u.user_id, u.nombre, u.apellido, u.email, u.activo
ORDER BY total_intercambios DESC
LIMIT 20;
