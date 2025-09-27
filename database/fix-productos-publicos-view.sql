-- =============================================
-- CORRECCIÓN DE VISTA PRODUCTOS_PUBLICOS
-- =============================================
-- Este script corrige la vista PRODUCTOS_PUBLICOS para incluir el email del usuario
-- y el campo visualizaciones que faltaban

-- Recrear la vista PRODUCTOS_PUBLICOS con los campos faltantes
CREATE OR REPLACE VIEW PRODUCTOS_PUBLICOS AS
SELECT 
    p.producto_id,
    p.titulo,
    p.descripcion,
    p.precio,
    p.estado,
    p.tipo_transaccion,
    p.precio_negociable,
    p.condiciones_intercambio,
    p.que_busco_cambio,
    p.fecha_creacion,
    p.fecha_actualizacion,
    p.fecha_publicacion,
    p.visualizaciones,
    u.user_id,
    u.nombre as usuario_nombre,
    u.apellido as usuario_apellido,
    u.email as usuario_email,
    u.foto_perfil as usuario_foto,
    u.calificacion_promedio as usuario_calificacion,
    u.total_intercambios as usuario_total_intercambios,
    c.nombre as categoria_nombre,
    ub.ciudad,
    ub.departamento
FROM PRODUCTO p
LEFT JOIN USUARIO u ON p.user_id = u.user_id
LEFT JOIN CATEGORIA c ON p.categoria_id = c.categoria_id
LEFT JOIN UBICACION ub ON u.user_id = ub.user_id AND ub.es_principal = true
WHERE p.estado_validacion = 'approved' 
AND p.estado_publicacion = 'activo'
AND u.activo = true;

-- Verificar que la vista se creó correctamente
SELECT 
    'Vista PRODUCTOS_PUBLICOS actualizada correctamente' as mensaje,
    COUNT(*) as total_productos_publicos
FROM PRODUCTOS_PUBLICOS;

-- Mostrar estructura de la vista
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'productos_publicos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

