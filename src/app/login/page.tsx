import { login } from '@/utils/supabase/server'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center justify-center mb-8">
                    {/* Logo fallback for illustration, usually public/logo.png */}
                    <div className="h-16 w-32 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500 font-bold">
                        LOGO
                    </div>
                    <h1 className="text-center text-[#001A72] m-0 text-3xl font-bold leading-tight">
                        Análise de Transferências<br />
                        <span className="text-xl font-normal">Via Empréstimo</span>
                    </h1>
                </div>

                <form className="flex flex-col w-full gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700" htmlFor="email">
                            Usuário (Email)
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E87722]"
                        />
                    </div>

                    <button
                        formAction={login}
                        className="mt-4 px-4 py-3 bg-[#E87722] text-white font-medium rounded-md hover:bg-[#d16615] transition-colors"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    )
}
