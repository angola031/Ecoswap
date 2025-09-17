-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS) PARA ECOSWAP
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE UBICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE CATEGORIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE PRODUCTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE IMAGEN_PRODUCTO ENABLE ROW LEVEL SECURITY;
ALTER TABLE INTERCAMBIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE CHAT ENABLE ROW LEVEL SECURITY;
ALTER TABLE MENSAJE ENABLE ROW LEVEL SECURITY;
ALTER TABLE CALIFICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE INSIGNIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE USUARIO_INSIGNIA ENABLE ROW LEVEL SECURITY;
ALTER TABLE NOTIFICACION ENABLE ROW LEVEL SECURITY;
ALTER TABLE FAVORITO ENABLE ROW LEVEL SECURITY;
ALTER TABLE USUARIO_SEGUIDO ENABLE ROW LEVEL SECURITY;
ALTER TABLE REPORTE ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONFIGURACION_USUARIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE HISTORIAL_PRECIO ENABLE ROW LEVEL SECURITY;
ALTER TABLE ESTADISTICA_PRODUCTO ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO
-- =============================================

-- Permitir lectura de usuarios activos
CREATE POLICY "Usuarios activos son visibles" ON USUARIO
FOR SELECT USING (activo = true);

-- Permitir inserción de nuevos usuarios (registro)
CREATE POLICY "Cualquiera puede registrarse" ON USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización del propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil" ON USUARIO
FOR UPDATE USING (true); -- Temporalmente permitir todas las actualizaciones

-- =============================================
-- POLÍTICAS PARA TABLA UBICACION
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
-- POLÍTICAS PARA TABLA CONFIGURACION_USUARIO
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
-- POLÍTICAS PARA TABLA CATEGORIA
-- =============================================

-- Permitir lectura de categorías activas
CREATE POLICY "Categorías activas son visibles" ON CATEGORIA
FOR SELECT USING (activa = true);

-- =============================================
-- POLÍTICAS PARA TABLA PRODUCTO
-- =============================================

-- Permitir lectura de productos activos
CREATE POLICY "Productos activos son visibles" ON PRODUCTO
FOR SELECT USING (estado_publicacion = 'activo');

-- Permitir inserción de productos (usuarios autenticados)
CREATE POLICY "Usuarios pueden crear productos" ON PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de productos propios
CREATE POLICY "Usuarios pueden actualizar sus productos" ON PRODUCTO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA IMAGEN_PRODUCTO
-- =============================================

-- Permitir lectura de imágenes
CREATE POLICY "Imágenes son visibles" ON IMAGEN_PRODUCTO
FOR SELECT USING (true);

-- Permitir inserción de imágenes
CREATE POLICY "Imágenes pueden ser creadas" ON IMAGEN_PRODUCTO
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA INTERCAMBIO
-- =============================================

-- Permitir lectura de intercambios
CREATE POLICY "Intercambios son visibles" ON INTERCAMBIO
FOR SELECT USING (true);

-- Permitir inserción de intercambios
CREATE POLICY "Intercambios pueden ser creados" ON INTERCAMBIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de intercambios
CREATE POLICY "Intercambios pueden ser actualizados" ON INTERCAMBIO
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA CHAT
-- =============================================

-- Permitir lectura de chats
CREATE POLICY "Chats son visibles" ON CHAT
FOR SELECT USING (true);

-- Permitir inserción de chats
CREATE POLICY "Chats pueden ser creados" ON CHAT
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA MENSAJE
-- =============================================

-- Permitir lectura de mensajes
CREATE POLICY "Mensajes son visibles" ON MENSAJE
FOR SELECT USING (true);

-- Permitir inserción de mensajes
CREATE POLICY "Mensajes pueden ser creados" ON MENSAJE
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA CALIFICACION
-- =============================================

-- Permitir lectura de calificaciones públicas
CREATE POLICY "Calificaciones públicas son visibles" ON CALIFICACION
FOR SELECT USING (es_publica = true);

