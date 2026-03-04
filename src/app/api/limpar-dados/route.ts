import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    // Protegido pela mesma chave do cron
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Limpa as tabelas em ordem (itens_clinicos primeiro pois pode ter FK)
    const { error: errItens } = await supabase
        .from('itens_clinicos')
        .delete()
        .not('id', 'is', null)

    if (errItens) {
        return NextResponse.json({ error: 'Falha ao limpar itens_clinicos: ' + errItens.message }, { status: 500 })
    }

    const { error: errCons } = await supabase
        .from('analises_consolidadas')
        .delete()
        .not('id', 'is', null)

    if (errCons) {
        return NextResponse.json({ error: 'Falha ao limpar analises_consolidadas: ' + errCons.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: 'Dados limpos com sucesso. Tabelas itens_clinicos e analises_consolidadas esvaziadas.'
    })
}
