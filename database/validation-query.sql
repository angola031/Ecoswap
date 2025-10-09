-- =====================================================
-- CONSULTA DE VALIDACIÓN DE INTERCAMBIOS
-- =====================================================
-- Esta es la consulta principal que debe usar tu API para validar intercambios
-- Reemplaza {INTERCAMBIO_ID} con el ID real del intercambio a validar

-- CONSULTA PRINCIPAL PARA VALIDAR UN INTERCAMBIO ESPECÍFICO
-- =====================================================
SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_propuesta,
    i.fecha_encuentro,
    i.lugar_encuentro,
    i.mensaje_propuesta,
    i.condiciones_adicionales,
    i.usuario_propone_id,
    i.usuario_recibe_id,
    i.producto_ofrecido_id,
    i.producto_solicitado_id,
    -- Información del usuario que propone
    up.user_id as propone_user_id,
    up.nombre as propone_nombre,
    up.apellido as propone_apellido,
    up.email as propone_email,
    up.telefono as propone_telefono,
    up.calificacion_promedio as propone_calificacion,
    up.total_intercambios as propone_total_intercambios,
    -- Información del usuario que recibe
    ur.user_id as recibe_user_id,
    ur.nombre as recibe_nombre,
    ur.apellido as recibe_apellido,
    ur.email as recibe_email,
    ur.telefono as recibe_telefono,
    ur.calificacion_promedio as recibe_calificacion,
    ur.total_intercambios as recibe_total_intercambios,
    -- Información del producto ofrecido
    po.producto_id as ofrecido_id,
    po.titulo as ofrecido_titulo,
    po.descripcion as ofrecido_descripcion,
    po.precio as ofrecido_precio,
    po.estado_publicacion as ofrecido_estado,
    po.tipo_transaccion as ofrecido_tipo,
    -- Información del producto solicitado
    ps.producto_id as solicitado_id,
    ps.titulo as solicitado_titulo,
    ps.descripcion as solicitado_descripcion,
    ps.precio as solicitado_precio,
    ps.estado_publicacion as solicitado_estado,
    ps.tipo_transaccion as solicitado_tipo,
    -- Información del chat
    c.chat_id,
    c.fecha_creacion as chat_fecha_creacion,
    c.ultimo_mensaje as chat_ultimo_mensaje,
    c.activo as chat_activo,
    -- Validaciones
    CASE 
        WHEN i.intercambio_id IS NULL THEN false
        WHEN i.estado NOT IN ('en_progreso', 'pendiente_validacion') THEN false
        WHEN up.user_id IS NULL THEN false
        WHEN ur.user_id IS NULL THEN false
        WHEN NOT up.activo THEN false
        WHEN NOT ur.activo THEN false
        WHEN po.producto_id IS NULL THEN false
        WHEN ps.producto_id IS NULL THEN false
        WHEN po.estado_publicacion != 'activo' THEN false
        WHEN ps.estado_publicacion != 'activo' THEN false
        WHEN c.chat_id IS NULL THEN false
        ELSE true
    END as puede_validarse,
    -- Mensaje de error detallado
    CASE 
        WHEN i.intercambio_id IS NULL THEN 'Intercambio no encontrado'
        WHEN i.estado NOT IN ('en_progreso', 'pendiente_validacion') THEN 'Estado inválido para validación: ' || i.estado
        WHEN up.user_id IS NULL THEN 'Usuario que propone no existe'
        WHEN ur.user_id IS NULL THEN 'Usuario que recibe no existe'
        WHEN NOT up.activo THEN 'Usuario que propone está inactivo'
        WHEN NOT ur.activo THEN 'Usuario que recibe está inactivo'
        WHEN po.producto_id IS NULL THEN 'Producto ofrecido no existe'
        WHEN ps.producto_id IS NULL THEN 'Producto solicitado no existe'
        WHEN po.estado_publicacion != 'activo' THEN 'Producto ofrecido no está activo'
        WHEN ps.estado_publicacion != 'activo' THEN 'Producto solicitado no está activo'
        WHEN c.chat_id IS NULL THEN 'Chat asociado no existe'
        ELSE 'Intercambio válido para validación'
    END as mensaje_validacion,
    -- Verificar si ya tiene validaciones
    (SELECT COUNT(*) FROM public.validacion_intercambio vi WHERE vi.intercambio_id = i.intercambio_id) as validaciones_existentes
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
LEFT JOIN public.chat c ON i.intercambio_id = c.intercambio_id
WHERE i.intercambio_id = {INTERCAMBIO_ID}  -- Reemplaza con el ID real
LIMIT 1;

-- =====================================================
-- CONSULTA ALTERNATIVA SIMPLIFICADA
-- =====================================================
-- Si solo necesitas verificar si existe y puede validarse:

