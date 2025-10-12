#!/usr/bin/env node

console.log('🔧 Configuración de GitHub Secrets para Cloudflare Pages');
console.log('');
console.log('📋 Para configurar GitHub Actions, necesitas agregar estos secrets:');
console.log('');
console.log('1. Ve a tu repositorio en GitHub:');
console.log('   https://github.com/angola031/Ecoswap');
console.log('');
console.log('2. Ve a Settings > Secrets and variables > Actions');
console.log('');
console.log('3. Agrega estos secrets:');
console.log('');
console.log('   🔑 CLOUDFLARE_API_TOKEN');
console.log('   Value: 88wHY5XG__sJVUx63-6WpjC6PBA4tbkVcdY3HlG2');
console.log('');
console.log('   🏢 CLOUDFLARE_ACCOUNT_ID (opcional, ya está en el workflow)');
console.log('   Value: 71fc063294f82b8f8140bee5c94074e8');
console.log('');
console.log('4. Una vez configurados, GitHub Actions hará deployment automático');
console.log('   cada vez que hagas push a la rama main.');
console.log('');
console.log('💡 Alternativa: Usa deployment manual con el script local:');
console.log('   npm run deploy');
console.log('');
