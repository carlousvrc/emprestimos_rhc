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

  // Fetch user profile info (name, role, unit)
  // Assumes a 'profiles' table exists that matches auth.users.id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-[#F0F2F6]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-[#001A72] mb-4">Usuário</h2>

          <div className="space-y-2 text-sm text-gray-700 mb-8">
            <p><span className="font-semibold">Nome:</span> {profile?.name || user.email}</p>
            <p><span className="font-semibold">Perfil:</span> {profile?.role || 'Usuário'}</p>
            {profile?.unit && (
              <p><span className="font-semibold">Unidade:</span> {profile.unit}</p>
            )}
          </div>

          <form action={signout}>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
