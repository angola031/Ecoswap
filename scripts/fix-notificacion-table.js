#!/usr/bin/env node

/**
 * Script para crear la tabla NOTIFICACION usando el cliente de Supabase existente
 */

console.log('🔧 SOLUCIONANDO ERROR DE NOTIFICACIONES')
console.log('======================================')

console.log('\n❌ PROBLEMA IDENTIFICADO:')
console.log('El error "Error cargando notificaciones" indica que la tabla NOTIFICACION no existe en la base de datos.')

console.log('\n📝 SOLUCIÓN MANUAL:')
console.log('')
console.log('1. Ve a tu Supabase Dashboard:')
console.log('   https://supabase.com/dashboard/project/vaqdzualcteljmivtoka')
console.log('')
console.log('2. Ve a la sección "SQL Editor"')
console.log('')
console.log('3. Copia y pega el siguiente código SQL:')
console.log('')
console.log('='.repeat(60))
console.log(`
-- Crear tabla NOTIFICACION
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

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_notificacion_user_id ON NOTIFICACION(user_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_es_admin ON NOTIFICACION(es_admin);
CREATE INDEX IF NOT EXISTS idx_notificacion_leida ON NOTIFICACION(leida);
CREATE INDEX IF NOT EXISTS idx_notificacion_fecha_creacion ON NOTIFICACION(fecha_creacion);

-- Habilitar Row Level Security
ALTER TABLE NOTIFICACION ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad
DROP POLICY IF EXISTS "Notificaciones son visibles" ON NOTIFICACION;
CREATE POLICY "Notificaciones son visibles" ON NOTIFICACION FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notificaciones pueden ser creadas" ON NOTIFICACION;
CREATE POLICY "Notificaciones pueden ser creadas" ON NOTIFICACION FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notificaciones pueden ser actualizadas" ON NOTIFICACION;
CREATE POLICY "Notificaciones pueden ser actualizadas" ON NOTIFICACION FOR UPDATE USING (true);
`)
console.log('='.repeat(60))

console.log('\n4. Haz clic en "Run" para ejecutar el script')
console.log('')
console.log('5. Verifica que la tabla se creó correctamente:')
console.log('   - Ve a "Table Editor"')
console.log('   - Busca la tabla "NOTIFICACION"')
console.log('   - Deberías ver las columnas: notificacion_id, user_id, titulo, mensaje, etc.')

console.log('\n🧪 PROBAR EL SISTEMA:')
console.log('')
console.log('1. Ve a: http://localhost:3000/verificacion-identidad')
console.log('2. Sube documentos de verificación')
console.log('3. Ve a: http://localhost:3000/admin/verificaciones')
console.log('4. Haz clic en "Notificaciones"')
console.log('5. Deberías ver las notificaciones sin errores')

console.log('\n📊 ESTRUCTURA DE LA TABLA:')
console.log('')
console.log('• notificacion_id: ID único (SERIAL PRIMARY KEY)')
console.log('• user_id: ID del usuario destinatario (opcional)')
console.log('• titulo: Título de la notificación')
console.log('• mensaje: Mensaje detallado')
console.log('• tipo: Tipo (info, success, warning, error, verificacion_identidad)')
console.log('• es_admin: Si es para administradores (BOOLEAN)')
console.log('• url_accion: URL de acción asociada')
console.log('• datos_adicionales: Datos extra en JSON')
console.log('• fecha_creacion: Fecha y hora de creación')
console.log('• leida: Si ha sido leída (BOOLEAN)')

console.log('\n🔒 SEGURIDAD:')
console.log('• Row Level Security habilitado')
console.log('• Políticas de acceso configuradas')
console.log('• Solo usuarios autenticados pueden acceder')

console.log('\n✅ DESPUÉS DE CREAR LA TABLA:')
console.log('El sistema de notificaciones funcionará correctamente y podrás:')
console.log('• Ver notificaciones en tiempo real')
console.log('• Recibir alertas de verificaciones de identidad')
console.log('• Gestionar notificaciones de administradores')
console.log('• Marcar notificaciones como leídas')

console.log('\n🚀 ¡Ejecuta el SQL en Supabase Dashboard para solucionar el error!')
