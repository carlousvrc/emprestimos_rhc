import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, LayoutDashboard, History } from 'lucide-react'
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
    <div className="flex h-screen bg-[#F0F2F6] font-sans text-[#001A72] overflow-hidden">

      {/* Sidebar (Left, Fixed): Dark Blue Background */}
      <aside className="w-[280px] flex-shrink-0 flex flex-col transition-all duration-300 shadow-xl z-10 text-white" style={{ backgroundColor: '#001A72' }}>

        {/* User Info at the Top */}
        <div className="p-6 border-b border-white/10 flex flex-col gap-1 mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Usuário Logado</h2>
          <p className="text-lg font-bold truncate" title={profile?.name || user.email}>
            {profile?.name || user.email?.split('@')[0]}
          </p>
          <p className="text-sm font-medium text-white/80">{profile?.role || 'Admin'}</p>
          <p className="text-sm font-medium text-white/80">Unidade: {profile?.unit || 'Sede'}</p>
        </div>

        {/* Navigation Links */}
        <div className="px-4 py-6 flex-1 flex flex-col gap-2">
          <a href="/" className="flex items-center gap-3 px-4 py-3 bg-[#E87722] text-white rounded-lg font-semibold shadow-md transition-colors">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white rounded-lg font-semibold transition-colors">
            <History size={20} />
            <span>Histórico</span>
          </a>
        </div>

        {/* Logout Button at bottom */}
        <div className="p-6 mt-auto">
          <form action={signout}>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 hover:border-white/30 transition-all font-semibold shadow-sm">
              <LogOut size={18} />
              <span>Sair do Sistema</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area (Right) */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
