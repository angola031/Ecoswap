-- Tabla de eventos de fundaciones
CREATE TABLE IF NOT EXISTS evento_fundacion (
    evento_id SERIAL PRIMARY KEY,
    fundacion_id INTEGER NOT NULL REFERENCES usuario(user_id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    ubicacion VARCHAR(300),
    ubicacion_detalle TEXT,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN (
        'Recaudación de fondos',
        'Actividad educativa',
        'Jornada de donación',
        'Evento comunitario',
        'Taller',
        'Campaña de concientización',
        'Otro'
    )),
    imagen_evento TEXT,
    capacidad_maxima INTEGER,
    requiere_registro BOOLEAN DEFAULT false,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'cancelado', 'finalizado')),
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Tabla de registros a eventos (si requiere registro)
CREATE TABLE IF NOT EXISTS registro_evento (
    registro_id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES evento_fundacion(evento_id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuario(user_id) ON DELETE CASCADE,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'cancelado', 'asistió')),
    notas TEXT,
    UNIQUE(evento_id, usuario_id)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_evento_fundacion_id ON evento_fundacion(fundacion_id);
CREATE INDEX IF NOT EXISTS idx_evento_fecha_inicio ON evento_fundacion(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_evento_estado ON evento_fundacion(estado);
CREATE INDEX IF NOT EXISTS idx_registro_evento_id ON registro_evento(evento_id);
CREATE INDEX IF NOT EXISTS idx_registro_usuario_id ON registro_evento(usuario_id);

-- Trigger para validar que solo fundaciones verificadas puedan crear eventos
CREATE OR REPLACE FUNCTION validate_fundacion_verificada()
RETURNS TRIGGER AS $$
DECLARE
    v_es_fundacion BOOLEAN;
    v_verificada BOOLEAN;
BEGIN
    -- Obtener información de la fundación
    SELECT es_fundacion, fundacion_verificada 
    INTO v_es_fundacion, v_verificada
    FROM usuario 
    WHERE user_id = NEW.fundacion_id;
    
    -- Validar que sea fundación verificada
    IF v_es_fundacion IS NULL OR v_es_fundacion = false THEN
        RAISE EXCEPTION 'Solo las fundaciones pueden crear eventos';
    END IF;
    
    IF v_verificada IS NULL OR v_verificada = false THEN
        RAISE EXCEPTION 'La fundación debe estar verificada para crear eventos';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_fundacion
    BEFORE INSERT ON evento_fundacion
    FOR EACH ROW
    EXECUTE FUNCTION validate_fundacion_verificada();

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_evento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evento_timestamp
    BEFORE UPDATE ON evento_fundacion
    FOR EACH ROW
    EXECUTE FUNCTION update_evento_updated_at();

-- Comentarios
COMMENT ON TABLE evento_fundacion IS 'Eventos organizados por fundaciones verificadas';
COMMENT ON TABLE registro_evento IS 'Registro de usuarios a eventos de fundaciones';

