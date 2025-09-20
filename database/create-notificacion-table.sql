-- Crear tabla NOTIFICACION para el sistema de notificaciones
CREATE TABLE IF NOT EXISTS NOTIFICACION (
    notificacion_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    es_admin BOOLEAN DEFAULT FALSE,
    url_accion VARCHAR(500),
    datos_adicionales JSONB,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_notificacion_user_id ON NOTIFICACION(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_es_admin ON NOTIFICACION(es_admin);
CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON NOTIFICACION(leida);
CREATE INDEX IF NOT EXISTS idx_notificacion_fecha_creacion ON NOTIFICACION(fecha_creacion);

-- Habilitar Row Level Security
ALTER TABLE NOTIFICACION ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Notificaciones son visibles" ON NOTIFICACION
FOR SELECT USING (true);

CREATE POLICY "Notificaciones pueden ser creadas" ON NOTIFICACION
FOR INSERT WITH CHECK (true);

CREATE POLICY "Notificaciones pueden ser actualizadas" ON NOTIFICACION
FOR UPDATE USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_notificacion_updated_at 
    BEFORE UPDATE ON NOTIFICACION 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios en la tabla y columnas
COMMENT ON TABLE NOTIFICACION IS 'Tabla para almacenar notificaciones del sistema';
COMMENT ON COLUMN NOTIFICACION.notificacion_id IS 'ID único de la notificación';
COMMENT ON COLUMN NOTIFICACION.user_id IS 'ID del usuario destinatario (NULL para notificaciones globales)';
COMMENT ON COLUMN NOTIFICACION.titulo IS 'Título de la notificación';
COMMENT ON COLUMN NOTIFICACION.mensaje IS 'Mensaje detallado de la notificación';
COMMENT ON COLUMN NOTIFICACION.tipo IS 'Tipo de notificación: info, success, warning, error, verificacion_identidad, reporte';
COMMENT ON COLUMN NOTIFICACION.es_admin IS 'Indica si la notificación es para administradores';
COMMENT ON COLUMN NOTIFICACION.url_accion IS 'URL de acción asociada a la notificación';
COMMENT ON COLUMN NOTIFICACION.datos_adicionales IS 'Datos adicionales en formato JSON';
COMMENT ON COLUMN NOTIFICACION.fecha_creacion IS 'Fecha y hora de creación de la notificación';
COMMENT ON COLUMN NOTIFICACION.leida IS 'Indica si la notificación ha sido leída';
