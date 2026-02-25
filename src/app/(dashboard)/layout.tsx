import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, UserCircle2, Building2, ShieldCheck } from 'lucide-react'
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
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">

      {/* Modern Dashboard Sidebar */}
      <aside className="w-[300px] bg-white border-r border-slate-200 flex-shrink-0 flex flex-col transition-all duration-300 shadow-sm z-10">

        {/* App Branding */}
        <div className="px-6 py-8 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-[#001D6D] p-2 rounded-lg">
            <div className="text-[#F37021] text-xl font-black leading-none">⌂</div>
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-[#001D6D] leading-tight">Análise RHC</h2>
            <span className="text-xs text-slate-500 font-medium">Via Empréstimo</span>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="px-6 py-8 flex-1 flex flex-col overflow-y-auto">

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 mt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Sessão Atual</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <UserCircle2 size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Nome</span>
                  <span className="text-[14px] font-semibold text-slate-700 truncate max-w-[160px]" title={profile?.name || user.email}>
                    {profile?.name || user.email?.split('@')[0]}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                  <ShieldCheck size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Perfil</span>
                  <span className="text-[14px] font-medium text-slate-700">{profile?.role || 'Usuário Padrão'}</span>
                </div>
              </div>

              {profile?.unit && (
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                    <Building2 size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Unidade Base</span>
                    <span className="text-[14px] font-medium text-slate-700">{profile.unit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-6">
            <form action={signout}>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-semibold text-sm shadow-sm">
                <LogOut size={16} strokeWidth={2.5} />
                <span>Encerrar Sessão</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area with soft background */}
      <main className="flex-1 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="absolute inset-0 bg-slate-50/90 z-0 pointer-events-none"></div>
        <div className="relative z-10 px-6 md:px-10 lg:px-14 py-10 w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
