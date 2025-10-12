const fs = require('fs')
const path = require('path')

// Archivos específicos que necesitan ser corregidos
const filesToFix = [
  'app/api/chat/[chatId]/send/route.ts',
  'app/api/chat/[chatId]/read/route.ts',
  'app/api/chat/[chatId]/messages/route.ts',
  'app/api/chat/[chatId]/mark-read/route.ts',
  'app/api/chat/[chatId]/info/route.ts',
  'hooks/useNotifications.ts'
]

function fixSupabaseImport(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  let modified = false

  // Patrón 1: Reemplazar import de createClient directo
  const createClientPattern = /import\s*{\s*createClient\s*}\s*from\s*['"]@supabase\/supabase-js['"]/
  if (createClientPattern.test(content)) {
    content = content.replace(
      createClientPattern,
      "import { getSupabaseClient } from '@/lib/supabase-client'"
    )
    modified = true
  }

  // Patrón 2: Reemplazar import de supabase desde supabaseClient
  const supabaseImportPattern = /import\s*{\s*supabase\s*}\s*from\s*['"][^'"]*supabaseClient['"]/
  if (supabaseImportPattern.test(content)) {
    content = content.replace(
      supabaseImportPattern,
      "import { getSupabaseClient } from '../lib/supabase-client'"
    )
    modified = true
  }

  // Patrón 3: Reemplazar creación directa de cliente
  const createClientUsagePattern = /const\s+supabaseAdmin?\s*=\s*createClient\([^)]+\)/g
  if (createClientUsagePattern.test(content)) {
    content = content.replace(
      createClientUsagePattern,
      'const supabase = getSupabaseClient()'
    )
    modified = true
  }

  // Patrón 4: Reemplazar variables de entorno directas
  const envVarsPattern = /const\s+supabaseUrl\s*=\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?\s*\nconst\s+supabaseServiceKey\s*=\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!?/
  if (envVarsPattern.test(content)) {
    content = content.replace(envVarsPattern, '')
    modified = true
  }

  // Patrón 5: Reemplazar uso de supabaseAdmin con supabase
  content = content.replace(/supabaseAdmin/g, 'supabase')
  if (content.includes('supabaseAdmin')) {
    modified = true
  }

  // Patrón 6: Reemplazar uso directo de supabase con getSupabaseClient()
  if (content.includes('supabase.') && !content.includes('getSupabaseClient()')) {
    content = content.replace(/\bsupabase\./g, 'getSupabaseClient().')
    modified = true
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Corregido: ${filePath}`)
  } else {
    console.log(`⏭️  Sin cambios: ${filePath}`)
  }
}

console.log('🔧 Corrigiendo imports de Supabase...')

filesToFix.forEach(file => {
  fixSupabaseImport(file)
})

console.log('✅ Corrección completada!')

