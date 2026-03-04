'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Lock, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const supabase = createClient()

    // Hardcoded bypass — mirrors original .streamlit/secrets admin access
    if ((email === 'admin' || email === 'admin@hospitalcasa.com.br') && password === 'Rc2026') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@hospitalcasa.com.br',
        password: 'Rc2026',
      })
      if (signInError) {
        router.push('/?mock_admin=true')
        return
      }
      router.push('/')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message || 'Credenciais incorretas. Tente novamente.')
      setIsSubmitting(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center font-sans px-4">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#001A72]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E87722]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] flex flex-col items-center gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
            <img src="/logo.png" alt="Logo Hospitalar" className="h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-[#001A72] text-2xl font-black tracking-tight leading-tight">
              Análise de Transferências
            </h1>
            <p className="text-slate-500 font-semibold mt-1">Via Empréstimo · Sistema Integrado</p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden">

          {/* Card Header */}
          <div className="bg-gradient-to-r from-[#001A72] to-[#0039cc] px-8 py-6">
            <h2 className="text-white font-black text-lg">Acessar o Painel</h2>
            <p className="text-white/60 text-sm font-medium mt-1">Entre com suas credenciais de acesso</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-medium outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]/30 transition-all text-slate-700 placeholder:text-slate-400"
                  placeholder="Usuário ou e-mail"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 pr-12 text-sm font-medium outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]/30 transition-all text-slate-700 placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-[#001A72] hover:bg-[#00279c] text-white font-black py-3.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#001A72]/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-400 font-medium text-center">
          Grupo Hospital Casa · Painel de Gestão RHC
        </p>
      </div>
    </div>
  )
}