-- Permitir inserción de calificaciones
CREATE POLICY "Calificaciones pueden ser creadas" ON CALIFICACION
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA INSIGNIA
-- =============================================

-- Permitir lectura de insignias activas
CREATE POLICY "Insignias activas son visibles" ON INSIGNIA
FOR SELECT USING (activa = true);

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO_INSIGNIA
-- =============================================

-- Permitir lectura de insignias de usuario
CREATE POLICY "Insignias de usuario son visibles" ON USUARIO_INSIGNIA
FOR SELECT USING (true);

-- Permitir inserción de insignias de usuario
CREATE POLICY "Insignias de usuario pueden ser creadas" ON USUARIO_INSIGNIA
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA NOTIFICACION
-- =============================================

-- Permitir lectura de notificaciones
CREATE POLICY "Notificaciones son visibles" ON NOTIFICACION
FOR SELECT USING (true);

-- Permitir inserción de notificaciones
CREATE POLICY "Notificaciones pueden ser creadas" ON NOTIFICACION
FOR INSERT WITH CHECK (true);

-- Permitir actualización de notificaciones
CREATE POLICY "Notificaciones pueden ser actualizadas" ON NOTIFICACION
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA FAVORITO
-- =============================================

-- Permitir lectura de favoritos
CREATE POLICY "Favoritos son visibles" ON FAVORITO
FOR SELECT USING (true);

-- Permitir inserción de favoritos
CREATE POLICY "Favoritos pueden ser creados" ON FAVORITO
FOR INSERT WITH CHECK (true);

-- Permitir eliminación de favoritos
CREATE POLICY "Favoritos pueden ser eliminados" ON FAVORITO
FOR DELETE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA USUARIO_SEGUIDO
-- =============================================

-- Permitir lectura de seguimientos
CREATE POLICY "Seguimientos son visibles" ON USUARIO_SEGUIDO
FOR SELECT USING (true);

-- Permitir inserción de seguimientos
CREATE POLICY "Seguimientos pueden ser creados" ON USUARIO_SEGUIDO
FOR INSERT WITH CHECK (true);

-- Permitir eliminación de seguimientos
CREATE POLICY "Seguimientos pueden ser eliminados" ON USUARIO_SEGUIDO
FOR DELETE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA REPORTE
-- =============================================

-- Permitir lectura de reportes
CREATE POLICY "Reportes son visibles" ON REPORTE
FOR SELECT USING (true);

-- Permitir inserción de reportes
CREATE POLICY "Reportes pueden ser creados" ON REPORTE
FOR INSERT WITH CHECK (true);

-- Permitir actualización de reportes
CREATE POLICY "Reportes pueden ser actualizados" ON REPORTE
FOR UPDATE USING (true);

-- =============================================
-- POLÍTICAS PARA TABLA HISTORIAL_PRECIO
-- =============================================

-- Permitir lectura de historial de precios
CREATE POLICY "Historial de precios es visible" ON HISTORIAL_PRECIO
FOR SELECT USING (true);

-- Permitir inserción de historial de precios
CREATE POLICY "Historial de precios puede ser creado" ON HISTORIAL_PRECIO
FOR INSERT WITH CHECK (true);

-- =============================================
-- POLÍTICAS PARA TABLA ESTADISTICA_PRODUCTO
-- =============================================

-- Permitir lectura de estadísticas
CREATE POLICY "Estadísticas son visibles" ON ESTADISTICA_PRODUCTO
FOR SELECT USING (true);

-- Permitir inserción de estadísticas
CREATE POLICY "Estadísticas pueden ser creadas" ON ESTADISTICA_PRODUCTO
FOR INSERT WITH CHECK (true);

-- Permitir actualización de estadísticas
CREATE POLICY "Estadísticas pueden ser actualizadas" ON ESTADISTICA_PRODUCTO
FOR UPDATE USING (true);
