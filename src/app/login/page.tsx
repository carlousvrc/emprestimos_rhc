import { login } from '@/utils/supabase/server'

export default function LoginPage() {
    return (
        // Container principal: fundo cinza claro, tela cheia, centraliza tudo perfeitamente
        <div className="min-h-screen flex items-center justify-center bg-[#F0F2F6] p-4 font-sans">

            {/* Card branco do formulário com uma borda superior azul para dar o toque corporativo */}
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-[#001A72]">

                {/* Cabeçalho (Idêntico ao seu HTML_Header do Streamlit) */}
                <div className="flex flex-col items-center justify-center mb-8">
                    {/* Se a sua logo estiver na pasta public, ela vai aparecer aqui. Ajuste o src se necessário. */}
                    <img src="/logo.png" alt="Logo Hospitalar" className="h-[75px] mb-4 object-contain" />

                    <h1 className="text-center text-[#001A72] m-0 text-3xl font-bold leading-tight">
                        Análise de Transferências
                    </h1>
                    <span className="text-center text-[#001A72] text-xl mt-1 font-medium">
                        Via Empréstimo
                    </span>
                </div>

                {/* Formulário integrado à Server Action do Supabase */}
                <form className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
                            Usuário
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#E87722] focus:border-[#E87722] outline-none transition-all bg-gray-50 hover:bg-white"
                            placeholder="Digite seu usuário (e-mail)"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="password">
                            Senha
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#E87722] focus:border-[#E87722] outline-none transition-all bg-gray-50 hover:bg-white"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {/* Botão de Entrar integrado com o login do servidor */}
                    <button
                        formAction={login}
                        className="w-full bg-[#E87722] hover:bg-[#d16615] text-white font-bold py-3 px-4 rounded-md transition-colors mt-4 shadow-md hover:shadow-lg"
                    >
                        Entrar
                    </button>
                </form>

            </div>
        </div>
    );
}
