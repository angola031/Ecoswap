#!/usr/bin/env node

/**
 * Script para verificar si un usuario ya existe en Supabase Auth
 * Esto puede causar problemas al enviar emails de reset de contraseña
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkUserExistsInAuth() {
    console.log('🔍 Verificando si usuarios existen en Supabase Auth...\n')
    
    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Variables de entorno no configuradas')
        return
    }
    
    console.log('✅ Variables de entorno configuradas')
    console.log('🔑 Usando:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role Key' : 'Anon Key')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Emails a verificar (agregar los que quieras probar)
    const emailsToCheck = [
        'c.angola@utp.edu.co',
        'ecoswap03@gmail.com',
        'test-admin@ejemplo.com'
    ]
    
    console.log(`\n📧 Verificando ${emailsToCheck.length} emails...`)
    
    try {
        // Solo funciona con Service Role Key
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('⚠️  Este script requiere Service Role Key para verificar usuarios en Auth')
            console.log('   Con Anon Key no se puede acceder a la lista de usuarios')
            console.log('\n💡 Alternativas:')
            console.log('1. Agregar SUPABASE_SERVICE_ROLE_KEY a .env.local')
            console.log('2. Verificar manualmente en Supabase Dashboard → Authentication → Users')
            console.log('3. Probar con emails que definitivamente no existen')
            return
        }
        
        // Obtener lista de usuarios
        const { data: users, error } = await supabase.auth.admin.listUsers()
        
        if (error) {
            console.error('❌ Error obteniendo usuarios:', error.message)
            return
        }
        
        console.log(`✅ Se encontraron ${users.users.length} usuarios en Supabase Auth`)
        
        // Verificar cada email
        for (const email of emailsToCheck) {
            console.log(`\n📧 Verificando: ${email}`)
            
            const user = users.users.find(u => u.email === email)
            
            if (user) {
                console.log('   ❌ Usuario EXISTE en Supabase Auth')
                console.log('   📊 Detalles:')
                console.log(`      - ID: ${user.id}`)
                console.log(`      - Email confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`)
                console.log(`      - Creado: ${user.created_at}`)
                console.log(`      - Último sign in: ${user.last_sign_in_at || 'Nunca'}`)
                console.log(`      - Proveedor: ${user.app_metadata?.provider || 'email'}`)
                
                if (user.email_confirmed_at) {
                    console.log('   ⚠️  PROBLEMA: Usuario ya confirmado')
                    console.log('   💡 resetPasswordForEmail puede fallar con usuarios confirmados')
                    console.log('   🔧 Solución: Usar un email diferente o eliminar el usuario')
                } else {
                    console.log('   ✅ Usuario no confirmado - resetPasswordForEmail debería funcionar')
                }
            } else {
                console.log('   ✅ Usuario NO existe en Supabase Auth')
                console.log('   ✅ resetPasswordForEmail debería funcionar correctamente')
            }
        }
        
        // Resumen
        console.log('\n📊 RESUMEN:')
        const existingUsers = emailsToCheck.filter(email => 
            users.users.some(u => u.email === email)
        )
        
        if (existingUsers.length > 0) {
            console.log('❌ Usuarios que YA EXISTEN en Supabase Auth:')
            existingUsers.forEach(email => console.log(`   - ${email}`))
            console.log('\n💡 Para estos usuarios, resetPasswordForEmail puede fallar')
            console.log('   Solución: Usar emails diferentes o eliminar usuarios existentes')
        } else {
            console.log('✅ Ninguno de los emails verificados existe en Supabase Auth')
            console.log('✅ resetPasswordForEmail debería funcionar para todos')
        }
        
        // Recomendaciones
        console.log('\n🛠️  RECOMENDACIONES:')
        console.log('1. Usar emails que NO existan en Supabase Auth')
        console.log('2. Si necesitas usar un email existente:')
        console.log('   - Eliminar el usuario de Supabase Auth')
        console.log('   - O usar un email diferente')
        console.log('3. Verificar logs en Vercel para errores específicos')
        console.log('4. Verificar configuración de URLs en Supabase Dashboard')
        
    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Función para eliminar un usuario de Supabase Auth (solo con Service Role Key)
async function deleteUserFromAuth(email) {
    console.log(`\n🗑️  Eliminando usuario ${email} de Supabase Auth...`)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseKey) {
        console.error('❌ Se requiere Service Role Key para eliminar usuarios')
        return
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    try {
        // Buscar el usuario
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
            console.error('❌ Error obteniendo usuarios:', listError.message)
            return
        }
        
        const user = users.users.find(u => u.email === email)
        
        if (!user) {
            console.log('✅ Usuario no existe en Supabase Auth')
            return
        }
        
        // Eliminar el usuario
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
            console.error('❌ Error eliminando usuario:', deleteError.message)
            return
        }
        
        console.log('✅ Usuario eliminado exitosamente de Supabase Auth')
        
    } catch (error) {
        console.error('❌ Error general:', error.message)
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkUserExistsInAuth()
}

module.exports = { checkUserExistsInAuth, deleteUserFromAuth }
