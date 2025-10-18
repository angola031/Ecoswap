#!/usr/bin/env node

/**
 * Script para asignar rol de Super Admin a un usuario
 * Solo funciona con Service Role Key (en Vercel)
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function assignSuperAdminRole() {
    console.log('🔧 Asignando rol de Super Admin...\n')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Este script requiere SUPABASE_SERVICE_ROLE_KEY')
        console.error('   Esta variable solo está disponible en Vercel')
        console.error('   Para usar localmente, necesitas agregar la Service Role Key a .env.local')
        console.log()
        console.log('💡 Alternativas:')
        console.log('1. Ejecutar este script en Vercel (usando Vercel CLI)')
        console.log('2. Asignar el rol manualmente en Supabase Dashboard')
        console.log('3. Agregar SUPABASE_SERVICE_ROLE_KEY a .env.local (solo para desarrollo)')
        return
    }
    
    console.log('✅ Service Role Key encontrada')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    try {
        // 1. Obtener el rol super_admin
        console.log('\n📋 1. Obteniendo rol super_admin:')
        const { data: superAdminRole, error: roleError } = await supabase
            .from('rol_usuario')
            .select('rol_id, nombre')
            .eq('nombre', 'super_admin')
            .eq('activo', true)
            .single()
        
        if (roleError || !superAdminRole) {
            console.error('❌ Error obteniendo rol super_admin:', roleError?.message)
            return
        }
        
        console.log(`✅ Rol super_admin encontrado: ID ${superAdminRole.rol_id}`)
        
        // 2. Listar usuarios admin disponibles
        console.log('\n📋 2. Usuarios admin disponibles:')
        const { data: adminUsers, error: usersError } = await supabase
            .from('usuario')
            .select('user_id, email, es_admin')
            .eq('es_admin', true)
            .order('user_id')
        
        if (usersError) {
            console.error('❌ Error obteniendo usuarios admin:', usersError.message)
            return
        }
        
        console.log('✅ Usuarios admin encontrados:')
        adminUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.user_id}: ${user.email}`)
        })
        
        // 3. Verificar cuáles ya son super admin
        console.log('\n📋 3. Verificando super admins existentes:')
        const { data: existingSuperAdmins, error: existingError } = await supabase
            .from('usuario_rol')
            .select('usuario_id')
            .eq('rol_id', superAdminRole.rol_id)
            .eq('activo', true)
        
        if (existingError) {
            console.error('❌ Error verificando super admins existentes:', existingError.message)
            return
        }
        
        const existingSuperAdminIds = existingSuperAdmins.map(ur => ur.usuario_id)
        console.log('✅ Super admins existentes:', existingSuperAdminIds)
        
        // 4. Encontrar usuarios que no son super admin
        const usersToPromote = adminUsers.filter(user => !existingSuperAdminIds.includes(user.user_id))
        
        if (usersToPromote.length === 0) {
            console.log('\n✅ Todos los usuarios admin ya son super admins')
            return
        }
        
        console.log('\n📋 4. Usuarios que pueden ser promovidos a super admin:')
        usersToPromote.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.user_id}: ${user.email}`)
        })
        
        // 5. Asignar rol super_admin al primer usuario disponible
        const userToPromote = usersToPromote[0]
        console.log(`\n🚀 Promoviendo a super admin: ${userToPromote.email}`)
        
        const { data: insertData, error: insertError } = await supabase
            .from('usuario_rol')
            .insert({
                usuario_id: userToPromote.user_id,
                rol_id: superAdminRole.rol_id,
                activo: true,
                fecha_asignacion: new Date().toISOString()
            })
            .select()
        
        if (insertError) {
            console.error('❌ Error asignando rol super_admin:', insertError.message)
            return
        }
        
        console.log('✅ Rol super_admin asignado exitosamente')
        console.log('📊 Datos insertados:', insertData)
        
        // 6. Verificar que se asignó correctamente
        console.log('\n📋 5. Verificando asignación:')
        const { data: verification, error: verifyError } = await supabase
            .from('usuario_rol')
            .select('usuario_id, rol_id, activo, fecha_asignacion')
            .eq('usuario_id', userToPromote.user_id)
            .eq('rol_id', superAdminRole.rol_id)
            .single()
        
        if (verifyError) {
            console.error('❌ Error verificando asignación:', verifyError.message)
            return
        }
        
        console.log('✅ Verificación exitosa:', verification)
        
        console.log('\n🎉 ¡Usuario promovido a Super Admin exitosamente!')
        console.log(`👤 Usuario: ${userToPromote.email}`)
        console.log(`🆔 ID: ${userToPromote.user_id}`)
        console.log(`⭐ Rol: super_admin`)
        console.log()
        console.log('💡 Ahora el usuario debería ver el botón "Nuevo Administrador"')
        console.log('   en la sección de Gestión de Administradores')
        
    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    assignSuperAdminRole()
}

module.exports = { assignSuperAdminRole }
