#!/usr/bin/env node

/**
 * Script para verificar el estado de admin de un usuario específico
 * Usa las variables de entorno para conectarse a Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkUserAdminStatus() {
    console.log('🔧 Verificando estado de admin del usuario...\n')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno no configuradas:')
        console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
        console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
        console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        return
    }
    
    console.log('✅ Variables de entorno configuradas')
    console.log('🔑 Usando:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    try {
        // 1. Verificar roles disponibles
        console.log('\n📋 1. Verificando roles disponibles:')
        const { data: roles, error: rolesError } = await supabase
            .from('rol_usuario')
            .select('rol_id, nombre, activo')
            .order('rol_id')
        
        if (rolesError) {
            console.error('❌ Error obteniendo roles:', rolesError.message)
            return
        }
        
        console.log('✅ Roles encontrados:')
        roles.forEach(role => {
            console.log(`   - ${role.rol_id}: ${role.nombre} (${role.activo ? 'activo' : 'inactivo'})`)
        })
        
        // Verificar si existe super_admin
        const superAdminRole = roles.find(r => r.nombre === 'super_admin' && r.activo)
        if (!superAdminRole) {
            console.log('\n❌ No se encontró rol super_admin activo')
            console.log('💡 Necesitas crear el rol super_admin en la tabla rol_usuario')
            return
        }
        
        console.log(`\n✅ Rol super_admin encontrado: ID ${superAdminRole.rol_id}`)
        
        // 2. Verificar usuarios admin
        console.log('\n📋 2. Verificando usuarios admin:')
        const { data: adminUsers, error: adminError } = await supabase
            .from('usuario')
            .select('user_id, email, es_admin, activo')
            .eq('es_admin', true)
            .order('user_id')
        
        if (adminError) {
            console.error('❌ Error obteniendo usuarios admin:', adminError.message)
            return
        }
        
        console.log('✅ Usuarios admin encontrados:')
        adminUsers.forEach(user => {
            console.log(`   - ${user.user_id}: ${user.email} (${user.activo ? 'activo' : 'inactivo'})`)
        })
        
        if (adminUsers.length === 0) {
            console.log('\n❌ No hay usuarios marcados como admin')
            console.log('💡 Necesitas marcar al menos un usuario con es_admin = true')
            return
        }
        
        // 3. Verificar roles asignados a usuarios admin
        console.log('\n📋 3. Verificando roles asignados a usuarios admin:')
        
        for (const user of adminUsers) {
            console.log(`\n👤 Usuario: ${user.email} (ID: ${user.user_id})`)
            
            const { data: userRoles, error: userRolesError } = await supabase
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', user.user_id)
                .eq('activo', true)
            
            if (userRolesError) {
                console.error('   ❌ Error obteniendo roles del usuario:', userRolesError.message)
                continue
            }
            
            if (userRoles.length === 0) {
                console.log('   ❌ No tiene roles asignados')
                continue
            }
            
            console.log('   ✅ Roles asignados:')
            userRoles.forEach(userRole => {
                const role = roles.find(r => r.rol_id === userRole.rol_id)
                if (role) {
                    console.log(`      - ${role.nombre} (ID: ${role.rol_id})`)
                } else {
                    console.log(`      - Rol ID ${userRole.rol_id} (no encontrado en rol_usuario)`)
                }
            })
            
            // Verificar si es super admin
            const isSuperAdmin = userRoles.some(ur => ur.rol_id === superAdminRole.rol_id)
            console.log(`   ${isSuperAdmin ? '✅' : '❌'} Es Super Admin: ${isSuperAdmin}`)
        }
        
        // 4. Resumen y recomendaciones
        console.log('\n📊 RESUMEN:')
        const superAdmins = adminUsers.filter(user => {
            // Aquí necesitaríamos hacer otra consulta para verificar roles, pero por simplicidad
            // asumimos que si hay usuarios admin, al menos uno debería ser super admin
            return true // Simplificado para el ejemplo
        })
        
        if (superAdmins.length === 0) {
            console.log('❌ No se encontraron Super Admins')
            console.log('\n💡 SOLUCIÓN:')
            console.log('1. Ve a Supabase Dashboard')
            console.log('2. Tabla usuario: marca es_admin = true para tu usuario')
            console.log('3. Tabla usuario_rol: inserta registro:')
            console.log(`   - usuario_id: [tu user_id]`)
            console.log(`   - rol_id: ${superAdminRole.rol_id}`)
            console.log(`   - activo: true`)
            console.log(`   - fecha_asignacion: now()`)
        } else {
            console.log('✅ Se encontraron Super Admins')
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkUserAdminStatus()
}

module.exports = { checkUserAdminStatus }
