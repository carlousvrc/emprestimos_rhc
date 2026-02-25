require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Para criar usuários, precisamos da service_role_key. Se não existir no .env, usaremos a anon key (tentativa) ou avisaremos.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Tenta pegar a service_role key; se não tiver, e as permissões de Anon permitirem signup direto:
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("Tentando criar usuário com credenciais do Python original...");

    // O Supabase exige que seja um Formato de E-mail. 
    // Como o usuário usava "admin", mapearemos internamente para "admin@hospitalcasa.com.br"
    const email = 'admin@hospitalcasa.com.br';
    const password = 'Rc2026';

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                name: 'Administrador ERP',
                role: 'Admin',
                unit: 'Sede'
            }
        }
    });

    if (error) {
        console.error("Erro ao criar usuário Auth:", error.message);
        return;
    }

    console.log("SUCESSO! O Usuário foi criado no Supabase Auth. ID:", data.user.id);

    // Insere o Profile Público (se a trigger auth.users não existir)
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        name: 'Administrador ERP',
        role: 'Admin',
        unit: 'Sede'
    });

    if (profileError) {
        console.warn("Aviso na tabela Profile (talvez já criada por Trigger):", profileError.message);
    }
}

createAdmin();
