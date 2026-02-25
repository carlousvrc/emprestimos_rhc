import { login } from '@/utils/supabase/server'
import { User, Lock } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center font-sans tracking-wide">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80')",
                }}
            >
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-md px-6">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">

                    {/* Header */}
                    <div className="flex flex-col items-center justify-center mb-8">
                        <div className="bg-white/90 p-3 rounded-2xl shadow-lg mb-6">
                            <img
                                src="/logo.png"
                                alt="Logo Hospital Casa"
                                className="h-[60px] object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight text-center">
                            Bem-vindo
                        </h1>
                        <h2 className="text-indigo-100/80 text-base text-center font-medium">
                            Análise de Transferências RHC
                        </h2>
                    </div>

                    {/* Form */}
                    <form className="flex flex-col gap-5 w-full">
                        {/* Usuário Input */}
                        <div>
                            <label className="block text-sm font-medium text-indigo-100 mb-2 ml-1" htmlFor="email">
                                Usuário
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300">
                                    <User size={18} strokeWidth={2.5} />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu.email"
                                    required
                                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Senha Input */}
                        <div>
                            <label className="block text-sm font-medium text-indigo-100 mb-2 ml-1" htmlFor="password">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-300">
                                    <Lock size={18} strokeWidth={2.5} />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="w-full py-3.5 pl-12 pr-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            formAction={login}
                            className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Entrar no Sistema
                        </button>
                    </form>

                    <div className="mt-8 text-center text-indigo-300/50 text-xs">
                        v2.0 • Sistema Seguro
                    </div>
                </div>
            </div>
        </div>
    )
}
