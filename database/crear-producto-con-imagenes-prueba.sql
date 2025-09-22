-- =============================================
-- CREAR PRODUCTO DE PRUEBA CON IMÁGENES
-- =============================================

-- Insertar un producto de prueba
INSERT INTO producto (
    user_id,
    titulo,
    descripcion,
    estado,
    tipo_transaccion,
    precio,
    precio_negociable,
    estado_publicacion,
    estado_validacion
) VALUES (
    1, -- Asumiendo que existe un usuario con ID 1
    'iPhone 12 Pro Max - Estado Excelente',
    'iPhone 12 Pro Max en excelente estado, sin rayones, con cargador original y caja. Color azul pacífico, 128GB. Perfecto para intercambio o venta.',
    'usado',
    'venta',
    2500000,
    true,
    'activo',
    'pending'
) RETURNING producto_id;

-- Nota: El producto_id se generará automáticamente
-- Ahora necesitas insertar las imágenes en la tabla imagen_producto
-- Reemplaza {PRODUCTO_ID} con el ID del producto creado

-- INSERT INTO imagen_producto (
--     producto_id,
--     url_imagen,
--     descripcion_alt,
--     es_principal,
--     orden
-- ) VALUES 
--     ({PRODUCTO_ID}, 'productos/user_1/{PRODUCTO_ID}/1.jpg', 'iPhone frontal', true, 1),
--     ({PRODUCTO_ID}, 'productos/user_1/{PRODUCTO_ID}/2.jpg', 'iPhone reverso', false, 2),
--     ({PRODUCTO_ID}, 'productos/user_1/{PRODUCTO_ID}/3.jpg', 'iPhone con caja', false, 3);

-- Verificar el producto creado
SELECT 
    p.producto_id,
    p.titulo,
    p.estado_validacion,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    COUNT(i.imagen_id) as total_imagenes
FROM producto p
LEFT JOIN usuario u ON p.user_id = u.user_id
LEFT JOIN imagen_producto i ON p.producto_id = i.producto_id
WHERE p.estado_validacion = 'pending'
GROUP BY p.producto_id, p.titulo, p.estado_validacion, u.nombre, u.apellido
ORDER BY p.producto_id DESC
LIMIT 5;
