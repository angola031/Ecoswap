-- Script para crear un intercambio de prueba si no existe el ID 7
-- IMPORTANTE: Ejecutar solo si el intercambio ID 7 no existe

-- 1. Verificar si ya existe el intercambio ID 7
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM intercambio WHERE intercambio_id = 7) THEN
        RAISE NOTICE 'El intercambio ID 7 ya existe. No se creará uno nuevo.';
    ELSE
        RAISE NOTICE 'El intercambio ID 7 no existe. Se creará uno de prueba.';
    END IF;
END $$;

-- 2. Crear intercambio de prueba (solo si no existe)
INSERT INTO intercambio (
    intercambio_id,
    producto_ofrecido_id,
    producto_solicitado_id,
    usuario_propone_id,
    usuario_recibe_id,
    mensaje_propuesta,
    estado,
    fecha_propuesta
)
SELECT 
    7,
    (SELECT producto_id FROM producto WHERE estado_publicacion = 'activo' LIMIT 1),
    (SELECT producto_id FROM producto WHERE estado_publicacion = 'activo' AND producto_id != (SELECT producto_id FROM producto WHERE estado_publicacion = 'activo' LIMIT 1) LIMIT 1),
    (SELECT user_id FROM usuario WHERE activo = true LIMIT 1),
    (SELECT user_id FROM usuario WHERE activo = true AND user_id != (SELECT user_id FROM usuario WHERE activo = true LIMIT 1) LIMIT 1),
    'Intercambio de prueba para testing de validación',
    'pendiente_validacion',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM intercambio WHERE intercambio_id = 7);

-- 3. Verificar que se creó correctamente
SELECT 
    intercambio_id,
    usuario_propone_id,
    usuario_recibe_id,
    estado,
    fecha_propuesta,
    producto_ofrecido_id,
    producto_solicitado_id
FROM intercambio 
WHERE intercambio_id = 7;

-- 4. Crear chat asociado si no existe
INSERT INTO chat (
    intercambio_id,
    fecha_creacion,
    activo
)
SELECT 
    7,
    NOW(),
    true
WHERE NOT EXISTS (SELECT 1 FROM chat WHERE intercambio_id = 7);

-- 5. Verificar el chat creado
SELECT 
    chat_id,
    intercambio_id,
    fecha_creacion,
    activo
FROM chat 
WHERE intercambio_id = 7;
