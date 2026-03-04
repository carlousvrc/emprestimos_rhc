'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message || 'Erro ao atualizar senha.')
      setIsSubmitting(false)
    } else {
      toast.success('Senha atualizada com sucesso!')
      setTimeout(() => router.push('/'), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center font-sans px-4">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#001A72]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E87722]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] flex flex-col items-center gap-8">

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
            <img src="/logo.png" alt="Logo Hospitalar" className="h-14 object-contain" />
          </div>
          <div>
            <h1 className="text-[#001A72] text-2xl font-black tracking-tight">Redefinir Senha</h1>
            <p className="text-slate-500 font-semibold mt-1">Crie uma nova senha de acesso</p>
          </div>
        </div>

        <div className="w-full bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.06)] overflow-hidden">

          <div className="bg-gradient-to-r from-[#001A72] to-[#0039cc] px-8 py-6 flex items-center gap-3">
            <ShieldCheck size={22} className="text-[#E87722]" />
            <div>
              <h2 className="text-white font-black text-lg">Nova Senha</h2>
              <p className="text-white/60 text-sm font-medium mt-0.5">Mínimo 6 caracteres</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nova Senha</label>
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
                  minLength={6}
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

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Senha</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-medium outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72]/30 transition-all text-slate-700 placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
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
                  Salvando...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Salvar Nova Senha
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
