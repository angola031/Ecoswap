-- =============================================
-- VERIFICAR PRODUCTOS PARA VERIFICACIÓN
-- =============================================

-- 1. Verificar total de productos
SELECT 
    'TOTAL PRODUCTOS' as tipo,
    COUNT(*) as total
FROM PRODUCTO;

-- 2. Verificar productos por estado de validación
SELECT 
    'PRODUCTOS POR ESTADO' as tipo,
    estado_validacion,
    COUNT(*) as cantidad
FROM PRODUCTO 
GROUP BY estado_validacion
ORDER BY estado_validacion;

-- 3. Verificar productos pendientes (los que deberían aparecer)
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

-- 4. Verificar productos recientes
SELECT 
    'PRODUCTOS RECIENTES' as tipo,
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion,
    user_id
FROM PRODUCTO 
ORDER BY fecha_creacion DESC 
LIMIT 10;

-- 5. Verificar usuarios con productos
SELECT 
    'USUARIOS CON PRODUCTOS' as tipo,
    u.user_id,
    u.email,
    u.nombre,
    u.apellido,
    u.verificado,
    COUNT(p.producto_id) as total_productos
FROM USUARIO u
LEFT JOIN PRODUCTO p ON u.user_id = p.user_id
WHERE p.producto_id IS NOT NULL
GROUP BY u.user_id, u.email, u.nombre, u.apellido, u.verificado
ORDER BY total_productos DESC;

-- 6. Verificar si hay productos sin estado_validacion
SELECT 
    'PRODUCTOS SIN ESTADO_VALIDACION' as tipo,
    producto_id,
    titulo,
    fecha_creacion
FROM PRODUCTO 
WHERE estado_validacion IS NULL
ORDER BY fecha_creacion DESC;

-- 7. Mostrar estructura de la tabla PRODUCTO
SELECT 
    'ESTRUCTURA TABLA' as tipo,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name LIKE '%validacion%'
ORDER BY ordinal_position;

-- 8. Instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    'Si no hay productos pendientes, crear uno de prueba' as paso1,
    'Si hay productos pero no aparecen, verificar API' as paso2,
    'Si hay error en BD, ejecutar scripts de configuración' as paso3;
