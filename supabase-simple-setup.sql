-- =============================================
-- CONFIGURACIÓN SIMPLE PARA SUPABASE AUTH CON ECOSWAP
-- =============================================

-- 1. Habilitar RLS en las tablas principales
ALTER TABLE USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE UBICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONFIGURACION_USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRODUCTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE CATEGORIA ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS BÁSICAS PARA USUARIO
-- =============================================

-- Permitir lectura de usuarios activos
CREATE POLICY "Usuarios activos son visibles" ON USUARIO
FOR SELECT USING (activo = true);

-- Permitir inserción de nuevos usuarios
CREATE POLICY "Cualquiera puede registrarse" ON USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización del propio perfil (por email)
CREATE POLICY "Usuarios pueden actualizar su perfil" ON USUARIO
FOR UPDATE USING (email = auth.jwt() ->> 'email');

-- =============================================
-- POLÍTICAS BÁSICAS PARA UBICACION
-- =============================================

-- Permitir lectura de ubicaciones
CREATE POLICY "Ubicaciones son visibles" ON UBICACION
FOR SELECT USING (true);

-- Permitir inserción de ubicaciones
CREATE POLICY "Cualquiera puede crear ubicaciones" ON UBICACION
FOR INSERT WITH CHECK (true);

-- Permitir actualización de ubicaciones
CREATE POLICY "Ubicaciones pueden ser actualizadas" ON UBICACION
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS BÁSICAS PARA CONFIGURACION_USUARIO
-- =============================================

-- Permitir lectura de configuración
CREATE POLICY "Configuración es visible" ON CONFIGURACION_USUARIO
FOR SELECT USING (true);

-- Permitir inserción de configuración
CREATE POLICY "Cualquiera puede crear configuración" ON CONFIGURACION_USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de configuración
CREATE POLICY "Configuración puede ser actualizada" ON CONFIGURACION_USUARIO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS BÁSICAS PARA PRODUCTO
-- =============================================

-- Permitir lectura de productos activos
CREATE POLICY "Productos activos son visibles" ON PRODUCTO
FOR SELECT USING (estado_publicacion = 'activo');

-- Permitir inserción de productos
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de productos
CREATE POLICY "Usuarios pueden actualizar productos" ON PRODUCTO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS BÁSICAS PARA CATEGORIA
-- =============================================

-- Permitir lectura de categorías activas
CREATE POLICY "Categorías activas son visibles" ON CATEGORIA
FOR SELECT USING (activa = true);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuario_email ON USUARIO(email);

-- Índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_usuario_user_id ON USUARIO(user_id);

-- Índice para búsquedas por ubicación
CREATE INDEX IF NOT EXISTS idx_ubicacion_user_id ON UBICACION(user_id);
CREATE INDEX IF NOT EXISTS idx_ubicacion_ciudad ON UBICACION(ciudad);

-- Índice para configuración
CREATE INDEX IF NOT EXISTS idx_config_usuario_id ON CONFIGURACION_USUARIO(usuario_id);

-- Índice para productos
CREATE INDEX IF NOT EXISTS idx_producto_user_id ON PRODUCTO(user_id);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON PRODUCTO(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_estado ON PRODUCTO(estado_publicacion);

-- =============================================
-- CONFIGURACIÓN DE EMAIL EN SUPABASE
-- =============================================

-- NOTA: La configuración de email se hace en el dashboard de Supabase:
-- 1. Ve a Authentication > Settings
-- 2. Configura:
--    - Site URL: http://localhost:3000
--    - Redirect URLs: http://localhost:3000/verificacion
-- 3. Ve a Authentication > Email Templates
-- 4. Personaliza las plantillas de email

-- =============================================
-- VERIFICACIÓN DE CONFIGURACIÓN
-- =============================================

-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('USUARIO', 'UBICACION', 'CONFIGURACION_USUARIO', 'PRODUCTO', 'CATEGORIA');

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('USUARIO', 'UBICACION', 'CONFIGURACION_USUARIO', 'PRODUCTO', 'CATEGORIA');
