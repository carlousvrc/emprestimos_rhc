import {
    extrairNumeros,
    extrairComponentesProduto,
    calcularSimilaridadePrecalc,
    ehCasaPortugal,
    ComponentesProduto
} from './analiseCore'

export interface AnaliseRow {
    data: string
    unidade_origem: string
    unidade_destino: string
    documento: string
    ds_produto: string
    especie?: string
    valor_total: number
    qt_entrada: number
    data_entrada?: string
    tempo_recebimento?: number
    [key: string]: any
}

// ---------- Hospital normalization (mirrors analise_core._normalizar_hospital) ----------
const HOSPITAL_DE_PARA: Record<string, string> = {
    'CASA DE PORTUGAL': 'HOSPITAL CASA DE PORTUGAL',
    'CASA DE PORTUGAL - REDE CASA': 'HOSPITAL CASA DE PORTUGAL',
    'HOSPITAL CASA MENSSANA - REDE CASA': 'HOSPITAL CASA MENSSANA',
    'HC MENSSANA PARTICULAR - REDE CASA': 'HOSPITAL CASA MENSSANA',
    'HOSPITAL EVANGELICO - REDE CASA': 'HOSPITAL CASA EVANGELICO',
    'HOSPITAL CASA EVANGÉLICO - REDE CASA': 'HOSPITAL CASA EVANGELICO',
    'HOSP.EVANGELICO - REDE CASA': 'HOSPITAL CASA EVANGELICO',
    'HOSPITAL CASA EVANGELICO - REDE CASA': 'HOSPITAL CASA EVANGELICO',
    'HOSPITAL CASA RIO LARANJEIRAS - REDE CASA': 'HOSPITAL CASA RIO LARANJEIRAS',
    'HOSPITAL RIO LARANJEIRAS - REDE CASA': 'HOSPITAL CASA RIO LARANJEIRAS',
    'HOSPITAL RIO LARANJEIRAS LTDA - REDE CASA': 'HOSPITAL CASA RIO LARANJEIRAS',
    'HOSPITAL CASA RIO BOTAFOGO - REDE CASA': 'HOSPITAL CASA RIO BOTAFOGO',
    'HOSPITAL CASA SANTA CRUZ - REDE CASA': 'HOSPITAL CASA SANTA CRUZ',
    'HOSPITAL SANTA CRUZ - REDE CASA': 'HOSPITAL CASA SANTA CRUZ',
    'HOSPITAL SANTA CRUZ': 'HOSPITAL CASA SANTA CRUZ',
    'HOSPITAL CASA SAO BERNARDO - REDE CASA': 'HOSPITAL CASA SAO BERNARDO',
    'HOSPITAL DE CANCER': 'HOSPITAL CASA PREMIUM',
    'HOSPITAL DE CANCER - REDE CASA': 'HOSPITAL CASA PREMIUM',
    'HOSPITAL CASA HOSPITAL DO CANCER – HCHC ADMINISTRACAO E GEST - REDE CASA': 'HOSPITAL CASA PREMIUM',
    'HOSPITAL CASA HOSPITAL DO CANCER - HCHC ADMINISTRACAO E GEST - REDE CASA': 'HOSPITAL CASA PREMIUM',
    'HOSPITAL CASA HOSPITAL DO CANCER - REDE CASA': 'HOSPITAL CASA PREMIUM',
    'HOSPITAL ILHA DO GOVERNADOR': 'HOSPITAL CASA ILHA DO GOVERNADOR',
    'HOSPITAL ILHA DO GOVERNADOR - REDE CASA': 'HOSPITAL CASA ILHA DO GOVERNADOR',
    'HOSPITAL ILHA DO GOVERNADOR LTDA - REDE CASA': 'HOSPITAL CASA ILHA DO GOVERNADOR',
}

