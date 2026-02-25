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
    <div className="flex min-h-screen bg-white font-sans text-[#31333f]">
      {/* Streamlit Custom Sidebar */}
      <aside className="w-[336px] bg-[#F0F2F6] flex-shrink-0 flex flex-col transition-all duration-300">
        <div className="px-6 py-12 flex-1 flex flex-col">
          <h2 className="text-xl font-bold text-[#002D62] mb-6 tracking-tight">Usuário Autenticado</h2>

          <div className="space-y-4 text-[15px] text-[#31333f] mb-8">
            <div>
              <span className="font-semibold block mb-0.5">Nome</span>
              {profile?.name || user.email}
            </div>
            <div>
              <span className="font-semibold block mb-0.5">Perfil</span>
              {profile?.role || 'Usuário'}
            </div>
            {profile?.unit && (
              <div>
                <span className="font-semibold block mb-0.5">Unidade</span>
                {profile.unit}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-[#D3D4D6]">
            {/* Streamlit Secondary Button Style */}
            <form action={signout}>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#caced1] text-[#31333F] rounded-lg hover:border-[#F37021] hover:text-[#F37021] transition-colors font-semibold">
                <LogOut size={16} />
                <span>Sair do Sistema</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content analogous to layout="wide" in Streamlit */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-12 lg:px-[6rem] py-12 w-full max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