SELECT 
    i.intercambio_id,
    i.estado,
    CASE 
        WHEN i.estado IN ('en_progreso', 'pendiente_validacion') 
        AND up.activo = true 
        AND ur.activo = true 
        AND po.estado_publicacion = 'activo' 
        AND ps.estado_publicacion = 'activo'
        THEN true 
        ELSE false 
    END as es_valido_para_validacion,
    CASE 
        WHEN i.intercambio_id IS NULL THEN 'Intercambio no encontrado'
        WHEN i.estado NOT IN ('en_progreso', 'pendiente_validacion') THEN 'Estado inválido: ' || i.estado
        WHEN up.user_id IS NULL OR ur.user_id IS NULL THEN 'Usuario no encontrado'
        WHEN NOT up.activo OR NOT ur.activo THEN 'Usuario inactivo'
        WHEN po.producto_id IS NULL OR ps.producto_id IS NULL THEN 'Producto no encontrado'
        WHEN po.estado_publicacion != 'activo' OR ps.estado_publicacion != 'activo' THEN 'Producto inactivo'
        ELSE 'OK'
    END as mensaje
FROM public.intercambio i
LEFT JOIN public.usuario up ON i.usuario_propone_id = up.user_id
LEFT JOIN public.usuario ur ON i.usuario_recibe_id = ur.user_id
LEFT JOIN public.producto po ON i.producto_ofrecido_id = po.producto_id
LEFT JOIN public.producto ps ON i.producto_solicitado_id = ps.producto_id
WHERE i.intercambio_id = {INTERCAMBIO_ID}  -- Reemplaza con el ID real
LIMIT 1;

-- =====================================================
-- CONSULTA PARA LISTAR INTERCAMBIOS PENDIENTES DE VALIDACIÓN
-- =====================================================
-- Para obtener todos los intercambios que pueden ser validados por un usuario específico:

SELECT 
    i.intercambio_id,
    i.estado,
    i.fecha_encuentro,
    i.lugar_encuentro,
    up.nombre || ' ' || up.apellido AS propone_nombre,
    ur.nombre || ' ' || ur.apellido AS recibe_nombre,
    po.titulo AS producto_ofrecido,
    ps.titulo AS producto_solicitado,
    c.chat_id
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
  AND (i.usuario_propone_id = {USER_ID} OR i.usuario_recibe_id = {USER_ID})  -- Reemplaza con el ID del usuario
ORDER BY i.fecha_encuentro DESC;

-- =====================================================
-- CONSULTA PARA INSERTAR VALIDACIÓN
-- =====================================================
-- Para insertar una nueva validación de intercambio:

INSERT INTO public.validacion_intercambio (
    intercambio_id,
    usuario_id,
    es_exitoso,
    calificacion,
    comentario,
    aspectos_destacados,
    fecha_validacion
) VALUES (
    {INTERCAMBIO_ID},        -- ID del intercambio
    {USER_ID},               -- ID del usuario que valida
    {ES_EXITOSO},            -- true/false
    {CALIFICACION},          -- 1-5 (opcional si es_exitoso = false)
    '{COMENTARIO}',          -- Comentario del usuario
    '{ASPECTOS}',            -- Aspectos destacados (opcional)
    NOW()
);

-- =====================================================
-- CONSULTA PARA ACTUALIZAR ESTADO DEL INTERCAMBIO DESPUÉS DE VALIDACIÓN
-- =====================================================
-- Para marcar el intercambio como completado después de la validación:

UPDATE public.intercambio 
SET 
    estado = 'completado',
    fecha_completado = NOW()
WHERE intercambio_id = {INTERCAMBIO_ID};

-- =====================================================
-- CONSULTA PARA ACTUALIZAR ESTADÍSTICAS DE USUARIOS
-- =====================================================
-- Para actualizar las estadísticas de los usuarios después de una validación exitosa:

-- Actualizar usuario que propone
UPDATE public.usuario 
SET 
    total_intercambios = total_intercambios + 1,
    eco_puntos = eco_puntos + 10  -- Puntos por intercambio exitoso
WHERE user_id = {PROPONE_USER_ID};

-- Actualizar usuario que recibe
UPDATE public.usuario 
SET 
    total_intercambios = total_intercambios + 1,
    eco_puntos = eco_puntos + 10  -- Puntos por intercambio exitoso
WHERE user_id = {RECIBE_USER_ID};

-- =====================================================
-- EJEMPLO DE USO COMPLETO
-- =====================================================
-- Aquí tienes un ejemplo de cómo usar estas consultas en tu API:

/*
// 1. Verificar si el intercambio puede ser validado
const validationCheck = await db.query(`
    SELECT puede_validarse, mensaje_validacion 
    FROM (
        -- Aquí va la primera consulta de este archivo
    ) validation_result
    WHERE intercambio_id = $1
`, [intercambioId]);

if (!validationCheck.rows[0]?.puede_validarse) {
    return { error: validationCheck.rows[0]?.mensaje_validacion };
}

// 2. Insertar la validación
await db.query(`
    INSERT INTO public.validacion_intercambio (...)
    VALUES (...)
`, [intercambioId, userId, esExitoso, calificacion, comentario, aspectos]);

// 3. Actualizar estado del intercambio
await db.query(`
    UPDATE public.intercambio 
    SET estado = 'completado', fecha_completado = NOW()
    WHERE intercambio_id = $1
`, [intercambioId]);

// 4. Actualizar estadísticas de usuarios
await db.query(`
    UPDATE public.usuario 
    SET total_intercambios = total_intercambios + 1, eco_puntos = eco_puntos + 10
    WHERE user_id IN ($1, $2)
`, [usuarioProponeId, usuarioRecibeId]);
*/
