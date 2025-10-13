const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando Políticas RLS para Chat Storage - Versión Manual');
console.log('');

const sqlFilePath = path.join(__dirname, '../database/create-chat-storage-policies.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('📋 INSTRUCCIONES PARA APLICAR LAS POLÍTICAS:');
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
console.log('4. ✅ Verifica que aparezcan 3 políticas nuevas:');
console.log('   - allow_auth_upload_chat_images');
console.log('   - allow_auth_view_chat_images');
console.log('   - allow_auth_delete_chat_images');
console.log('');
console.log('5. 🔄 Después de ejecutar el SQL, prueba subir una imagen en el chat');
console.log('');
console.log('💡 Estas políticas permiten:');
console.log('   - INSERT: Subir imágenes solo a tu carpeta personal');
console.log('   - SELECT: Ver solo tus propias imágenes de chat');
console.log('   - DELETE: Eliminar solo tus propias imágenes de chat');
console.log('');
console.log('🎯 El error "StorageApiError: new row violates row-level security policy"');
console.log('   debería desaparecer después de aplicar estas políticas.');

