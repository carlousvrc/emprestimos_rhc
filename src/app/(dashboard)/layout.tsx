import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, LayoutDashboard, History, User, Bell } from 'lucide-react'
import { signout } from '@/utils/supabase/server'
import Link from 'next/link'

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
    <div className="flex flex-col min-h-screen bg-[#F4F7FB] font-sans text-slate-800 selection:bg-[#E87722]/20 selection:text-[#001A72]">

      {/* Top Navbar (Modern Glassmorphism) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">

          {/* Brand & Logo */}
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center p-2">
              <img src="/logo.png" alt="Hospital Casa" className="h-10 object-contain" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-[#001A72] font-black text-lg tracking-tight leading-tight">Painel de Empréstimos</span>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sistema Integrado</span>
            </div>

            {/* Main Nav Items */}
            <nav className="hidden lg:flex items-center gap-2 ml-8 border-l border-slate-200 pl-8">
              <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-[#001A72]/5 text-[#001A72] rounded-full font-bold transition-all hover:bg-[#001A72]/10">
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link href="#" className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#001A72] rounded-full font-bold transition-all hover:bg-slate-100">
                <History size={18} /> Histórico
              </Link>
              {(!profile || profile?.role === 'admin') && (
                <Link href="/usuarios" className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-[#001A72] rounded-full font-bold transition-all hover:bg-slate-100">
                  <User size={18} /> Usuários
                </Link>
              )}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-[#001A72] transition-colors rounded-full hover:bg-slate-100 hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E87722] rounded-full border border-white"></span>
            </button>

            <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#001A72] leading-none">{profile?.name || user.email?.split('@')[0]}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{profile?.unit || 'Sede'} • {profile?.role || 'Admin'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#001A72] to-[#2563eb] flex items-center justify-center text-white shadow-md border-2 border-white">
                <User size={18} />
              </div>
            </div>

            <form action={signout} className="ml-2">
              <button title="Sair do Sistema" className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center justify-center">
                <LogOut size={18} />
              </button>
            </form>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none -z-10"></div>
        {children}
      </main>
    </div>
  )
}
