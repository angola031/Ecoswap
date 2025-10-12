const fs = require('fs')
const path = require('path')

// Función para buscar archivos que contengan 'supabaseAdmin'
function findFilesWithSupabaseAdmin(dir) {
    const files = []
    
    function searchDirectory(currentDir) {
        const items = fs.readdirSync(currentDir, { withFileTypes: true })
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item.name)
            
            if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
                searchDirectory(fullPath)
            } else if (item.isFile() && item.name.endsWith('.ts') && !item.name.endsWith('.d.ts')) {
                const content = fs.readFileSync(fullPath, 'utf8')
                if (content.includes('supabaseAdmin')) {
                    files.push(fullPath)
                }
            }
        }
    }
    
    searchDirectory(dir)
    return files
}

// Función para corregir un archivo
function fixSupabaseAdminFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Patrón 1: Agregar import si no existe
    if (content.includes('supabaseAdmin') && !content.includes('import { getSupabaseClient }')) {
        const importLine = "import { getSupabaseClient } from '@/lib/supabase-client'"
        
        // Buscar la primera línea de import
        const lines = content.split('\n')
        let insertIndex = 0
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                insertIndex = i + 1
            } else if (lines[i].trim() === '' && insertIndex > 0) {
                break
            }
        }
        
        lines.splice(insertIndex, 0, importLine)
        content = lines.join('\n')
        modified = true
    }
    
    // Patrón 2: Reemplazar supabaseAdmin con supabase y agregar getSupabaseClient()
    if (content.includes('supabaseAdmin')) {
        // Reemplazar todas las referencias a supabaseAdmin
        content = content.replace(/supabaseAdmin/g, 'supabase')
        modified = true
        
        // Buscar funciones que usan supabase y agregar const supabase = getSupabaseClient()
        const functionRegex = /(export\s+async\s+function\s+\w+[^{]*\{)/g
        const matches = [...content.matchAll(functionRegex)]
        
        for (const match of matches) {
            const functionStart = match.index + match[0].length
            const beforeFunction = content.substring(0, functionStart)
            const afterFunction = content.substring(functionStart)
            
            // Verificar si ya tiene const supabase = getSupabaseClient()
            if (!beforeFunction.includes('const supabase = getSupabaseClient()') && 
                afterFunction.includes('supabase.')) {
                
                // Encontrar el primer try o la primera línea después de {
                const lines = afterFunction.split('\n')
                let insertIndex = 0
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (line.startsWith('try {') || line.startsWith('const ') || line.startsWith('let ') || line.startsWith('var ')) {
                        insertIndex = i
                        break
                    }
                    if (line && !line.startsWith('//') && !line.startsWith('/*')) {
                        insertIndex = i
                        break
                    }
                }
                
                lines.splice(insertIndex, 0, '        const supabase = getSupabaseClient()')
                const newAfterFunction = lines.join('\n')
                content = beforeFunction + newAfterFunction
                modified = true
                break
            }
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ Corregido: ${filePath}`)
        return true
    }
    
    return false
}

console.log('🔧 Buscando archivos con referencias a supabaseAdmin...')

const appDir = path.join(__dirname, '..', 'app')
const filesToFix = findFilesWithSupabaseAdmin(appDir)

console.log(`📁 Encontrados ${filesToFix.length} archivos:`)
filesToFix.forEach(file => console.log(`  - ${file}`))

console.log('\n🔧 Corrigiendo archivos...')

let fixedCount = 0
filesToFix.forEach(file => {
    if (fixSupabaseAdminFile(file)) {
        fixedCount++
    }
})

console.log(`\n✅ Corrección completada! ${fixedCount} archivos corregidos.`)

