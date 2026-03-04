import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Redireciona para a página de atualização de senha após validar o token
      return NextResponse.redirect(new URL('/auth/update-password', request.url))
    }
  }

  // Token inválido ou expirado — volta para o login com erro
  return NextResponse.redirect(
    new URL('/login?error=link_invalido_ou_expirado', request.url)
  )
}
