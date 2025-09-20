-- =============================================
-- SOLUCIÓN PARA ERROR DE COLUMNA 'creado_por' NO ENCONTRADA
-- =============================================

-- OPCIÓN 1: Agregar la columna 'creado_por' a la tabla usuario
-- (Solo si quieres rastrear quién creó cada usuario)

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS creado_por INTEGER REFERENCES usuario(user_id);

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_usuario_creado_por ON usuario(creado_por);

-- =============================================
-- OPCIÓN 2: Si NO quieres la columna 'creado_por'
-- (Eliminar todas las referencias en el código)
-- =============================================

-- Esta opción requiere actualizar el código para no usar 'creado_por'
-- Ya se hizo en los archivos route.ts

-- =============================================
-- VERIFICAR LA ESTRUCTURA ACTUAL DE LA TABLA
-- =============================================

-- Ver las columnas de la tabla usuario
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'usuario' 
ORDER BY ordinal_position;

-- =============================================
-- RECOMENDACIÓN
-- =============================================

-- Si quieres rastrear quién creó cada usuario, ejecuta la OPCIÓN 1
-- Si no necesitas esa información, mantén el código como está (ya corregido)
