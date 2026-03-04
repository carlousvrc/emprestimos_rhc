'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard, History, User, Bell, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  name?: string
  role?: string
  unit?: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/historico', label: 'Histórico', icon: <History size={18} /> },
  { href: '/usuarios', label: 'Usuários', icon: <User size={18} />, adminOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email?.split('@')[0] || '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }

    init()
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = !profile || profile?.role === 'admin'

  const visibleNav = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FB] font-sans text-slate-800 selection:bg-[#E87722]/20 selection:text-[#001A72]">

      {/* Top Navbar */}
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

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1 ml-8 border-l border-slate-200 pl-8">
              {visibleNav.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm ${
                    isActive(item.href)
                      ? 'bg-[#001A72]/10 text-[#001A72]'
                      : 'text-slate-500 hover:text-[#001A72] hover:bg-slate-100'
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notification bell */}
            <button className="relative p-2 text-slate-400 hover:text-[#001A72] transition-colors rounded-full hover:bg-slate-100 hidden sm:block">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E87722] rounded-full border border-white" />
            </button>

            <div className="w-px h-8 bg-slate-200 hidden sm:block" />

            {/* Profile */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#001A72] leading-none">
                  {profile?.name || userEmail}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {profile?.unit || 'Sede'} · {profile?.role || 'Admin'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#001A72] to-[#2563eb] flex items-center justify-center text-white shadow-md border-2 border-white">
                <User size={18} />
              </div>
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="Sair do Sistema"
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all hidden sm:flex items-center justify-center"
            >
              <LogOut size={18} />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="lg:hidden p-2 text-slate-500 hover:text-[#001A72] hover:bg-slate-100 rounded-full transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-2">
            {visibleNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                  isActive(item.href)
                    ? 'bg-[#001A72]/10 text-[#001A72]'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-2">
              <button
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all text-sm w-full"
              >
                <LogOut size={18} /> Sair do Sistema
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/60 to-transparent pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  )
}
