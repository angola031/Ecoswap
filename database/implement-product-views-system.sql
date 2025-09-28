-- Script para implementar el sistema de visualizaciones de productos
-- Asume que ya existe la tabla visualizacion_producto

-- PASO 1: Verificar que las tablas existen
SELECT '=== VERIFICANDO TABLA VISUALIZACION_PRODUCTO ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

SELECT '=== VERIFICANDO TABLA ESTADISTICA_PRODUCTO ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'estadistica_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

-- PASO 2: Crear función para registrar visualización
CREATE OR REPLACE FUNCTION public.register_product_view(
    p_usuario_id INTEGER,
    p_producto_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    view_exists BOOLEAN;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Verificar si ya existe la visualización
    SELECT EXISTS(
        SELECT 1 FROM public.visualizacion_producto 
        WHERE usuario_id = p_usuario_id 
        AND producto_id = p_producto_id
    ) INTO view_exists;
    
    -- Si no existe, insertar la visualización
    IF NOT view_exists THEN
        INSERT INTO public.visualizacion_producto (usuario_id, producto_id)
        VALUES (p_usuario_id, p_producto_id);
        
        -- Incrementar contador en tabla producto
        UPDATE public.producto 
        SET visualizaciones = visualizaciones + 1 
        WHERE producto_id = p_producto_id;
        
        -- Actualizar estadísticas diarias
        INSERT INTO public.estadistica_producto (producto_id, fecha, visualizaciones_dia)
        VALUES (p_producto_id, current_date, 1)
        ON CONFLICT (producto_id, fecha) 
        DO UPDATE SET 
            visualizaciones_dia = estadistica_producto.visualizaciones_dia + 1;
        
        RETURN TRUE; -- Nueva visualización registrada
    ELSE
        RETURN FALSE; -- Ya había visto el producto
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log del error pero no fallar
        RAISE LOG 'Error en register_product_view para usuario % y producto %: %', 
                  p_usuario_id, p_producto_id, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Crear función para obtener contador de visualizaciones únicas
CREATE OR REPLACE FUNCTION public.get_unique_views_count(p_producto_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT usuario_id) 
        FROM public.visualizacion_producto 
        WHERE producto_id = p_producto_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Crear función para verificar si usuario ya vio el producto
CREATE OR REPLACE FUNCTION public.has_user_viewed_product(
    p_usuario_id INTEGER,
    p_producto_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.visualizacion_producto 
        WHERE usuario_id = p_usuario_id 
        AND producto_id = p_producto_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4.1: Crear función para obtener estadísticas diarias
CREATE OR REPLACE FUNCTION public.get_daily_product_stats(
    p_producto_id INTEGER,
    p_fecha DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    producto_id INTEGER,
    fecha DATE,
    visualizaciones_dia INTEGER,
    contactos_dia INTEGER,
    veces_guardado_dia INTEGER,
    propuestas_recibidas_dia INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ep.producto_id,
        ep.fecha,
        ep.visualizaciones_dia,
        ep.contactos_dia,
        ep.veces_guardado_dia,
        ep.propuestas_recibidas_dia
    FROM public.estadistica_producto ep
    WHERE ep.producto_id = p_producto_id 
    AND ep.fecha = p_fecha;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 5: Sincronizar contadores existentes (opcional)
-- Solo ejecutar si quieres sincronizar los contadores actuales
SELECT '=== SINCRONIZANDO CONTADORES EXISTENTES ===' as info;

-- Actualizar contadores basados en visualizaciones reales
UPDATE public.producto 
SET visualizaciones = (
    SELECT COUNT(DISTINCT usuario_id) 
    FROM public.visualizacion_producto 
    WHERE producto_id = public.producto.producto_id
);

-- PASO 6: Verificar implementación
SELECT '=== VERIFICANDO IMPLEMENTACIÓN ===' as info;

-- Mostrar algunos productos con sus contadores
SELECT 
    p.producto_id,
    p.titulo,
    p.visualizaciones as contador_actual,
    COUNT(DISTINCT v.usuario_id) as visualizaciones_reales,
    CASE 
        WHEN p.visualizaciones = COUNT(DISTINCT v.usuario_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado_sincronizacion
FROM public.producto p
LEFT JOIN public.visualizacion_producto v ON p.producto_id = v.producto_id
GROUP BY p.producto_id, p.titulo, p.visualizaciones
ORDER BY p.visualizaciones DESC
LIMIT 10;

-- PASO 7: Prueba de las funciones
SELECT '=== PRUEBA DE FUNCIONES ===' as info;

-- Ejemplo de uso de las funciones (comentado para evitar errores)
/*
-- Probar registro de visualización
SELECT register_product_view(1, 1) as nueva_visualizacion;

-- Probar verificación de visualización
SELECT has_user_viewed_product(1, 1) as ya_vio_producto;

-- Probar contador de visualizaciones únicas
SELECT get_unique_views_count(1) as total_visualizaciones_unicas;
*/

-- PASO 8: Mostrar estadísticas
SELECT '=== ESTADÍSTICAS DE VISUALIZACIONES ===' as info;

SELECT 
    'Total de visualizaciones registradas' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Usuarios únicos que han visto productos' as metrica,
    COUNT(DISTINCT usuario_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Productos con visualizaciones' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Promedio de visualizaciones por producto' as metrica,
    ROUND(COUNT(*)::numeric / COUNT(DISTINCT producto_id), 2) as valor
FROM public.visualizacion_producto;

SELECT '=== ESTADÍSTICAS DIARIAS ===' as info;

SELECT 
    'Total de registros de estadísticas diarias' as metrica,
    COUNT(*) as valor
FROM public.estadistica_producto

UNION ALL

SELECT 
    'Productos con estadísticas diarias' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.estadistica_producto

UNION ALL

SELECT 
    'Días con estadísticas registradas' as metrica,
    COUNT(DISTINCT fecha) as valor
FROM public.estadistica_producto

UNION ALL

SELECT 
    'Total de visualizaciones diarias registradas' as metrica,
    SUM(visualizaciones_dia) as valor
FROM public.estadistica_producto

UNION ALL

SELECT 
    'Promedio de visualizaciones por día' as metrica,
    ROUND(AVG(visualizaciones_dia), 2) as valor
FROM public.estadistica_producto;
