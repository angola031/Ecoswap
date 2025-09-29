-- Optimizaciones para consultas de interacciones
-- Este script mejora el rendimiento de las consultas más frecuentes

-- Índices para la tabla intercambio
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_propone_id ON intercambio(usuario_propone_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_recibe_id ON intercambio(usuario_recibe_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_estado ON intercambio(estado);
CREATE INDEX IF NOT EXISTS idx_intercambio_fecha_propuesta ON intercambio(fecha_propuesta DESC);
CREATE INDEX IF NOT EXISTS idx_intercambio_producto_ofrecido_id ON intercambio(producto_ofrecido_id);
CREATE INDEX IF NOT EXISTS idx_intercambio_producto_solicitado_id ON intercambio(producto_solicitado_id);

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_estado ON intercambio(usuario_propone_id, estado);
CREATE INDEX IF NOT EXISTS idx_intercambio_usuario_recibe_estado ON intercambio(usuario_recibe_id, estado);
CREATE INDEX IF NOT EXISTS idx_intercambio_fecha_estado ON intercambio(fecha_propuesta DESC, estado);

-- Índices para la tabla chat
CREATE INDEX IF NOT EXISTS idx_chat_intercambio_id ON chat(intercambio_id);
CREATE INDEX IF NOT EXISTS idx_chat_fecha_creacion ON chat(fecha_creacion DESC);

-- Índices para la tabla mensaje
CREATE INDEX IF NOT EXISTS idx_mensaje_chat_id ON mensaje(chat_id);
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha_envio ON mensaje(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_mensaje_usuario_id ON mensaje(usuario_id);

-- Índices para la tabla imagen_producto
CREATE INDEX IF NOT EXISTS idx_imagen_producto_producto_id ON imagen_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_imagen_producto_es_principal ON imagen_producto(es_principal) WHERE es_principal = true;
CREATE INDEX IF NOT EXISTS idx_imagen_producto_producto_principal ON imagen_producto(producto_id, es_principal);

-- Índices para la tabla producto
CREATE INDEX IF NOT EXISTS idx_producto_user_id ON producto(user_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria_id ON producto(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_tipo_transaccion ON producto(tipo_transaccion);
CREATE INDEX IF NOT EXISTS idx_producto_estado_publicacion ON producto(estado_publicacion);
CREATE INDEX IF NOT EXISTS idx_producto_fecha_publicacion ON producto(fecha_publicacion DESC);

-- Índices para la tabla usuario
CREATE INDEX IF NOT EXISTS idx_usuario_auth_user_id ON usuario(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);

-- Índices para la tabla ubicacion
CREATE INDEX IF NOT EXISTS idx_ubicacion_user_id ON ubicacion(user_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_es_principal ON ubicacion(es_principal) WHERE es_principal = true;

-- Índices para la tabla calificacion
CREATE INDEX IF NOT EXISTS idx_calificacion_intercambio_id ON calificacion(intercambio_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_calificador_id ON calificacion(calificador_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_calificado_id ON calificacion(calificado_id);

-- Estadísticas para optimizar el planificador de consultas
ANALYZE intercambio;
ANALYZE chat;
ANALYZE mensaje;
ANALYZE producto;
ANALYZE usuario;
ANALYZE imagen_producto;
ANALYZE ubicacion;
ANALYZE calificacion;

-- Comentarios sobre el uso de los índices:
-- 
-- 1. idx_intercambio_usuario_propone_id y idx_intercambio_usuario_recibe_id:
--    Optimizan las consultas WHERE usuario_propone_id = X OR usuario_recibe_id = Y
--
-- 2. idx_intercambio_estado:
--    Optimiza los filtros por estado (pendiente, aceptado, etc.)
--
-- 3. idx_intercambio_fecha_propuesta:
--    Optimiza el ORDER BY fecha_propuesta DESC
--
-- 4. idx_imagen_producto_es_principal:
--    Índice parcial que optimiza la búsqueda de imágenes principales
--
-- 5. Los índices compuestos mejoran consultas que filtran por múltiples campos
--
-- 6. ANALYZE actualiza las estadísticas para que el planificador de consultas
--    pueda tomar mejores decisiones sobre qué índices usar
