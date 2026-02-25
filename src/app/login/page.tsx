import { login } from '@/utils/supabase/server'
import { Eye } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-[#E6EAF1] font-sans px-4 sm:px-6">

            <div className="w-full max-w-[500px]">
                {/* Header (Logo + Titles) */}
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-8">
                        <img
                            src="/logo.png"
                            alt="Logo Hospital Casa"
                            className="h-[75px] object-contain"
                        />
                    </div>

                    <h1 className="text-center text-[#001D6D] m-0 text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2">
                        Análise de Transferências
                    </h1>
                    <h2 className="text-center text-[#F37021] m-0 text-xl sm:text-2xl font-semibold tracking-wide">
                        Via Empréstimo
                    </h2>
                </div>

                {/* Modern Login Card Container */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5">
                    <form className="flex flex-col w-full gap-5">

                        {/* Usuário Input */}
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider ml-1" htmlFor="email">
                                Usuário autenticado
                            </label>
                            <div className="relative flex items-center w-full group">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu.email@exemplo.com"
                                    required
                                    className="peer w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F37021]/50 focus:ring-4 focus:ring-[#F37021]/10 hover:border-slate-300 transition-all duration-300"
                                />
                                {/* Modern icon input decoration */}
                                <div className="absolute right-4 text-slate-400 peer-focus:text-[#F37021] transition-colors pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Senha Input */}
                        <div className="flex flex-col gap-2 mt-1">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[13px] font-semibold text-slate-600 uppercase tracking-wider" htmlFor="password">
                                    Senha de acesso
                                </label>
                            </div>
                            <div className="relative flex items-center w-full group">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="peer w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#F37021]/50 focus:ring-4 focus:ring-[#F37021]/10 hover:border-slate-300 transition-all duration-300 pr-12"
                                />
                                <button type="button" className="absolute right-3 text-slate-400 hover:text-slate-600 peer-focus:text-[#F37021] transition-colors flex items-center justify-center p-2 rounded-lg hover:bg-slate-100">
                                    <Eye size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Modern Primary Button */}
                        <button
                            formAction={login}
                            className="mt-6 w-full px-4 py-3.5 bg-[#001D6D] text-white font-bold text-[15px] rounded-xl hover:bg-[#001D6D]/90 hover:shadow-lg hover:shadow-[#001D6D]/20 active:scale-[0.98] transition-all duration-200"
                        >
                            Acessar Sistema
                        </button>

                    </form>
                </div>

                <p className="text-center text-slate-400 text-sm mt-8">
                    © {new Date().getFullYear()} Hospital Casa. Ambiente Seguro.
                </p>
            </div>
        </div>
    )
}
