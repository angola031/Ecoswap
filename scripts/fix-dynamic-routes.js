#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para agregar export const dynamic = 'force-dynamic' a todas las rutas de API
 * que usan headers.get() y no tienen esta configuración
 */

const API_DIR = 'app/api';

function findApiFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function needsDynamicConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene la configuración dynamic
    if (content.includes("export const dynamic = 'force-dynamic'")) {
      return false;
    }
    
    // Verificar si usa headers.get()
    if (content.includes('headers.get(') || content.includes('req.headers.get(')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error.message);
    return false;
  }
}

function addDynamicConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar la primera línea de import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Encontrar dónde insertar la configuración (después de los imports)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require(')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Si hay una línea vacía después de los imports, insertar ahí
        break;
      }
    }
    
    // Insertar la configuración dynamic
    const dynamicConfig = "// Forzar renderizado dinámico para esta ruta\nexport const dynamic = 'force-dynamic'\n";
    
    lines.splice(insertIndex, 0, dynamicConfig);
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    return true;
  } catch (error) {
    console.error(`Error modificando archivo ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Corrigiendo rutas de API para renderizado dinámico...\n');
  
  const apiFiles = findApiFiles(API_DIR);
  console.log(`📁 Encontrados ${apiFiles.length} archivos de ruta de API`);
  
  let fixedCount = 0;
  let alreadyConfiguredCount = 0;
  let needsFixCount = 0;
  
  for (const file of apiFiles) {
    if (needsDynamicConfig(file)) {
      console.log(`🔧 Corrigiendo: ${file}`);
      if (addDynamicConfig(file)) {
        fixedCount++;
        console.log(`✅ Corregido: ${file}`);
      } else {
        console.log(`❌ Error corrigiendo: ${file}`);
      }
    } else {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes("export const dynamic = 'force-dynamic'")) {
        alreadyConfiguredCount++;
      } else {
        needsFixCount++;
      }
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`✅ Archivos corregidos: ${fixedCount}`);
  console.log(`⚙️  Archivos ya configurados: ${alreadyConfiguredCount}`);
  console.log(`📝 Archivos que no necesitan corrección: ${needsFixCount}`);
  console.log(`📁 Total de archivos procesados: ${apiFiles.length}`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 ¡Corrección completada!');
    console.log('💡 Los archivos corregidos ahora tienen renderizado dinámico forzado.');
    console.log('🚀 Esto debería resolver los errores de "Dynamic server usage" en Vercel.');
  } else {
    console.log('\n✨ No se encontraron archivos que necesiten corrección.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { findApiFiles, needsDynamicConfig, addDynamicConfig };
