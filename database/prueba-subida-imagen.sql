-- =============================================
-- PRUEBA DE SUBIDA DE IMAGEN
-- =============================================

-- 1. Verificar que tenemos productos para probar
SELECT 
    'PRODUCTOS PARA PRUEBA' as tipo,
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion
FROM PRODUCTO 
WHERE estado_validacion = 'pending'
ORDER BY fecha_creacion DESC 
LIMIT 3;

-- 2. Verificar imágenes existentes
SELECT 
    'IMÁGENES EXISTENTES' as tipo,
    COUNT(*) as total,
    COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM IMAGEN_PRODUCTO;

-- 3. Verificar imágenes recientes
SELECT 
    'IMÁGENES RECIENTES' as tipo,
    imagen_id,
    producto_id,
    url_imagen,
    es_principal,
    orden,
    fecha_subida
FROM IMAGEN_PRODUCTO 
ORDER BY fecha_subida DESC 
LIMIT 5;

-- 4. Verificar usuarios con productos
SELECT 
    'USUARIOS CON PRODUCTOS' as tipo,
    u.user_id,
    u.email,
    u.nombre,
    u.apellido,
    u.auth_user_id,
    COUNT(p.producto_id) as total_productos
FROM USUARIO u
LEFT JOIN PRODUCTO p ON u.user_id = p.user_id
WHERE p.producto_id IS NOT NULL
GROUP BY u.user_id, u.email, u.nombre, u.apellido, u.auth_user_id
ORDER BY total_productos DESC;

-- 5. Crear una imagen de prueba manualmente
INSERT INTO IMAGEN_PRODUCTO (
    producto_id,
    url_imagen,
    descripcion_alt,
    es_principal,
    orden
) VALUES (
    (SELECT producto_id FROM PRODUCTO ORDER BY fecha_creacion DESC LIMIT 1),
    'https://via.placeholder.com/300x200?text=Imagen+de+Prueba',
    'Imagen de prueba para verificar que la tabla funciona',
    true,
    1
) RETURNING imagen_id, producto_id, url_imagen;

-- 6. Verificar que la imagen se insertó
SELECT 
    'IMAGEN DE PRUEBA' as tipo,
    imagen_id,
    producto_id,
    url_imagen,
    es_principal,
    orden,
    fecha_subida
FROM IMAGEN_PRODUCTO 
WHERE url_imagen LIKE '%placeholder%'
ORDER BY fecha_subida DESC 
LIMIT 1;

-- 7. Limpiar imagen de prueba (opcional)
-- DELETE FROM IMAGEN_PRODUCTO WHERE url_imagen LIKE '%placeholder%';

-- Mostrar instrucciones
SELECT 
    'INSTRUCCIONES' as tipo,
    'Si la imagen de prueba se insertó correctamente, la tabla funciona' as mensaje1,
    'El problema está en la subida a Storage o en el formulario' as mensaje2,
    'Revisa los logs en la consola del navegador' as mensaje3;
