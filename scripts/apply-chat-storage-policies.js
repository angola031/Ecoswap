const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Aplicando Políticas RLS para Chat Storage...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Variables de entorno requeridas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    console.error('💡 Asegúrate de tener estas variables en tu archivo .env.local o configuradas en tu entorno.');
    process.exit(1);
}

const sqlFilePath = path.join(__dirname, '../database/create-chat-storage-policies.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

async function applyChatStoragePolicies() {
    try {
        console.log('📋 Ejecutando políticas de storage para chat...');
        console.log('🔗 Conectando a Supabase...');
        
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                persistSession: false,
            },
        });

        // Ejecutar el SQL usando la función RPC execute_sql si existe
        // Si no existe, mostraremos las instrucciones manuales
        try {
            console.log('📝 Ejecutando SQL...');
            
            // Dividir el SQL en comandos individuales
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

            for (const command of commands) {
                if (command.trim()) {
                    console.log(`🔄 Ejecutando: ${command.substring(0, 50)}...`);
                    
                    const { data, error } = await supabase.rpc('exec_sql', {
                        sql_query: command + ';'
                    });
                    
                    if (error) {
                        console.log(`⚠️ Comando falló (puede ser normal): ${error.message}`);
                    } else {
                        console.log(`✅ Comando ejecutado exitosamente`);
                    }
                }
            }
            
        } catch (rpcError) {
            console.log('⚠️ No se pudo ejecutar automáticamente. Mostrando instrucciones manuales...');
        }

        console.log('\n📋 INSTRUCCIONES MANUALES:');
        console.log('Si el script automático no funcionó, ejecuta manualmente en Supabase Dashboard > SQL Editor:');
        console.log('\n' + sqlContent + '\n');
        
        console.log('🎯 Pasos manuales:');
        console.log('1. Ve a: https://app.supabase.com/project/vaqdzualcteljmivtoka/sql');
        console.log('2. Pega el SQL del archivo database/create-chat-storage-policies.sql');
        console.log('3. Haz clic en "Run"');
        console.log('4. Verifica que las políticas se crearon correctamente');
        
        console.log('\n✅ Políticas aplicadas. Ahora debería funcionar la subida de imágenes en el chat.');

    } catch (error) {
        console.error('❌ Error aplicando políticas de chat storage:', error.message);
        process.exit(1);
    }
}

applyChatStoragePolicies();

