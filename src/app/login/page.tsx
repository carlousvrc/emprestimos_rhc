import { login } from '@/utils/supabase/server'
import { Eye } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center pt-20 bg-white" style={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
            <div className="w-full max-w-[700px] px-8">

                {/* Header (Logo + Titles) */}
                <div className="flex flex-col items-center justify-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Logo Hospital Casa"
                        className="h-[80px] object-contain mb-8"
                    />

                    <h1 className="text-center text-[#001D6D] m-0 text-[36px] font-bold leading-tight mb-3">
                        Análise de Transferências
                    </h1>
                    <h2 className="text-center text-[#001D6D] m-0 text-[24px] font-bold leading-tight">
                        Via Empréstimo
                    </h2>
                </div>

                {/* Streamlit Login Form Container */}
                <div className="bg-white rounded-[0.5rem] border border-[#d3d4d6] p-8 mt-2">
                    <form className="flex flex-col w-full gap-6">

                        {/* Usuário Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-normal text-[#31333F] tracking-wide" htmlFor="email">
                                Usuário
                            </label>
                            <div className="relative flex items-center w-full">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="peer w-full px-[14px] py-[10px] bg-[#F0F2F6] border border-transparent rounded-[4px] text-[15px] text-[#31333F] focus:outline-none focus:bg-white focus:border-[#F37021] hover:border-[#F37021] transition-colors"
                                />
                                <span className="absolute right-3 text-[13px] text-gray-400 opacity-0 peer-focus:opacity-100 transition-opacity pointer-events-none select-none">
                                    Press Enter to submit form
                                </span>
                            </div>
                        </div>

                        {/* Senha Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[14px] font-normal text-[#31333F] tracking-wide" htmlFor="password">
                                Senha
                            </label>
                            <div className="relative flex items-center w-full">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="peer w-full px-[14px] py-[10px] bg-[#F0F2F6] border border-transparent rounded-[4px] text-[15px] text-[#31333F] focus:outline-none focus:bg-white focus:border-[#F37021] hover:border-[#F37021] pr-10 transition-colors"
                                />
                                <button type="button" className="absolute right-3 text-[#31333f] opacity-80 hover:opacity-100 flex items-center justify-center">
                                    <Eye size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Streamlit "Primary-ish" border button */}
                        <button
                            formAction={login}
                            className="mt-4 w-full px-4 py-[10px] bg-white border border-[#caced1] text-[#31333F] text-[15px] rounded-[4px] hover:border-[#F37021] hover:text-[#F37021] transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
