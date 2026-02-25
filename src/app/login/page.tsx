import { login } from '@/utils/supabase/server'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white font-sans">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center justify-center mb-6">
                    {/* Logo representation based on Streamlit visual feedback */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-[#F37021] text-3xl font-black">⌂</div>
                        <div className="text-[#002D62] text-xl font-bold tracking-tight">HOSPITAL CASA</div>
                    </div>

                    <h1 className="text-center text-[#002D62] m-0 text-2xl font-bold leading-tight">
                        Análise de Transferências
                    </h1>
                    <h2 className="text-center text-[#002D62] m-0 text-lg font-semibold mt-1">
                        Via Empréstimo
                    </h2>
                </div>

                {/* Login Card Container like Streamlit */}
                <div className="bg-[#F0F2F6] rounded-xl border border-[#E6EAF1] p-6 shadow-sm">
                    <form className="flex flex-col w-full gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[#31333F]" htmlFor="email">
                                Usuário
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="px-3 py-2.5 bg-white border border-[#D3D4D6] rounded-lg text-sm text-[#31333F] focus:outline-none focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-[#31333F]" htmlFor="password">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="px-3 py-2.5 bg-white border border-[#D3D4D6] rounded-lg text-sm text-[#31333F] focus:outline-none focus:border-[#F37021] focus:ring-1 focus:ring-[#F37021] transition-colors"
                            />
                        </div>

                        {/* Streamlit secondary-button style (white with border) for regular actions, or primary if intended */}
                        <button
                            formAction={login}
                            className="mt-2 w-full px-4 py-2.5 bg-white border border-[#caced1] text-[#31333F] font-semibold text-sm rounded-lg hover:border-[#F37021] hover:text-[#F37021] transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
