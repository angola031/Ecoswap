-- Script para configurar un intercambio existente para validación
-- Usando el intercambio ID 2 que existe en la base de datos

-- Primero, verificar el estado actual del intercambio ID 2
SELECT 
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    producto_ofrecido_id,
    producto_solicitado_id,
    fecha_propuesta,
    fecha_completado
FROM public.intercambio 
WHERE intercambio_id = 2;

-- Actualizar el intercambio ID 2 para que esté en estado válido para validación
UPDATE public.intercambio 
SET 
    estado = 'pendiente_validacion',
    fecha_encuentro = NOW() - INTERVAL '1 hour',
    lugar_encuentro = 'Parque Principal'
WHERE intercambio_id = 2;

-- Verificar que se actualizó correctamente
SELECT 
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    fecha_encuentro,
    lugar_encuentro
FROM public.intercambio 
WHERE intercambio_id = 2;

-- Crear un chat asociado si no existe
INSERT INTO public.chat (intercambio_id, fecha_creacion)
SELECT 2, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = 2);

-- Verificar que el chat se creó
SELECT * FROM public.chat WHERE intercambio_id = 2;

-- Limpiar validaciones existentes para este intercambio (si las hay)
DELETE FROM public.validacion_intercambio WHERE intercambio_id = 2;

-- Verificar que no hay validaciones
SELECT * FROM public.validacion_intercambio WHERE intercambio_id = 2;
