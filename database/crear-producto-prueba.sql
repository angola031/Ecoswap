-- =============================================
-- CREAR PRODUCTO DE PRUEBA PARA VERIFICACIÓN
-- =============================================

-- 1. Verificar si hay usuarios
SELECT 
    'USUARIOS DISPONIBLES' as tipo,
    user_id,
    email,
    nombre,
    apellido,
    verificado
FROM USUARIO 
WHERE activo = true
ORDER BY user_id DESC 
LIMIT 5;

-- 2. Crear un producto de prueba si no existe
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
    (SELECT user_id FROM USUARIO WHERE activo = true LIMIT 1),
    'Producto de Prueba para Verificación',
    'Este es un producto creado automáticamente para probar el sistema de verificación de productos.',
    'usado',
    'venta',
    50000.00,
    true,
    'activo',
    'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM PRODUCTO 
    WHERE titulo = 'Producto de Prueba para Verificación'
)
RETURNING 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion;

-- 3. Verificar productos creados
SELECT 
    'PRODUCTOS CREADOS' as tipo,
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion,
    user_id
FROM PRODUCTO 
WHERE estado_validacion = 'pending'
ORDER BY fecha_creacion DESC;

-- 4. Verificar conteo por estado
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
    'Si se creó un producto de prueba, debería aparecer en el dashboard' as paso1,
    'Si no aparece, revisar los logs de la API en la consola' as paso2,
    'Verificar que el usuario admin esté correctamente configurado' as paso3;
