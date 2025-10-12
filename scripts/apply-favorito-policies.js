const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Aplicando Políticas RLS para Tabla Favorito');
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

async function createPolicies() {
  try {
    console.log('📋 Creando políticas RLS...');
    
    // 1. Política para SELECT
    console.log('1️⃣ Creando política SELECT...');
    const { error: selectError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "favorito_select_own" ON "public"."favorito"
        AS PERMISSIVE FOR SELECT
        TO authenticated
        USING (
          auth.uid()::text = (
            SELECT auth_user_id 
            FROM usuario 
            WHERE user_id = favorito.usuario_id
          )
        );
      `
    });
    
    if (selectError) {
      console.error('❌ Error creando política SELECT:', selectError.message);
    } else {
      console.log('✅ Política SELECT creada');
    }

    // 2. Política para INSERT
    console.log('2️⃣ Creando política INSERT...');
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "favorito_insert_own" ON "public"."favorito"
        AS PERMISSIVE FOR INSERT
        TO authenticated
        WITH CHECK (
          auth.uid()::text = (
            SELECT auth_user_id 
            FROM usuario 
            WHERE user_id = favorito.usuario_id
          )
        );
      `
    });
    
    if (insertError) {
      console.error('❌ Error creando política INSERT:', insertError.message);
    } else {
      console.log('✅ Política INSERT creada');
    }

    // 3. Política para DELETE
    console.log('3️⃣ Creando política DELETE...');
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "favorito_delete_own" ON "public"."favorito"
        AS PERMISSIVE FOR DELETE
        TO authenticated
        USING (
          auth.uid()::text = (
            SELECT auth_user_id 
            FROM usuario 
            WHERE user_id = favorito.usuario_id
          )
        );
      `
    });
    
    if (deleteError) {
      console.error('❌ Error creando política DELETE:', deleteError.message);
    } else {
      console.log('✅ Política DELETE creada');
    }

    console.log('');
    console.log('🎉 ¡Políticas RLS aplicadas exitosamente!');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('1. Verifica en Supabase Dashboard > Authentication > Policies');
    console.log('2. Deberías ver 3 políticas para la tabla "favorito"');
    console.log('3. Prueba la funcionalidad de likes en tu aplicación');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.log('');
    console.log('💡 Alternativa: Ejecuta manualmente el SQL en Supabase Dashboard:');
    console.log('   1. Ve a Supabase Dashboard > SQL Editor');
    console.log('   2. Copia el contenido de database/create-favorito-policies.sql');
    console.log('   3. Ejecuta el script');
  }
}

createPolicies();
