-- Políticas RLS para la tabla favorito
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Política para SELECT (ver favoritos)
CREATE POLICY "favorito_select_own" ON "public"."favorito"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  auth.uid()::text = (
    SELECT auth_user_id 
    FROM usuario 
    WHERE user_id = favorito.usuario_id
  )
);

-- 2. Política para INSERT (agregar favoritos)
CREATE POLICY "favorito_insert_own" ON "public"."favorito"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = (
    SELECT auth_user_id 
    FROM usuario 
    WHERE user_id = favorito.usuario_id
  )
);

-- 3. Política para DELETE (eliminar favoritos)
CREATE POLICY "favorito_delete_own" ON "public"."favorito"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  auth.uid()::text = (
    SELECT auth_user_id 
    FROM usuario 
    WHERE user_id = favorito.usuario_id
  )
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'favorito';
