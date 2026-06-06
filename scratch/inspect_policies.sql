-- Execute este script no SQL Editor do Supabase (Homologação) para criar a função de inspeção.
CREATE OR REPLACE FUNCTION public.inspect_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
