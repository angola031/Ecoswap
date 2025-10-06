-- Script para migrar intercambios existentes al nuevo sistema de validación
-- Este script actualiza intercambios que ya están en estado 'aceptado' para usar el nuevo flujo

-- 1. Actualizar intercambios existentes que están en estado 'aceptado' a 'en_progreso'
-- Esto permite que puedan ser validados con el nuevo sistema
UPDATE public.intercambio 
SET estado = 'en_progreso'
WHERE estado = 'aceptado' 
AND fecha_completado IS NULL;

-- 2. Crear validaciones automáticas para intercambios ya completados
-- Si un intercambio ya tiene fecha_completado, asumimos que fue exitoso
INSERT INTO public.validacion_intercambio (
    intercambio_id,
    usuario_id,
    es_exitoso,
    calificacion,
    comentario,
    aspectos_destacados,
    fecha_validacion
)
SELECT 
    i.intercambio_id,
    i.usuario_propone_id,
    true, -- Asumimos que fue exitoso
    5, -- Calificación perfecta por defecto
    'Migrado del sistema anterior - intercambio completado exitosamente',
    'Intercambio completado antes de implementar el sistema de validación',
    i.fecha_completado
FROM public.intercambio i
WHERE i.estado = 'completado' 
AND i.fecha_completado IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.validacion_intercambio v 
    WHERE v.intercambio_id = i.intercambio_id 
    AND v.usuario_id = i.usuario_propone_id
);

-- Hacer lo mismo para el usuario que recibe
INSERT INTO public.validacion_intercambio (
    intercambio_id,
    usuario_id,
    es_exitoso,
    calificacion,
    comentario,
    aspectos_destacados,
    fecha_validacion
)
SELECT 
    i.intercambio_id,
    i.usuario_recibe_id,
    true, -- Asumimos que fue exitoso
    5, -- Calificación perfecta por defecto
    'Migrado del sistema anterior - intercambio completado exitosamente',
    'Intercambio completado antes de implementar el sistema de validación',
    i.fecha_completado
FROM public.intercambio i
WHERE i.estado = 'completado' 
AND i.fecha_completado IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.validacion_intercambio v 
    WHERE v.intercambio_id = i.intercambio_id 
    AND v.usuario_id = i.usuario_recibe_id
);

-- 3. Actualizar estadísticas de usuarios basadas en intercambios completados
-- Esto asegura que las estadísticas estén actualizadas
UPDATE public.usuario 
SET total_intercambios = (
    SELECT COUNT(*) 
    FROM public.intercambio 
    WHERE (usuario_propone_id = usuario.user_id OR usuario_recibe_id = usuario.user_id) 
    AND estado = 'completado'
);

-- 4. Actualizar calificaciones promedio basadas en calificaciones existentes
UPDATE public.usuario 
SET calificacion_promedio = (
    SELECT COALESCE(ROUND(AVG(puntuacion), 2), 0)
    FROM public.calificacion 
    WHERE calificado_id = usuario.user_id 
    AND es_publica = true
);

-- 5. Agregar eco puntos por intercambios completados (10 puntos por intercambio)
UPDATE public.usuario 
SET eco_puntos = (
    SELECT COALESCE(COUNT(*) * 10, 0)
    FROM public.intercambio 
    WHERE (usuario_propone_id = usuario.user_id OR usuario_recibe_id = usuario.user_id) 
    AND estado = 'completado'
);

-- 6. Verificar la migración
DO $$
DECLARE
    intercambios_migrados INTEGER;
    validaciones_creadas INTEGER;
    usuarios_actualizados INTEGER;
BEGIN
    -- Contar intercambios migrados
    SELECT COUNT(*) INTO intercambios_migrados
    FROM public.intercambio 
    WHERE estado = 'en_progreso';
    
    -- Contar validaciones creadas
    SELECT COUNT(*) INTO validaciones_creadas
    FROM public.validacion_intercambio;
    
    -- Contar usuarios con estadísticas actualizadas
    SELECT COUNT(*) INTO usuarios_actualizados
    FROM public.usuario 
    WHERE total_intercambios > 0 OR eco_puntos > 0;
    
    RAISE NOTICE '📊 Migración completada:';
    RAISE NOTICE '   - Intercambios migrados a "en_progreso": %', intercambios_migrados;
    RAISE NOTICE '   - Validaciones creadas: %', validaciones_creadas;
    RAISE NOTICE '   - Usuarios con estadísticas actualizadas: %', usuarios_actualizados;
    RAISE NOTICE '✅ Sistema listo para usar el nuevo flujo de validación';
END $$;

