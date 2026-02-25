import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signout } from '@/utils/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-800">

      {/* Sidebar estilo Streamlit nativo */}
      <aside className="w-[300px] flex-shrink-0 flex flex-col bg-[#F0F2F6] border-r border-slate-200 transition-all duration-300">

        {/* Espaçamento superior igual ao Streamlit */}
        <div className="p-6 mt-8 flex flex-col gap-6">

          {/* Componente de Select Streamlit (Unidade) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Unidade</label>
            <div className="relative">
              <select className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-sm">
                <option>Selecione uma opção</option>
                <option>Hospital Central</option>
                <option>Hospital Norte</option>
                <option>Hospital Sul</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>
          </div>

          {/* Componente Text Input Streamlit (Requisitante) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Nome do Requisitante</label>
            <input
              type="text"
              className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-sm"
              placeholder="Digite o nome..."
            />
          </div>

          {/* Informação do Usuário */}
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-800 mb-1">Logado como:</p>
            <p className="truncate">{profile?.name || user.email}</p>
            <p className="text-xs text-slate-500 mt-1">{profile?.role || 'Admin'} | {profile?.unit || 'Sede'}</p>
          </div>
        </div>

        {/* Logout Button at bottom */}
        <div className="mt-auto p-6">
          <form action={signout}>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors text-sm font-semibold shadow-sm">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area (Direita) */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 md:px-12 py-12 w-full mx-auto max-w-[1200px]">
          {children}
        </div>
      </main>
    </div>
  )
}
