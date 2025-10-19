-- Verificar la tabla visualizacion_producto
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar si la tabla visualizacion_producto existe
SELECT 
    'Verificación de tabla visualizacion_producto' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'visualizacion_producto' 
            AND table_schema = 'public'
        ) THEN '✅ Tabla visualizacion_producto existe'
        ELSE '❌ Tabla visualizacion_producto NO existe'
    END as status;

-- 2. Verificar estructura de la tabla
SELECT 
    'Estructura de tabla visualizacion_producto' as check_type,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Mostrar datos existentes
SELECT 
    'Datos en visualizacion_producto' as info,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos,
    MIN(fecha_visualizacion) as fecha_mas_antigua,
    MAX(fecha_visualizacion) as fecha_mas_reciente
FROM public.visualizacion_producto;

-- 4. Mostrar algunas visualizaciones de ejemplo
SELECT 
    'Visualizaciones de ejemplo' as muestra,
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    p.titulo as producto_titulo,
    u.nombre,
    u.apellido
FROM public.visualizacion_producto v
JOIN public.producto p ON v.producto_id = p.producto_id
JOIN public.usuario u ON v.usuario_id = u.user_id
ORDER BY v.fecha_visualizacion DESC
LIMIT 10;

-- 5. Si la tabla no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'visualizacion_producto' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.visualizacion_producto (
            visualizacion_id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES public.usuario(user_id) ON DELETE CASCADE,
            producto_id INTEGER NOT NULL REFERENCES public.producto(producto_id) ON DELETE CASCADE,
            fecha_visualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(usuario_id, producto_id)
        );
        
        COMMENT ON TABLE public.visualizacion_producto IS 'Registro de visualizaciones de productos por usuario';
        COMMENT ON COLUMN public.visualizacion_producto.visualizacion_id IS 'ID único de la visualización';
        COMMENT ON COLUMN public.visualizacion_producto.usuario_id IS 'ID del usuario que vio el producto';
        COMMENT ON COLUMN public.visualizacion_producto.producto_id IS 'ID del producto visto';
        COMMENT ON COLUMN public.visualizacion_producto.fecha_visualizacion IS 'Fecha y hora de la visualización';
        
        RAISE NOTICE 'Tabla visualizacion_producto creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla visualizacion_producto ya existe';
    END IF;
END $$;

-- 6. Verificar estado final
SELECT 
    'Estado final de visualizacion_producto' as reporte,
    COUNT(*) as total_registros,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos
FROM public.visualizacion_producto;
