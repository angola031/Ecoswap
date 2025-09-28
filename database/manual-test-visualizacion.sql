-- Script de prueba manual para la función register_product_view
-- IMPORTANTE: Cambiar los IDs por valores reales antes de ejecutar

-- PASO 1: Obtener IDs reales para la prueba
-- Ejecutar estas consultas primero para obtener IDs válidos:

-- Obtener un usuario válido
SELECT 
    'USUARIO PARA PRUEBA' as info,
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

-- Obtener un producto válido
SELECT 
    'PRODUCTO PARA PRUEBA' as info,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 1;

-- PASO 2: Verificar estado inicial
-- Cambiar [USER_ID] y [PRODUCTO_ID] por los valores obtenidos arriba

/*
-- Verificar estado inicial del producto
SELECT 
    'ESTADO INICIAL PRODUCTO' as info,
    producto_id,
    titulo,
    visualizaciones
FROM public.producto 
WHERE producto_id = [PRODUCTO_ID];

-- Verificar si ya existe visualización
SELECT 
    'VISUALIZACIÓN EXISTENTE' as info,
    visualizacion_id,
    usuario_id,
    producto_id,
    fecha_visualizacion
FROM public.visualizacion_producto 
WHERE usuario_id = [USER_ID] AND producto_id = [PRODUCTO_ID];

-- Verificar estadísticas diarias
SELECT 
    'ESTADÍSTICAS DIARIAS' as info,
    producto_id,
    fecha,
    visualizaciones_dia
FROM public.estadistica_producto 
WHERE producto_id = [PRODUCTO_ID] AND fecha = CURRENT_DATE;
*/

-- PASO 3: Ejecutar la función
-- Cambiar [USER_ID] y [PRODUCTO_ID] por los valores reales

/*
-- Probar la función register_product_view
SELECT register_product_view([USER_ID], [PRODUCTO_ID]) as resultado_funcion;
*/

-- PASO 4: Verificar resultados
-- Cambiar [USER_ID] y [PRODUCTO_ID] por los valores reales

/*
-- Verificar que se insertó en visualizacion_producto
SELECT 
    'DESPUÉS DE LA FUNCIÓN - visualizacion_producto' as info,
    visualizacion_id,
    usuario_id,
    producto_id,
    fecha_visualizacion
FROM public.visualizacion_producto 
WHERE usuario_id = [USER_ID] AND producto_id = [PRODUCTO_ID];

-- Verificar que se incrementó el contador en producto
SELECT 
    'DESPUÉS DE LA FUNCIÓN - producto' as info,
    producto_id,
    titulo,
    visualizaciones
FROM public.producto 
WHERE producto_id = [PRODUCTO_ID];

-- Verificar que se actualizó estadistica_producto
SELECT 
    'DESPUÉS DE LA FUNCIÓN - estadistica_producto' as info,
    producto_id,
    fecha,
    visualizaciones_dia
FROM public.estadistica_producto 
WHERE producto_id = [PRODUCTO_ID] AND fecha = CURRENT_DATE;
*/

-- PASO 5: Instrucciones
SELECT '
INSTRUCCIONES PARA EJECUTAR LA PRUEBA:

1. Ejecutar las consultas del PASO 1 para obtener IDs reales
2. Copiar los IDs obtenidos
3. Descomentar las consultas del PASO 2 y reemplazar [USER_ID] y [PRODUCTO_ID]
4. Ejecutar las consultas del PASO 2 para ver el estado inicial
5. Descomentar la consulta del PASO 3 y reemplazar los IDs
6. Ejecutar la función del PASO 3
7. Descomentar las consultas del PASO 4 y reemplazar los IDs
8. Ejecutar las consultas del PASO 4 para ver los resultados

Si la función funciona correctamente:
- Se insertará un registro en visualizacion_producto
- Se incrementará el contador en producto.visualizaciones
- Se creará/actualizará un registro en estadistica_producto

Si hay errores, revisar:
- Que los IDs sean válidos
- Que las tablas existan
- Que la función tenga permisos correctos
' as instrucciones;
