-- =============================================
-- SCRIPT PARA VERIFICAR Y CORREGIR CONSULTAS DE USUARIO_ROL
-- =============================================

-- Este script verifica que todas las consultas de Supabase estén usando
-- la sintaxis correcta para evitar el error de relaciones múltiples

-- =============================================
-- CONSULTAS CORRECTAS (YA IMPLEMENTADAS)
-- =============================================

-- ✅ CORRECTO: Especifica la relación exacta
-- usuario_rol!usuario_rol_usuario_id_fkey (
--     rol_id,
--     activo,
--     fecha_asignacion,
--     rol_usuario (
--         nombre,
--         descripcion,
--         permisos
--     ),
--     asignado_por:usuario!usuario_rol_asignado_por_fkey (
--         nombre,
--         email
--     )
-- )

-- ❌ INCORRECTO: No especifica la relación
-- usuario_rol (
--     rol_id,
--     activo,
--     fecha_asignacion,
--     rol_usuario (
--         nombre,
--         descripcion
--     )
-- )

-- =============================================
-- VERIFICACIÓN DE RELACIONES EN LA BASE DE DATOS
-- =============================================

-- Verificar que las foreign keys estén correctamente configuradas
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    a.attname as column_name,
    af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f' 
AND conrelid::regclass::text = 'usuario_rol'
ORDER BY conname;

-- =============================================
-- NOMBRES DE RELACIONES DISPONIBLES
-- =============================================

-- Después de ejecutar este script, tendrás estas relaciones disponibles:
-- 1. usuario_rol!usuario_rol_usuario_id_fkey - Usuario que tiene el rol
-- 2. usuario_rol!usuario_rol_asignado_por_fkey - Usuario que asignó el rol
-- 3. usuario_rol!usuario_rol_rol_id_fkey - Rol asignado

-- =============================================
-- EJEMPLOS DE USO CORRECTO
-- =============================================

-- Ejemplo 1: Obtener usuario con sus roles
-- SELECT * FROM usuario
-- LEFT JOIN usuario_rol!usuario_rol_usuario_id_fkey ON usuario.user_id = usuario_rol.usuario_id
-- LEFT JOIN rol_usuario ON usuario_rol.rol_id = rol_usuario.rol_id

-- Ejemplo 2: Obtener quién asignó cada rol
-- SELECT * FROM usuario_rol
-- LEFT JOIN usuario!usuario_rol_asignado_por_fkey ON usuario_rol.asignado_por = usuario.user_id

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

-- Verificar que no hay conflictos de relaciones
SELECT 
    'usuario_rol' as tabla,
    COUNT(*) as total_foreign_keys,
    STRING_AGG(conname, ', ') as constraint_names
FROM pg_constraint c
WHERE c.contype = 'f' 
AND conrelid::regclass::text = 'usuario_rol';

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

-- 1. SIEMPRE especifica la relación cuando uses usuario_rol
-- 2. Usa usuario_rol!usuario_rol_usuario_id_fkey para el usuario que tiene el rol
-- 3. Usa usuario_rol!usuario_rol_asignado_por_fkey para quién asignó el rol
-- 4. Evita usar solo usuario_rol sin especificar la relación
-- 5. Si necesitas ambas relaciones, úsalas por separado en consultas diferentes
