-- =============================================
-- PRUEBA RÁPIDA DE IMÁGENES
-- =============================================

-- 1. Verificar que tenemos productos
SELECT 
    'PRODUCTOS DISPONIBLES' as tipo,
    COUNT(*) as total,
    MAX(producto_id) as ultimo_id
FROM PRODUCTO;

-- 2. Verificar imágenes existentes
SELECT 
    'IMÁGENES EXISTENTES' as tipo,
    COUNT(*) as total,
    COUNT(DISTINCT producto_id) as productos_con_imagenes
FROM IMAGEN_PRODUCTO;

-- 3. Crear una imagen de prueba
INSERT INTO IMAGEN_PRODUCTO (
    producto_id,
    url_imagen,
    descripcion_alt,
    es_principal,
    orden
) 
SELECT 
    (SELECT producto_id FROM PRODUCTO ORDER BY fecha_creacion DESC LIMIT 1),
    'https://via.placeholder.com/300x200?text=Prueba',
    'Imagen de prueba',
    true,
    1
WHERE EXISTS (SELECT 1 FROM PRODUCTO LIMIT 1)
RETURNING 
    imagen_id,
    producto_id,
    url_imagen;

-- 4. Verificar que se insertó
SELECT 
    'IMAGEN DE PRUEBA' as tipo,
    imagen_id,
    producto_id,
    url_imagen,
    fecha_subida
FROM IMAGEN_PRODUCTO 
WHERE url_imagen LIKE '%placeholder%'
ORDER BY fecha_subida DESC 
LIMIT 1;

-- 5. Limpiar imagen de prueba
DELETE FROM IMAGEN_PRODUCTO 
WHERE url_imagen LIKE '%placeholder%';

-- 6. Resultado final
SELECT 
    'RESULTADO' as tipo,
    CASE 
        WHEN (SELECT COUNT(*) FROM IMAGEN_PRODUCTO WHERE url_imagen LIKE '%placeholder%') = 0 
        THEN '✅ OK - La tabla IMAGEN_PRODUCTO funciona correctamente'
        ELSE '❌ ERROR - Problema con la tabla IMAGEN_PRODUCTO'
    END as estado;
