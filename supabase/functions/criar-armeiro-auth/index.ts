import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar se o solicitante é um armeiro autenticado
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Faça login como armeiro antes de cadastrar.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Verificar se o usuário é realmente um armeiro_gestor
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('usuarios')
      .select('perfil')
      .eq('auth_user_id', user.id)
      .single()

    if (dbError || !dbUser || dbUser.perfil !== 'armeiro_gestor') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Somente armeiros gestores podem cadastrar outros armeiros.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Ler os dados do body
    const { matricula, senha } = await req.json()

    if (!matricula || !senha) {
      return new Response(
        JSON.stringify({ error: 'Matrícula e senha são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const matriculaNorm = matricula.trim().toUpperCase()
    const email = `${matriculaNorm}@cavalaria.pm`

    // 4. Criar conta no Supabase Auth usando a chave admin
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Confirmar automaticamente sem enviar e-mail
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: `Erro ao criar conta no Auth: ${createError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authUserId = newAuthUser.user?.id

    // 5. Vincular o auth_user_id na tabela usuarios
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ auth_user_id: authUserId })
      .eq('matricula', matriculaNorm)

    if (updateError) {
      // Limpar a conta de auth criada se a vinculação falhou
      await supabaseAdmin.auth.admin.deleteUser(authUserId!)
      return new Response(
        JSON.stringify({ error: `Erro ao vincular auth_user_id: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        auth_user_id: authUserId,
        message: `Armeiro ${matriculaNorm} cadastrado com sucesso no sistema de autenticação.`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erro interno: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
