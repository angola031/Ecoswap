#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para verificar si un archivo ya tiene la verificación de supabase null
function hasSupabaseNullCheck(content) {
    return content.includes('if (!supabase)') || content.includes('if(!supabase)');
}

// Función para agregar la verificación de supabase null
function addSupabaseNullCheck(content, functionName) {
    const patterns = [
        // Patrón 1: const supabase = getSupabaseClient()
        {
            regex: /(const supabase = getSupabaseClient\(\)\s*\n)/g,
            replacement: '$1    if (!supabase) {\n        return NextResponse.json({ error: \'Supabase client not available\' }, { status: 500 })\n    }\n'
        },
        // Patrón 2: const supabase = getSupabaseClient() seguido de otra línea
        {
            regex: /(const supabase = getSupabaseClient\(\)\s*\n\s*)/g,
            replacement: '$1    if (!supabase) {\n        return NextResponse.json({ error: \'Supabase client not available\' }, { status: 500 })\n    }\n'
        }
    ];

    let modifiedContent = content;
    
    patterns.forEach(pattern => {
        modifiedContent = modifiedContent.replace(pattern.regex, pattern.replacement);
    });

    return modifiedContent;
}

// Función para procesar un archivo
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Solo procesar si usa getSupabaseClient y no tiene verificación de null
        if (content.includes('getSupabaseClient') && !hasSupabaseNullCheck(content)) {
            console.log(`Procesando: ${filePath}`);
            const modifiedContent = addSupabaseNullCheck(content);
            
            // Solo escribir si hubo cambios
            if (modifiedContent !== content) {
                fs.writeFileSync(filePath, modifiedContent, 'utf8');
                console.log(`✅ Actualizado: ${filePath}`);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

// Función para recorrer directorios recursivamente
function processDirectory(dirPath) {
    let processedCount = 0;
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                processedCount += processDirectory(fullPath);
            } else if (item.endsWith('.ts') || item.endsWith('.js')) {
                if (processFile(fullPath)) {
                    processedCount++;
                }
            }
        }
    } catch (error) {
        console.error(`❌ Error accediendo a directorio ${dirPath}:`, error.message);
    }
    
    return processedCount;
}

// Función principal
function main() {
    const apiDir = path.join(__dirname, '..', 'app', 'api');
    
    if (!fs.existsSync(apiDir)) {
        console.error('❌ Directorio app/api no encontrado');
        process.exit(1);
    }
    
    console.log('🔍 Buscando archivos de API que necesitan verificación de Supabase...');
    const processedCount = processDirectory(apiDir);
    
    console.log(`\n✅ Proceso completado. ${processedCount} archivos actualizados.`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { processFile, processDirectory, addSupabaseNullCheck };
