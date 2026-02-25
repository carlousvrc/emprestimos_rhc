import { login } from '@/utils/supabase/server'
import { Eye } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center pt-24 bg-white font-sans">
            <div className="w-full max-w-[690px] px-4">
                <div className="flex flex-col items-center justify-center mb-10">
                    <img
                        src="/logo.png"
                        alt="Logo Hospital Casa"
                        className="h-[100px] object-contain mb-6"
                    />

                    <h1 className="text-center text-[#001D6D] m-0 text-[40px] font-bold leading-tight mb-4">
                        Análise de Transferências
                    </h1>
                    <h2 className="text-center text-[#001D6D] m-0 text-[26px] font-bold leading-tight">
                        Via Empréstimo
                    </h2>
                </div>

                {/* Login Card Container like Streamlit */}
                <div className="bg-white rounded-[0.5rem] border border-[#d3d4d6] p-8 shadow-sm">
                    <form className="flex flex-col w-full gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] text-[#31333F]" htmlFor="email">
                                Usuário
                            </label>
                            <div className="relative flex items-center w-full">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="peer w-full px-4 py-3 bg-[#F0F2F6] border border-transparent rounded-[8px] text-[15px] text-[#31333F] focus:outline-none focus:bg-white focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] hover:border-[#F37021] transition-all"
                                />
                                <span className="absolute right-3 text-[13px] text-gray-400 opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none select-none">
                                    Press Enter to submit form
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] text-[#31333F]" htmlFor="password">
                                Senha
                            </label>
                            <div className="relative flex items-center w-full">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="peer w-full px-4 py-3 bg-[#F0F2F6] border border-transparent rounded-[8px] text-[15px] text-[#31333F] focus:outline-none focus:bg-white focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] hover:border-[#F37021] transition-all pr-12"
                                />
                                <button type="button" className="absolute right-3 text-gray-900 transition-colors flex items-center justify-center p-1">
                                    <Eye size={20} className="fill-current stroke-3" />
                                </button>
                            </div>
                        </div>

                        <button
                            formAction={login}
                            className="mt-6 w-full px-4 py-[10px] bg-white border border-[#caced1] text-[#31333F] text-[15px] rounded-[8px] hover:border-[#F37021] hover:text-[#F37021] transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
