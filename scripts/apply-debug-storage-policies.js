const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando Políticas de DEBUG para Storage');
console.log('⚠️  Estas políticas son MUY permisivas - solo para diagnóstico');
console.log('');

const sqlFilePath = path.join(__dirname, '../database/create-chat-storage-policies-debug.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('📋 INSTRUCCIONES PARA APLICAR LAS POLÍTICAS DE DEBUG:');
console.log('');
console.log('1. 🌐 Abre tu navegador y ve a:');
console.log('   https://app.supabase.com/project/vaqdzualcteljmivtoka/sql');
console.log('');
console.log('2. 📝 Copia y pega el siguiente SQL en el editor:');
console.log('');
console.log('─'.repeat(80));
console.log(sqlContent);
console.log('─'.repeat(80));
console.log('');
console.log('3. ▶️ Haz clic en "Run" para ejecutar el SQL');
console.log('');
console.log('4. ✅ Verifica que aparezca la política de debug:');
console.log('   - debug_allow_all_ecoswap');
console.log('');
console.log('5. 🔄 Después de ejecutar el SQL, prueba subir una imagen en el chat');
console.log('');
console.log('⚠️  IMPORTANTE: Esta política permite a cualquier usuario autenticado');
console.log('   hacer CUALQUIER operación en el bucket Ecoswap. Es solo para debug.');
console.log('');
console.log('🎯 Si esto funciona, significa que el problema estaba en las políticas específicas.');
console.log('   Si no funciona, el problema es más profundo (RLS, autenticación, etc.)');
console.log('');
console.log('🔍 Después del test, volveremos a políticas más restrictivas.');

