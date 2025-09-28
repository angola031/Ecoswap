-- Script para validar la conexión entre marketplace y tabla de visualización
-- Verificar que todo está funcionando correctamente

-- PASO 1: Verificar que la función register_product_view existe
SELECT '=== VERIFICANDO FUNCIÓN register_product_view ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- PASO 2: Verificar estructura de las tablas
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLAS ===' as info;

-- Tabla visualizacion_producto
SELECT 
    'visualizacion_producto' as tabla,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Tabla estadistica_producto
SELECT 
    'estadistica_producto' as tabla,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'estadistica_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Tabla producto
SELECT 
    'producto' as tabla,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producto' 
    AND table_schema = 'public'
    AND column_name = 'visualizaciones'
ORDER BY ordinal_position;

-- PASO 3: Verificar datos de prueba
SELECT '=== VERIFICANDO DATOS DE PRUEBA ===' as info;

-- Usuarios disponibles
SELECT 
    'USUARIOS DISPONIBLES' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE auth_user_id IS NOT NULL;

-- Productos disponibles
SELECT 
    'PRODUCTOS DISPONIBLES' as tipo,
    COUNT(*) as cantidad
FROM public.producto 
WHERE estado_publicacion = 'activo';

-- Visualizaciones existentes
SELECT 
    'VISUALIZACIONES EXISTENTES' as tipo,
    COUNT(*) as cantidad
FROM public.visualizacion_producto;

-- Estadísticas diarias existentes
SELECT 
    'ESTADÍSTICAS DIARIAS EXISTENTES' as tipo,
    COUNT(*) as cantidad
FROM public.estadistica_producto;

-- PASO 4: Obtener datos específicos para prueba
SELECT '=== DATOS ESPECÍFICOS PARA PRUEBA ===' as info;

-- Primer usuario
SELECT 
    'USUARIO DE PRUEBA' as tipo,
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 1;

-- Primer producto
SELECT 
    'PRODUCTO DE PRUEBA' as tipo,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- PASO 5: Verificar estado actual de visualizaciones
SELECT '=== ESTADO ACTUAL DE VISUALIZACIONES ===' as info;

-- Visualizaciones recientes
SELECT 
    'VISUALIZACIONES RECIENTES' as tipo,
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    p.titulo as producto_titulo
FROM public.visualizacion_producto v
JOIN public.usuario u ON v.usuario_id = u.user_id
JOIN public.producto p ON v.producto_id = p.producto_id
ORDER BY v.fecha_visualizacion DESC
LIMIT 5;

-- Estadísticas diarias recientes
SELECT 
    'ESTADÍSTICAS DIARIAS RECIENTES' as tipo,
    ep.producto_id,
    p.titulo as producto_titulo,
    ep.fecha,
    ep.visualizaciones_dia
FROM public.estadistica_producto ep
JOIN public.producto p ON ep.producto_id = p.producto_id
ORDER BY ep.fecha DESC, ep.visualizaciones_dia DESC
LIMIT 5;

-- PASO 6: Prueba de la función register_product_view
SELECT '=== PRUEBA DE LA FUNCIÓN ===' as info;

SELECT '
INSTRUCCIONES PARA PROBAR LA FUNCIÓN:

1. Copiar los IDs del usuario y producto obtenidos arriba
2. Ejecutar esta consulta (reemplazar USER_ID y PRODUCTO_ID):

   SELECT register_product_view(USER_ID, PRODUCTO_ID) as resultado;

3. Verificar que se insertó en visualizacion_producto:
   SELECT * FROM public.visualizacion_producto 
   WHERE usuario_id = USER_ID AND producto_id = PRODUCTO_ID;

4. Verificar que se incrementó el contador en producto:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = PRODUCTO_ID;

5. Verificar que se actualizó estadistica_producto:
   SELECT * FROM public.estadistica_producto 
   WHERE producto_id = PRODUCTO_ID AND fecha = CURRENT_DATE;

6. Probar la API de estadísticas:
   GET /api/products/PRODUCTO_ID/stats
' as instrucciones_prueba;

-- PASO 7: Verificar conexión con marketplace
SELECT '=== VERIFICACIÓN DE CONEXIÓN CON MARKETPLACE ===' as info;

SELECT '
FLUJO DE VISUALIZACIONES EN EL MARKETPLACE:

1. Usuario navega a /producto/[id] (página de detalle)
2. Se ejecuta loadProduct() en app/producto/[id]/page.tsx
3. Se llama a POST /api/products/[id]/view
4. La API llama a register_product_view(usuario_id, producto_id)
5. La función:
   - Inserta en visualizacion_producto
   - Incrementa producto.visualizaciones
   - Actualiza estadistica_producto.visualizaciones_dia

6. En el marketplace (ProductsModule.tsx):
   - Se llama a GET /api/products/[id]/stats
   - La API retorna producto.visualizaciones como views
   - Se muestra en la UI con EyeIcon

VERIFICAR:
- Que la función register_product_view existe
- Que se ejecuta cuando se visita un producto
- Que la API /api/products/[id]/stats retorna las views correctas
- Que el marketplace muestra las views correctas
' as flujo_marketplace;
