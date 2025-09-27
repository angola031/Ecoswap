-- Script para identificar y limpiar teléfonos duplicados
-- Ejecutar en Supabase SQL Editor

-- 1. Identificar teléfonos duplicados
SELECT 
    telefono,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos,
    COUNT(CASE WHEN activo = false THEN 1 END) as usuarios_inactivos,
    STRING_AGG(user_id::text, ', ') as user_ids
FROM usuario 
WHERE telefono IS NOT NULL 
    AND telefono != ''
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY total_usuarios DESC;

-- 2. Ver detalles de usuarios con teléfonos duplicados
SELECT 
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    u.activo,
    u.created_at
FROM usuario u
WHERE u.telefono IN (
    SELECT telefono 
    FROM usuario 
    WHERE telefono IS NOT NULL 
        AND telefono != ''
    GROUP BY telefono 
    HAVING COUNT(*) > 1
)
ORDER BY u.telefono, u.activo DESC, u.created_at;

-- 3. OPCIÓN 1: Desactivar usuarios duplicados (mantener solo el más reciente)
-- ATENCIÓN: Ejecutar solo después de revisar los datos
/*
UPDATE usuario 
SET activo = false
WHERE user_id IN (
    SELECT user_id
    FROM (
        SELECT user_id,
               ROW_NUMBER() OVER (
                   PARTITION BY telefono 
                   ORDER BY created_at DESC, user_id DESC
               ) as rn
        FROM usuario
        WHERE telefono IN (
            SELECT telefono 
            FROM usuario 
            WHERE telefono IS NOT NULL 
                AND telefono != ''
            GROUP BY telefono 
            HAVING COUNT(*) > 1
        )
    ) ranked
    WHERE rn > 1
);
*/

-- 4. OPCIÓN 2: Limpiar teléfonos de usuarios inactivos
-- ATENCIÓN: Ejecutar solo después de revisar los datos
/*
UPDATE usuario 
SET telefono = NULL
WHERE activo = false 
    AND telefono IN (
        SELECT telefono 
        FROM usuario 
        WHERE telefono IS NOT NULL 
            AND telefono != ''
        GROUP BY telefono 
        HAVING COUNT(*) > 1
    );
*/

-- 5. Verificar resultado después de la limpieza
SELECT 
    telefono,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos
FROM usuario 
WHERE telefono IS NOT NULL 
    AND telefono != ''
GROUP BY telefono
HAVING COUNT(*) > 1
ORDER BY total_usuarios DESC;
