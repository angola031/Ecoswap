-- Crear datos de prueba para visualizaciones de productos
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar que la tabla visualizacion_producto existe
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

-- 2. Si la tabla no existe, crearla
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
        RAISE NOTICE 'Tabla visualizacion_producto creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla visualizacion_producto ya existe';
    END IF;
END $$;

-- 3. Crear datos de prueba para el usuario 1
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES 
    (1, 16, NOW() - INTERVAL '2 days'),
    (1, 18, NOW() - INTERVAL '1 day'),
    (1, 16, NOW() - INTERVAL '3 hours')
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion;

-- 4. Crear datos de prueba para el usuario 19
INSERT INTO public.visualizacion_producto (usuario_id, producto_id, fecha_visualizacion)
VALUES 
    (19, 16, NOW() - INTERVAL '1 day'),
    (19, 18, NOW() - INTERVAL '2 hours')
ON CONFLICT (usuario_id, producto_id) 
DO UPDATE SET fecha_visualizacion = EXCLUDED.fecha_visualizacion;

-- 5. Verificar los datos creados
SELECT 
    'Datos de prueba creados' as info,
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
ORDER BY v.fecha_visualizacion DESC;

-- 6. Estadísticas generales
SELECT 
    'Estadísticas de visualizaciones' as reporte,
    COUNT(*) as total_visualizaciones,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_unicos
FROM public.visualizacion_producto;
