-- =============================================
-- VERIFICAR Y CREAR USUARIO ADMIN
-- =============================================

-- 1. Verificar usuarios existentes
SELECT 
    'USUARIOS EXISTENTES' as tipo,
    user_id,
    email,
    nombre,
    apellido,
    es_admin,
    verificado,
    auth_user_id
FROM USUARIO 
ORDER BY user_id DESC 
LIMIT 10;

-- 2. Verificar usuarios admin
SELECT 
    'USUARIOS ADMIN' as tipo,
    user_id,
    email,
    nombre,
    apellido,
    es_admin,
    admin_desde
FROM USUARIO 
WHERE es_admin = true
ORDER BY admin_desde DESC;

-- 3. Verificar usuarios con auth_user_id
SELECT 
    'USUARIOS CON AUTH_ID' as tipo,
    user_id,
    email,
    auth_user_id IS NOT NULL as tiene_auth_id
FROM USUARIO 
ORDER BY user_id DESC;

-- 4. Crear usuario admin si no existe
INSERT INTO USUARIO (
    nombre,
    apellido,
    email,
    password_hash,
    verificado,
    activo,
    es_admin,
    admin_desde
) 
SELECT 
    'Admin',
    'Sistema',
    'admin@ecoswap.com',
    'admin_hash_placeholder',
    true,
    true,
    true,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM USUARIO WHERE email = 'admin@ecoswap.com'
)
RETURNING 
    user_id,
    email,
    es_admin,
    admin_desde;

-- 5. Actualizar usuario existente a admin si es necesario
UPDATE USUARIO 
SET 
    es_admin = true,
    admin_desde = COALESCE(admin_desde, CURRENT_TIMESTAMP)
WHERE email = 'tu_email@ejemplo.com' 
AND es_admin = false
RETURNING 
    user_id,
    email,
    es_admin,
    admin_desde;

-- 6. Verificar productos pendientes
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

-- 7. Crear producto de prueba si no hay ninguno
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
    'Producto de Prueba para Verificación',
    'Este es un producto creado automáticamente para probar el sistema de verificación.',
    'usado',
    'venta',
    25000.00,
    true,
    'activo',
    'pending'
WHERE NOT EXISTS (
    SELECT 1 FROM PRODUCTO WHERE estado_validacion = 'pending'
)
RETURNING 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion;

-- 8. Mostrar resumen final
SELECT 
    'RESUMEN FINAL' as tipo,
    (SELECT COUNT(*) FROM USUARIO WHERE es_admin = true) as admins_total,
    (SELECT COUNT(*) FROM PRODUCTO WHERE estado_validacion = 'pending') as productos_pendientes,
    (SELECT COUNT(*) FROM PRODUCTO) as productos_total;

-- 9. Instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    '1. Si no hay admin, usar email: admin@ecoswap.com' as paso1,
    '2. Si no hay productos pendientes, se creó uno de prueba' as paso2,
    '3. Probar el dashboard de verificación' as paso3;
