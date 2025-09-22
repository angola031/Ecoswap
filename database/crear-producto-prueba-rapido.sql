-- =============================================
-- CREAR PRODUCTO DE PRUEBA RÁPIDO
-- =============================================

-- 1. Verificar usuarios admin
SELECT 
    'ADMINS DISPONIBLES' as tipo,
    user_id,
    email,
    es_admin
FROM USUARIO 
WHERE es_admin = true;

-- 2. Crear producto de prueba si no existe
INSERT INTO PRODUCTO (
    user_id,
    titulo,
    descripcion,
    estado,
    tipo_transaccion,
    precio,
    precio_negociable,
    estado_publicacion,
    estado_validacion
) 
SELECT 
    (SELECT user_id FROM USUARIO WHERE es_admin = true LIMIT 1),
    'Producto de Prueba - ' || TO_CHAR(NOW(), 'HH24:MI:SS'),
    'Este es un producto de prueba creado automáticamente para verificar el sistema de validación.',
    'usado',
    'venta',
    FLOOR(RANDOM() * 100000) + 10000, -- Precio aleatorio entre 10,000 y 110,000
    true,
    'activo',
    'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM PRODUCTO 
    WHERE titulo LIKE 'Producto de Prueba -%'
    AND estado_validacion = 'pending'
)
RETURNING 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion;

-- 3. Verificar productos pendientes
SELECT 
    'PRODUCTOS PENDIENTES' as tipo,
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion,
    user_id
FROM PRODUCTO 
WHERE estado_validacion = 'pending'
ORDER BY fecha_creacion DESC;

-- 4. Conteo total por estado
SELECT 
    'CONTEO POR ESTADO' as tipo,
    estado_validacion,
    COUNT(*) as cantidad
FROM PRODUCTO 
GROUP BY estado_validacion
ORDER BY estado_validacion;

-- 5. Mostrar instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    'Si se creó un producto, debería aparecer en el dashboard' as paso1,
    'Recarga la página del dashboard y ve a la sección Productos' as paso2,
    'Revisa los logs en la consola del navegador' as paso3;
