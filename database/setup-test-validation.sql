-- Script para configurar un intercambio existente para pruebas de validación
-- Basado en los datos que se ven en el dashboard de Supabase

-- Verificar el estado actual del intercambio ID 2 (que existe según el dashboard)
SELECT 
    'Estado actual del intercambio ID 2:' as info,
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    producto_ofrecido_id,
    producto_solicitado_id,
    fecha_propuesta
FROM public.intercambio 
WHERE intercambio_id = 2;

-- Actualizar el intercambio ID 2 para que esté listo para validación
UPDATE public.intercambio 
SET 
    estado = 'pendiente_validacion',
    fecha_encuentro = NOW() - INTERVAL '1 hour',
    lugar_encuentro = 'Parque Principal, Centro de la ciudad',
    notas_encuentro = 'Intercambio de prueba configurado para validación'
WHERE intercambio_id = 2;

-- Verificar que se actualizó correctamente
SELECT 
    'Intercambio ID 2 actualizado:' as info,
    intercambio_id,
    estado,
    usuario_propone_id,
    usuario_recibe_id,
    fecha_encuentro,
    lugar_encuentro,
    notas_encuentro
FROM public.intercambio 
WHERE intercambio_id = 2;

-- Asegurar que existe un chat para este intercambio
INSERT INTO public.chat (intercambio_id, fecha_creacion, activo)
SELECT 2, NOW(), true
WHERE NOT EXISTS (SELECT 1 FROM public.chat WHERE intercambio_id = 2);

-- Limpiar cualquier validación previa para empezar limpio
DELETE FROM public.validacion_intercambio WHERE intercambio_id = 2;

-- Verificar que el chat existe y no hay validaciones
SELECT 
    'Chat creado:' as info,
    chat_id,
    intercambio_id,
    fecha_creacion,
    activo
FROM public.chat 
WHERE intercambio_id = 2;

SELECT 
    'Validaciones limpiadas:' as info,
    COUNT(*) as total_validaciones
FROM public.validacion_intercambio 
WHERE intercambio_id = 2;

-- Mostrar información del usuario 1 (que está involucrado en el intercambio)
SELECT 
    'Usuario 1 (involucrado en intercambio):' as info,
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE user_id = 1;

-- Mostrar información del otro usuario (usuario 19)
SELECT 
    'Usuario 19 (el otro participante):' as info,
    user_id,
    nombre,
    apellido,
    email,
    activo
FROM public.usuario 
WHERE user_id = 19;
