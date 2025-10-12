#!/usr/bin/env node

// Script para actualizar el API token de Cloudflare
const fs = require('fs');
const path = require('path');

console.log('🔧 Configuración de API Token de Cloudflare');
console.log('');
console.log('Para configurar el API token correctamente:');
console.log('');
console.log('1. Ve a: https://dash.cloudflare.com/profile/api-tokens');
console.log('2. Crea un nuevo token con estos permisos:');
console.log('   - Zone:Zone:Read');
console.log('   - Zone:Zone Settings:Read');
console.log('   - Account:Cloudflare Pages:Edit');
console.log('   - Account:Cloudflare Pages:Read');
console.log('');
console.log('3. Configura el token en tu sistema:');
console.log('   - Windows: setx CLOUDFLARE_API_TOKEN "tu_token_aqui"');
console.log('   - Linux/Mac: export CLOUDFLARE_API_TOKEN="tu_token_aqui"');
console.log('');
console.log('4. O agrega el token a tu archivo .env.local:');
console.log('   CLOUDFLARE_API_TOKEN=tu_token_aqui');
console.log('');
console.log('5. Reinicia tu terminal después de configurar el token.');