function normalizarHospital(nome: string): string {
    const nomeNorm = String(nome || '')
        .replace(/–/g, '-')
        .replace(/—/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
    return HOSPITAL_DE_PARA[nomeNorm] ?? nomeNorm
}

// ---------- Wrapper to prepare rows (mirrors preparar_dataframe) ----------
export function prepararRows(rows: AnaliseRow[]): AnaliseRow[] {
    return rows
        .map(r => ({
            ...r,
            unidade_origem: normalizarHospital(r.unidade_origem),
            unidade_destino: normalizarHospital(r.unidade_destino),
        }))
        // Filter out OFTALMOCASA (mirrors analise_core preparar_dataframe filter)
        .filter(r => !r.unidade_origem.includes('OFTALMOCASA') && !r.unidade_destino.includes('OFTALMOCASA'))
}

// Emulates Pandas row transformation and mapping
export function analisarItens(dfSaidaRaw: AnaliseRow[], dfEntradaRaw: AnaliseRow[], limiarSimilaridade = 65) {
    // Apply normalization first (mirrors preparar_dataframe)
    const dfSaida = prepararRows(dfSaidaRaw)
    const dfEntrada = prepararRows(dfEntradaRaw)

    const analise: any[] = []
    const entradasProcessadas = new Set<number>()

    // Keep track of date range from saida (for orphan filtering)
    let periodoInicio: Date | null = null
    let periodoFim: Date | null = null

    // Pre-calculations
    const docIndex: Record<string, number[]> = {}

    dfEntrada.forEach((row, idx) => {
        row.comps = extrairComponentesProduto(row.ds_produto)
        row.doc_num = extrairNumeros(row.documento)
        row.origem_norm = String(row.unidade_origem || '').toUpperCase().trim()
        row.destino_norm = String(row.unidade_destino || '').toUpperCase().trim()

        if (row.doc_num) {
            if (!docIndex[row.doc_num]) docIndex[row.doc_num] = []
            docIndex[row.doc_num].push(idx)
        }
    })

    dfSaida.forEach((row) => {
        row.comps = extrairComponentesProduto(row.ds_produto)
        row.doc_num = extrairNumeros(row.documento)
        row.destino_cp = ehCasaPortugal(row.unidade_destino)
        row.origem_norm = String(row.unidade_origem || '').toUpperCase().trim()
        row.destino_norm = String(row.unidade_destino || '').toUpperCase().trim()
        // Track date range
        if (row.data) {
            const d = new Date(row.data)
            if (!periodoInicio || d < periodoInicio) periodoInicio = d
            if (!periodoFim || d > periodoFim) periodoFim = d
        }
    })

    const stats = {
        conformes: 0, nao_conformes: 0, nao_encontrados: 0,
        valor_divergente: 0, qtd_divergente: 0,
        matches_perfeitos: 0, matches_bons: 0, matches_razoaveis: 0
    }

    // ---- PRE-PASS: Group-based aggregation (mirrors matches_agrupados logic) ----
    const matchesAgrupados: Record<number, any> = {}
    const saidaComDoc = dfSaida.filter((r, i) => r.doc_num).map((r, i) => ({ r, i: dfSaida.indexOf(r) }))

    // Group saida by doc_num + produto
    const grupos: Record<string, { indices: number[], rows: AnaliseRow[] }> = {}
    saidaComDoc.forEach(({ r, i }) => {
        const chave = `${r.doc_num}_${r.ds_produto}`
        if (!grupos[chave]) grupos[chave] = { indices: [], rows: [] }
        grupos[chave].indices.push(i)
        grupos[chave].rows.push(r)
    })

    for (const [chave, grupo] of Object.entries(grupos)) {
        if (grupo.rows.length < 2) continue
        const docGrupo = grupo.rows[0].doc_num
        const compGrupo = grupo.rows[0].comps as ComponentesProduto
        const qtdTotalSaida = grupo.rows.reduce((acc, r) => acc + Number(r.qt_entrada || 0), 0)

        const candidatosIdx = docIndex[docGrupo] || []
        for (const idxE of candidatosIdx) {
            if (entradasProcessadas.has(idxE)) continue
            const rowE = dfEntrada[idxE]
            const qtdE = Number(rowE.qt_entrada || 0)
            const qtdMatchSoma = Math.abs(qtdE - qtdTotalSaida) < 0.1
            const limiarGrupo = qtdMatchSoma ? 70 : 85
            const { score: scoreProd } = calcularSimilaridadePrecalc(compGrupo, rowE.comps as ComponentesProduto, true)

            if (scoreProd >= limiarGrupo && qtdMatchSoma) {
                entradasProcessadas.add(idxE)
                grupo.indices.forEach((idxS, gi) => {
                    const rowS = dfSaida[idxS]
                    const qtdS = Number(rowS.qt_entrada || 0)
                    const percDoTotal = qtdTotalSaida > 0 ? qtdS / qtdTotalSaida : 0
                    const valorPropE = Number(rowE.valor_total) * percDoTotal
                    matchesAgrupados[idxS] = {
                        idxE, rowE, score: 100, scoreProd,
                        detalhes: `Agrupado (Soma ${grupo.rows.length} itens)`,
                        detalhesProduto: 'Match por agrupamento de saída',
                        valorEntradaProporcional: valorPropE,
                        qtdEntradaProporcional: qtdS
                    }
                })
                break
            }
        }
    }

    // ---- MAIN LOOP ----
    for (let i = 0; i < dfSaida.length; i++) {
        const rowS = dfSaida[i]
        let bestScore = 0
        let bestMatch: any = null

        // Check pre-calculated grouped match
        if (matchesAgrupados[i]) {
            const info = matchesAgrupados[i]
            const rowE = info.rowE
            const valorS = Number(rowS.valor_total)
            const valorE = info.valorEntradaProporcional
            const qtdS = Number(rowS.qt_entrada || 0)
            const qtdE = info.qtdEntradaProporcional
            const diferencaValor = Math.round((valorS - valorE) * 100) / 100
            const diferencaQtd = 0

            stats.conformes++
            stats.matches_perfeitos++

            analise.push({
                data: rowS.data,
                origem: rowS.unidade_origem,
                destino: rowS.unidade_destino,
                doc: rowS.doc_num,
                prod_saida: rowS.ds_produto,
                prod_entrada: rowE.ds_produto,
                especie: rowS.especie || '',
                val_saida: valorS,
                val_entrada: valorE,
                dif_val: diferencaValor,
                qtd_saida: qtdS,
                qtd_entrada: qtdE,
                dif_qtd: diferencaQtd,
                data_entrada: rowE.data,
                tempo_recebimento: 0,
                status: '✅ Conforme',
                tipo_div: '-',
                qualidade_match: '⭐⭐⭐ Excelente',
                detalhes_produto: info.detalhesProduto,
                obs: `Score:100% | ${info.detalhes}`
            })
            continue
        }

        const candidatosIdx = docIndex[rowS.doc_num] || []
        const candidatos = rowS.doc_num ? candidatosIdx.map(idx => ({ idx, row: dfEntrada[idx] })) : []

        for (const cand of candidatos) {
            if (entradasProcessadas.has(cand.idx)) continue

            const rowE = cand.row
            let scoreTotal = 0
            const detalhesMatch: string[] = []

            const docExato = rowS.doc_num === rowE.doc_num
            if (docExato) {
                scoreTotal += 40
                detalhesMatch.push(`Doc:✓${rowS.doc_num}`)
            } else {
                continue
            }

            const { score: scoreProduto, detalhes: detalhesProduto } = calcularSimilaridadePrecalc(
                rowS.comps as ComponentesProduto,
                rowE.comps as ComponentesProduto,
                docExato
            )

            const limiarEfetivo = Math.abs(Number(rowE.qt_entrada) - Number(rowS.qt_entrada)) < 0.01 ? 40 : 85

            if (scoreProduto < limiarEfetivo) continue

            scoreTotal += scoreProduto * 0.45
            detalhesMatch.push(`Prod:${scoreProduto}%`)

            if (rowS.origem_norm === rowE.origem_norm || rowS.destino_norm === rowE.destino_norm) {
                scoreTotal += 5
                detalhesMatch.push('Unid:✓')
            }

            const valorS = Number(rowS.valor_total)
            const valorE = Number(rowE.valor_total)
            if (valorS > 0 && Math.abs(valorS - valorE) / valorS <= 0.01) {
                scoreTotal += 2
                detalhesMatch.push('Valor:≈')
            }

            if (scoreTotal >= 50 && scoreTotal > bestScore) {
                bestScore = scoreTotal
                bestMatch = { idx: cand.idx, row: rowE, score: scoreTotal, detalhesMatch, detalhesProduto }
            }
        }

        if (bestMatch) {
            entradasProcessadas.add(bestMatch.idx)
            const rowE = bestMatch.row

            const valorS = Number(rowS.valor_total)
            const valorE = Number(rowE.valor_total)
            const qtdS = Number(rowS.qt_entrada || 0)
            const qtdE = Number(rowE.qt_entrada || 0)
            const diferencaValor = Math.round((valorS - valorE) * 100) / 100
            const diferencaQtd = Math.round((qtdS - qtdE) * 100) / 100
            const percDiffValor = valorS > 0 ? Math.abs(diferencaValor / valorS * 100) : 0

            const conformeQtd = Math.abs(diferencaQtd) < 0.01

            // Mirror Python: max(10, valor_s * 0.10) tolerance
            let conformeValor: boolean
            if (conformeQtd) {
                if (valorS < 10) {
                    conformeValor = Math.abs(diferencaValor) <= 1.0
                } else {
                    const limiteAbsoluto = Math.max(10.0, valorS * 0.10)
                    conformeValor = Math.abs(diferencaValor) <= limiteAbsoluto || percDiffValor <= 10
                }
            } else {
                conformeValor = Math.abs(diferencaValor) <= 10
            }

            let status = '❌ Não Conforme'
            let tipoDiv = ''
            let qualidadeMatch = '⭐ Razoável'

            if (bestMatch.score >= 90) { qualidadeMatch = '⭐⭐⭐ Excelente'; stats.matches_perfeitos++ }
            else if (bestMatch.score >= 75) { qualidadeMatch = '⭐⭐ Bom'; stats.matches_bons++ }
            else { stats.matches_razoaveis++ }

            if (conformeValor && conformeQtd) {
                status = '✅ Conforme'
                tipoDiv = '-'
                stats.conformes++
            } else {
                stats.nao_conformes++
                const parts: string[] = []
                if (!conformeValor) { parts.push('Divergência Valor'); stats.valor_divergente++ }
                if (!conformeQtd) { parts.push('Divergência Qtd'); stats.qtd_divergente++ }
                tipoDiv = parts.join(' | ')
            }

            analise.push({
                data: rowS.data,
                origem: rowS.unidade_origem,
                destino: rowS.unidade_destino,
                doc: rowS.doc_num,
                prod_saida: rowS.ds_produto,
                prod_entrada: rowE.ds_produto,
                especie: rowS.especie || '',
                val_saida: valorS,
                val_entrada: valorE,
                dif_val: diferencaValor,
                qtd_saida: qtdS,
                qtd_entrada: qtdE,
                dif_qtd: diferencaQtd,
                data_entrada: rowE.data,
                tempo_recebimento: 0,
                status,
                tipo_div: tipoDiv,
                qualidade_match: qualidadeMatch,
                detalhes_produto: bestMatch.detalhesProduto || '',
                obs: `Score:${bestMatch.score.toFixed(0)}% | ${bestMatch.detalhesMatch.join(' | ')}`
            })
        } else {
            stats.nao_encontrados++
            stats.nao_conformes++
            const motivo = rowS.doc_num ? `Documento ${rowS.doc_num} não encontrado` : 'Item não encontrado'
            analise.push({
                data: rowS.data,
                origem: rowS.unidade_origem,
                destino: rowS.unidade_destino,
                doc: rowS.doc_num,
                prod_saida: rowS.ds_produto,
                prod_entrada: '-',
                especie: rowS.especie || '',
                val_saida: Number(rowS.valor_total),
                val_entrada: null,
                dif_val: null,
                qtd_saida: Number(rowS.qt_entrada || 0),
                qtd_entrada: null,
                dif_qtd: null,
                data_entrada: null,
                tempo_recebimento: null,
                status: '⚠️ Não Recebido',
                tipo_div: motivo,
                qualidade_match: '-',
                detalhes_produto: '-',
                obs: 'Sem correspondência'
            })
        }
    }

    // ---- Orphan Entradas (only within saida date range, mirrors Python logic) ----
    dfEntrada.forEach((row, idx) => {
        if (entradasProcessadas.has(idx)) return

        // Skip if outside saida date range
        if (periodoInicio && periodoFim && row.data) {
            const dataE = new Date(row.data)
            if (dataE < periodoInicio || dataE > periodoFim) return
        }

        analise.push({
            data: row.data,
            origem: row.unidade_origem,
            destino: row.unidade_destino,
            doc: row.doc_num,
            prod_saida: '-',
            prod_entrada: row.ds_produto,
            especie: row.especie || '',
            val_saida: null,
            val_entrada: Number(row.valor_total),
            dif_val: null,
            qtd_saida: null,
            qtd_entrada: Number(row.qt_entrada || 0),
            dif_qtd: null,
            data_entrada: row.data,
            tempo_recebimento: null,
            status: '❌ Não Conforme',
            tipo_div: 'Item recebido sem saída',
            qualidade_match: '-',
            detalhes_produto: '-',
            obs: 'Entrada órfã'
        })
    })

    return { analise, stats }
}
