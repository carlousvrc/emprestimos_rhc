import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, User, Key, Building } from 'lucide-react'
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
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">

      {/* Financeiro-Style Dark Sidebar */}
      <aside className="w-[300px] bg-slate-950 text-slate-300 flex-shrink-0 flex flex-col transition-all duration-300 shadow-2xl z-10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>

        {/* App Branding */}
        <div className="relative px-6 py-8 border-b border-slate-800/60 flex items-center justify-center flex-col">
          <div className="bg-white p-3 rounded-xl shadow-lg mb-4">
            <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
          </div>
          <h2 className="text-[18px] font-bold text-white leading-tight mt-2 text-center">
            Análise RHC
          </h2>
          <span className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">Financeiro</span>
        </div>

        {/* User Profile Info */}
        <div className="px-6 py-8 flex-1 flex flex-col overflow-y-auto relative">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Seus Dados</h3>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80 mb-8 mt-2 space-y-4 shadow-inner">

            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg">
                <User size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Nome</span>
                <span className="text-[13px] font-medium text-slate-200 truncate max-w-[160px]" title={profile?.name || user.email}>
                  {profile?.name || user.email?.split('@')[0]}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-500/10 text-orange-500 p-2 rounded-lg">
                <Key size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Acesso</span>
                <span className="text-[13px] font-medium text-slate-200">{profile?.role || 'Usuário Padrão'}</span>
              </div>
            </div>

            {profile?.unit && (
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
                  <Building size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Unidade Base</span>
                  <span className="text-[13px] font-medium text-slate-200">{profile.unit}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800/60">
            <form action={signout}>
              <button className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all font-bold text-sm">
                <LogOut size={16} strokeWidth={2.5} />
                <span>Sair da Conta</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="px-6 md:px-10 lg:px-14 py-10 w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
