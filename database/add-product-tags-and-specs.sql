-- Normalización de etiquetas y especificaciones para productos
-- Ejecutar en Supabase (PostgreSQL)

-- 1) Tabla de etiquetas (catálogo)
CREATE TABLE IF NOT EXISTS tag (
    tag_id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

-- 2) Tabla puente producto_tag (muchos-a-muchos)
CREATE TABLE IF NOT EXISTS producto_tag (
    producto_id BIGINT NOT NULL REFERENCES producto(producto_id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tag(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, tag_id)
);

-- Índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_producto_tag_tag_id ON producto_tag(tag_id);
CREATE INDEX IF NOT EXISTS idx_producto_tag_producto_id ON producto_tag(producto_id);

-- 3) Tabla de especificaciones (clave-valor por producto)
CREATE TABLE IF NOT EXISTS producto_especificacion (
    producto_especificacion_id BIGSERIAL PRIMARY KEY,
    producto_id BIGINT NOT NULL REFERENCES producto(producto_id) ON DELETE CASCADE,
    clave TEXT NOT NULL,
    valor TEXT NOT NULL
);

-- Índices de soporte
CREATE INDEX IF NOT EXISTS idx_prod_spec_producto_id ON producto_especificacion(producto_id);
CREATE INDEX IF NOT EXISTS idx_prod_spec_clave ON producto_especificacion(clave);

-- 4) Enfoque híbrido de ubicación: agregar snapshots a producto
ALTER TABLE producto
  ADD COLUMN IF NOT EXISTS ciudad_snapshot varchar,
  ADD COLUMN IF NOT EXISTS departamento_snapshot varchar,
  ADD COLUMN IF NOT EXISTS latitud_snapshot numeric,
  ADD COLUMN IF NOT EXISTS longitud_snapshot numeric;

CREATE INDEX IF NOT EXISTS idx_producto_ciudad_depto ON producto(ciudad_snapshot, departamento_snapshot);

-- 5) Migración opcional desde columnas existentes (si existen): producto.etiquetas (TEXT) y producto.especificaciones (JSONB)
-- Nota: Ajusta estos pasos según tu esquema real.
DO $$
BEGIN
    -- Migrar etiquetas si la columna existe y no está vacía
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' AND column_name = 'etiquetas'
    ) THEN
        -- Insertar etiquetas únicas en catálogo
        INSERT INTO tag (nombre)
        SELECT DISTINCT x.nombre
        FROM (
            SELECT TRIM(unnest(string_to_array(etiquetas, ','))) AS nombre
            FROM producto
            WHERE COALESCE(etiquetas, '') <> ''
        ) AS x
        LEFT JOIN tag t ON t.nombre = x.nombre
        WHERE t.tag_id IS NULL;

        -- Vincular producto con etiquetas
        INSERT INTO producto_tag (producto_id, tag_id)
        SELECT p.producto_id, t.tag_id
        FROM producto p
        CROSS JOIN LATERAL unnest(string_to_array(p.etiquetas, ',')) AS e(nombre)
        JOIN tag t ON t.nombre = TRIM(e.nombre)
        LEFT JOIN producto_tag pt
          ON pt.producto_id = p.producto_id AND pt.tag_id = t.tag_id
        WHERE COALESCE(p.etiquetas, '') <> ''
          AND pt.producto_id IS NULL;
    END IF;

    -- Migrar especificaciones desde columna JSON/JSONB 'especificaciones'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' AND column_name = 'especificaciones'
    ) THEN
        INSERT INTO producto_especificacion (producto_id, clave, valor)
        SELECT p.producto_id,
               spec.key AS clave,
               spec.value::text AS valor
        FROM producto p
        CROSS JOIN LATERAL jsonb_each_text((p.especificaciones)::jsonb) AS spec(key, value)
        WHERE p.especificaciones IS NOT NULL;
    ELSIF EXISTS (
        -- Soporte para tu esquema actual: columna 'epecificaciones' (varchar)
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'producto' AND column_name = 'epecificaciones'
    ) THEN
        -- Solo intentar castear cuando luce como JSON de objeto { ... }
        INSERT INTO producto_especificacion (producto_id, clave, valor)
        SELECT p.producto_id,
               spec.key AS clave,
               spec.value::text AS valor
        FROM producto p
        CROSS JOIN LATERAL jsonb_each_text((p.epecificaciones)::jsonb) AS spec(key, value)
        WHERE p.epecificaciones IS NOT NULL
          AND p.epecificaciones ~ '^{.*}$';
    END IF;
END $$;


-- 6) Catálogo de departamentos y municipios de Colombia (estructura)
CREATE TABLE IF NOT EXISTS departamento (
    departamento_id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS municipio (
    municipio_id SERIAL PRIMARY KEY,
    departamento_id INT NOT NULL REFERENCES departamento(departamento_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    CONSTRAINT municipio_unq UNIQUE (departamento_id, nombre)
);

CREATE INDEX IF NOT EXISTS idx_municipio_dep ON municipio(departamento_id);

-- 7) Enlazar ubicaciones a catálogo (opcional): agregar columnas y FKs en ubicacion
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='ubicacion' AND column_name='departamento_id'
  ) THEN
    ALTER TABLE ubicacion ADD COLUMN departamento_id INT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='ubicacion' AND column_name='municipio_id'
  ) THEN
    ALTER TABLE ubicacion ADD COLUMN municipio_id INT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='ubicacion_departamento_id_fkey'
  ) THEN
    ALTER TABLE ubicacion
      ADD CONSTRAINT ubicacion_departamento_id_fkey
      FOREIGN KEY (departamento_id) REFERENCES departamento(departamento_id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='ubicacion_municipio_id_fkey'
  ) THEN
    ALTER TABLE ubicacion
      ADD CONSTRAINT ubicacion_municipio_id_fkey
      FOREIGN KEY (municipio_id) REFERENCES municipio(municipio_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ubicacion_departamento ON ubicacion(departamento_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_municipio ON ubicacion(municipio_id);


