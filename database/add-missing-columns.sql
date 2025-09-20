-- =============================================
-- SCRIPT PARA AGREGAR COLUMNAS FALTANTES EN TABLA USUARIO
-- =============================================

-- Este script agrega las columnas que se están usando en el código
-- pero que no existen en la tabla usuario

-- =============================================
-- COLUMNAS A AGREGAR
-- =============================================

-- 1. Columna para saber quién suspendió/desactivó al usuario
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS suspendido_por INTEGER REFERENCES usuario(user_id);

-- 2. Columna para saber cuándo fue desbloqueado/reactivado
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS fecha_desbloqueo TIMESTAMP;

-- 3. Columna para saber quién creó al usuario (opcional)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuario(user_id);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_suspendido_por ON usuario(suspendido_por);
CREATE INDEX IF NOT EXISTS idx_usuario_fecha_desbloqueo ON usuario(fecha_desbloqueo);
CREATE INDEX IF NOT EXISTS idx_usuario_creado_por ON usuario(creado_por);

-- =============================================
-- COMENTARIOS EN LAS COLUMNAS
-- =============================================

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN usuario.suspendido_por IS 'ID del usuario que suspendió/desactivó este usuario';
COMMENT ON COLUMN usuario.fecha_desbloqueo IS 'Fecha y hora cuando el usuario fue desbloqueado/reactivado';
COMMENT ON COLUMN usuario.creado_por IS 'ID del usuario que creó este usuario';

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuario' 
AND column_name IN ('suspendido_por', 'fecha_desbloqueo', 'creado_por')
ORDER BY column_name;

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

-- 1. Estas columnas son opcionales y se pueden agregar si necesitas
--    un seguimiento más detallado de quién hace qué en el sistema
-- 2. Si no las necesitas, puedes comentar las líneas correspondientes
--    en el código de la API
-- 3. Los índices mejoran el rendimiento de las consultas
-- 4. Los comentarios ayudan a documentar el propósito de cada columna
