'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        // HARDCODED BYPASS para manter o mesmo acesso estrito .streamlit/secrets do usuário (usuário: admin, senha: Rc2026)
        if ((email === 'admin' || email === 'admin@hospitalcasa.com.br') && password === 'Rc2026') {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: 'admin@hospitalcasa.com.br',
                password: 'Rc2026'
            });

            if (signInError) {
                return router.push('/?mock_admin=true')
            }
            return router.push('/')
        }

        // Login Normal Supabase
        const { error: apiError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (apiError) {
            setError(apiError.message || "Credenciais Incorretas")
        } else {
            router.push('/')
        }

        setIsSubmitting(false)
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center pt-24 pb-12 font-sans">

            {/* Header Section */}
            <div className="flex flex-col items-center justify-center mb-8">
                <img src="/logo.png" alt="Logo Hospitalar" className="h-[65px] mb-6 object-contain" />

                <h1 className="text-center text-[#003380] text-[28px] font-bold leading-tight mb-2 tracking-tight">
                    Análise de Transferências
                </h1>
                <span className="text-center text-[#003380] text-[22px] font-bold tracking-tight">
                    Via Empréstimo
                </span>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[440px] border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm font-bold text-center">{error}</div>}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-slate-600">Usuário</label>
                        <input
                            type="text"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-[#F3F4F6] border-none rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-300"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-slate-600">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[#F3F4F6] border-none rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-300 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2 px-4 rounded-md transition-colors text-sm"
                    >
                        {isSubmitting ? 'Autenticando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
