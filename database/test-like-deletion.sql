-- Script para probar la eliminación de likes
-- Verifica que el sistema elimine correctamente los likes de la tabla favorito

-- PASO 1: Verificar estructura de la tabla favorito
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLA FAVORITO ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'favorito' 
    AND table_schema = 'public'
ORDER BY column_name;

-- PASO 2: Mostrar favoritos existentes
SELECT '=== FAVORITOS EXISTENTES ===' as info;

SELECT 
    f.favorito_id,
    f.usuario_id,
    f.producto_id,
    f.fecha_agregado,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    p.titulo as producto_titulo,
    p.total_likes as likes_actuales
FROM public.favorito f
JOIN public.usuario u ON f.usuario_id = u.user_id
JOIN public.producto p ON f.producto_id = p.producto_id
ORDER BY f.fecha_agregado DESC
LIMIT 10;

-- PASO 3: Verificar sincronización antes de pruebas
SELECT '=== SINCRONIZACIÓN ANTES DE PRUEBAS ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.total_likes as likes_en_producto,
    COUNT(f.favorito_id) as likes_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
HAVING COUNT(f.favorito_id) > 0 OR p.total_likes > 0
ORDER BY p.total_likes DESC
LIMIT 10;

-- PASO 4: Instrucciones para prueba manual de eliminación
SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL DE ELIMINACIÓN ===' as info;

SELECT '
Para probar la eliminación de likes manualmente:

1. Obtener un favorito existente:
   SELECT f.favorito_id, f.usuario_id, f.producto_id, u.nombre, p.titulo
   FROM public.favorito f
   JOIN public.usuario u ON f.usuario_id = u.user_id
   JOIN public.producto p ON f.producto_id = p.producto_id
   LIMIT 1;

2. Verificar el estado antes de eliminar:
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = [PRODUCTO_ID_AQUI];

3. Eliminar el favorito:
   DELETE FROM public.favorito 
   WHERE usuario_id = [USER_ID_AQUI] 
   AND producto_id = [PRODUCTO_ID_AQUI];

4. Verificar que se eliminó:
   SELECT * FROM public.favorito 
   WHERE usuario_id = [USER_ID_AQUI] 
   AND producto_id = [PRODUCTO_ID_AQUI];

5. Verificar que el contador se actualizó (debería decrementar):
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = [PRODUCTO_ID_AQUI];

6. Probar la API DELETE:
   DELETE /api/products/[PRODUCTO_ID]/like
   Headers: Authorization: Bearer [JWT_TOKEN]

7. Verificar en el frontend:
   - Abrir DevTools Console
   - Hacer clic en el corazón lleno
   - Verificar logs de debug
   - Confirmar que el corazón se vuelve vacío
   - Confirmar que el contador decrementa
' as instrucciones;

-- PASO 5: Simular eliminación de favorito
SELECT '=== SIMULANDO ELIMINACIÓN DE FAVORITO ===' as info;

-- Mostrar qué pasaría si elimináramos algunos favoritos
SELECT 
    'Simulación de eliminación' as accion,
    f.favorito_id,
    f.usuario_id,
    f.producto_id,
    p.titulo as producto,
    p.total_likes as likes_antes,
    (p.total_likes - 1) as likes_despues,
    u.nombre || ' ' || u.apellido as usuario
FROM public.favorito f
JOIN public.producto p ON f.producto_id = p.producto_id
JOIN public.usuario u ON f.usuario_id = u.user_id
ORDER BY f.fecha_agregado DESC
LIMIT 5;

-- PASO 6: Verificar trigger de eliminación
SELECT '=== VERIFICANDO TRIGGER DE ELIMINACIÓN ===' as info;

-- Verificar que el trigger existe
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_product_likes'
    AND event_manipulation = 'DELETE';

-- PASO 7: Estadísticas de favoritos
SELECT '=== ESTADÍSTICAS DE FAVORITOS ===' as info;

SELECT 
    'Total de favoritos' as metrica,
    COUNT(*) as valor
FROM public.favorito

UNION ALL

SELECT 
    'Usuarios que han dado likes' as metrica,
    COUNT(DISTINCT usuario_id) as valor
FROM public.favorito

UNION ALL

SELECT 
    'Productos con likes' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.favorito

UNION ALL

SELECT 
    'Promedio de likes por producto' as metrica,
    ROUND(COUNT(*)::numeric / COUNT(DISTINCT producto_id), 2) as valor
FROM public.favorito;
