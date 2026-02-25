'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Instancia um cliente Admin com Service Role obrigatoriamente
const getAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function getUsers() {
    const supabase = getAdminClient()

    // Busca os Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) throw new Error(authError.message)

    // Busca os profiles complementares
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*')
    // Nota: Se a tabela profiles não existir ainda, vai dar erro leve e tratar abaixo

    return users.map(user => {
        const prof = (profiles || []).find(p => p.id === user.id) || {};
        return {
            id: user.id,
            email: user.email,
            name: prof.name || user.user_metadata?.name || 'Sem Nome',
            role: prof.role || 'unidade',
            unit: prof.unit || null,
            created_at: user.created_at
        }
    })
}

export async function createUser(data: any) {
    const supabase = getAdminClient()

    // 1. Cria Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.name }
    })

    if (authError) return { error: authError.message }
    if (!authData.user) return { error: "Erro desconhecido ao criar usuário." }

    // 2. Cria Entry na Tabela Profiles
    const { error: profError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: data.name,
        role: data.role,
        unit: data.role === 'unidade' ? data.unit : null
    })

    // Se der erro na tabela profiles (ex: não criada ainda), deleta o auth user p/ rollback
    if (profError) {
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { error: `Erro ao criar Perfil: Certifique-se de que a Tabela 'profiles' existe no Supabase. Detalhe: ${profError.message}` }
    }

    revalidatePath('/usuarios')
    return { success: true }
}

export async function updateUser(id: string, data: any) {
    const supabase = getAdminClient()

    // Atualiza Senha se enviada
    if (data.password) {
        const { error: passErr } = await supabase.auth.admin.updateUserById(id, { password: data.password, user_metadata: { name: data.name } })
        if (passErr) return { error: passErr.message }
    } else {
        const { error: metaErr } = await supabase.auth.admin.updateUserById(id, { user_metadata: { name: data.name } })
        if (metaErr) return { error: metaErr.message }
    }

    // Atualiza Profile
    const { error: profErr } = await supabase.from('profiles').upsert({
        id: id,
        name: data.name,
        role: data.role,
        unit: data.role === 'unidade' ? data.unit : null
    })

    if (profErr) return { error: profErr.message }

    revalidatePath('/usuarios')
    return { success: true }
}

export async function deleteUser(id: string) {
    const supabase = getAdminClient()
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) return { error: error.message }
    revalidatePath('/usuarios')
    return { success: true }
}
