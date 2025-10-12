const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Deshabilitando RLS en Tabla Favorito');
console.log('');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 Asegúrate de tener estas variables en tu archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  try {
    console.log('📋 Deshabilitando RLS en tabla favorito...');
    
    // 1. Deshabilitar RLS
    console.log('1️⃣ Deshabilitando Row Level Security...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.favorito DISABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.error('❌ Error deshabilitando RLS:', rlsError.message);
    } else {
      console.log('✅ RLS deshabilitado');
    }

    // 2. Eliminar políticas existentes
    console.log('2️⃣ Eliminando políticas existentes...');
    const policies = [
      'favorito_select_own',
      'favorito_insert_own', 
      'favorito_delete_own'
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy}" ON public.favorito;`
      });
      
      if (policyError) {
        console.log(`⚠️ Política ${policy} no existe o ya fue eliminada`);
      } else {
        console.log(`✅ Política ${policy} eliminada`);
      }
    }

    // 3. Verificar estado
    console.log('3️⃣ Verificando estado...');
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables 
        WHERE tablename = 'favorito' AND schemaname = 'public';
      `
    });

    if (tableError) {
      console.log('⚠️ No se pudo verificar el estado');
    } else {
      console.log('📊 Estado actual:', tables);
    }

    console.log('');
    console.log('🎉 ¡RLS deshabilitado exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Verifica en Supabase Dashboard > Table Editor > favorito');
    console.log('2. En Settings debería mostrar "Row Level Security: Disabled"');
    console.log('3. Prueba la funcionalidad de likes en tu aplicación');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('');
    console.log('💡 Alternativa: Ejecuta manualmente el SQL en Supabase Dashboard:');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('   2. Copia el contenido de database/disable-favorito-rls.sql');
    console.log('   3. Ejecuta el script');
  }
}

disableRLS();
