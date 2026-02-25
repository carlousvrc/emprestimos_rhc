import stringSimilarity from 'string-similarity'

export function extrairNumeros(documento: string | number): string {
    if (!documento) return ""
    const match = String(documento).match(/\d+/)
    return match ? match[0] : ""
}

export function normalizarValorNumerico(valor: any): number {
    if (valor === null || valor === undefined || valor === '') return 0.0
    if (typeof valor === 'number') return valor

    let valorStr = String(valor).trim().replace(/\s/g, '')
    if (!valorStr) return 0.0

    if (valorStr.includes(',') && valorStr.includes('.')) {
        valorStr = valorStr.replace(/\./g, '').replace(',', '.')
    } else if (valorStr.includes(',')) {
        valorStr = valorStr.replace(',', '.')
    } else if (valorStr.includes('.')) {
        const partes = valorStr.split('.')
        if (partes.length > 2) {
            valorStr = valorStr.replace(/\./g, '')
        } else if (partes.length === 2) {
            const parteDecimal = partes[1]
            if (parteDecimal === '000' || parteDecimal.length > 3) {
                valorStr = valorStr.replace(/\./g, '')
            }
        }
    }

    const num = parseFloat(valorStr)
    return isNaN(num) ? 0.0 : num
}

export function normalizarUnidadeMedida(texto: string): string {
    const mapeamento: Record<string, string> = {
        'GR': 'G', 'GRAMA': 'G', 'GRAMAS': 'G',
        'MILIGRAMA': 'MG', 'MILIGRAMAS': 'MG',
        'MILILITRO': 'ML', 'MILILITROS': 'ML',
        'MICROGRAMA': 'MCG', 'MICROGRAMAS': 'MCG',
        'UNIDADE': 'UI', 'UNIDADES': 'UI',
        'LITRO': 'L', 'LITROS': 'L',
        'METRO': 'M', 'METROS': 'M',
        'CENTIMETRO': 'CM', 'CENTIMETROS': 'CM',
        'MILIMETRO': 'MM', 'MILIMETROS': 'MM'
    }

    let textoNorm = texto.toUpperCase()
    for (const [variacao, padrao] of Object.entries(mapeamento)) {
        const regex = new RegExp(`\\b${variacao}\\b`, 'g')
        textoNorm = textoNorm.replace(regex, padrao)
    }

    return textoNorm
}

export function normalizarDimensao(dimensaoStr: string): string {
    const norm = dimensaoStr.toUpperCase().replace(/\s+/g, '')
    const numeros = norm.match(/\d+\.?\d*/g) || []
    return numeros.map(n => String(parseFloat(n))).sort().join('X')
}

export function extrairENormalizarConcentracao(descricao: string): string {
    const desc = normalizarUnidadeMedida(descricao)
    const padroes = [
        /(\d+[,.]?\d*)\s*(MG|G|ML|MCG|UI|L|%)\s*\/\s*(\d+[,.]?\d*)\s*(MG|G|ML|MCG|UI|L)/g,
        /(\d+[,.]?\d*)\s*(MG|G|ML|MCG|UI|L|%)(?!\s*\/)/g,
    ]
    const concentracoes: string[] = []

    padroes.forEach(regex => {
        let match
        while ((match = regex.exec(desc)) !== null) {
            // Retain only the matched blocks normalized
            const normalizedMatch = match[0].replace(/,/g, '.')
            concentracoes.push(normalizedMatch)
        }
    })

    return concentracoes.join(' ')
}

export interface ComponentesProduto {
    original: string
    normalizado: string
    principio_ativo: string
    concentracao: string
    apresentacao: string
    quantidade: string
    unidade_medida: string
    dimensao: string
    palavras_chave: string[]
}

export function extrairComponentesProduto(descricao: any): ComponentesProduto {
    let descStr = String(descricao || '').toUpperCase().trim()
    descStr = normalizarUnidadeMedida(descStr)

    const componentes: ComponentesProduto = {
        original: descStr,
        normalizado: '',
        principio_ativo: '',
        concentracao: '',
        apresentacao: '',
        quantidade: '',
        unidade_medida: '',
        dimensao: '',
        palavras_chave: []
    }

    let textoLimpo = descStr.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    componentes.normalizado = textoLimpo
    componentes.concentracao = extrairENormalizarConcentracao(descStr)

    const apresentacoes = [
        'AMPOLA', 'AMP', 'COMPRIMIDO', 'COMP', 'CP', 'CAPSULA', 'CAPS',
        'FRASCO', 'FR', 'SERINGA', 'SER', 'BOLSA', 'ENVELOPE', 'ENV',
        'TUBO', 'BISNAGA', 'SACHÊ', 'SACHE', 'BLISTER', 'CARTELA',
        'POTE', 'VIDRO', 'UNIDADE', 'UN', 'CAIXA', 'CX'
    ]
    for (const apres of apresentacoes) {
        if (descStr.includes(apres)) {
            componentes.apresentacao = apres
            break
        }
    }

    const qtdMatch = descStr.match(/(?:C\/|C |X|COM )\s*(\d+)/)
    if (qtdMatch && qtdMatch[1]) {
        componentes.quantidade = qtdMatch[1]
    }

    const dimensoes = descStr.match(/\d+\.?\d*\s*[xX]\s*\d+\.?\d*/)
    if (dimensoes && dimensoes[0]) {
        componentes.dimensao = normalizarDimensao(dimensoes[0])
    }

    const stopwords = [
        'DE', 'DA', 'DO', 'COM', 'PARA', 'EM', 'A', 'O', 'E', 'C/',
        'SOLUCAO', 'SOL', 'INJETAVEL', 'INJ', 'ORAL', 'USO', 'ADULTO',
        'PEDIATRICO', 'ESTERIL', 'DESCARTAVEL', 'DESC'
    ]
    const palavras = textoLimpo.split(' ')
    const palavrasChave = palavras.filter(p => !stopwords.includes(p) && p.length > 2)
    componentes.palavras_chave = palavrasChave.slice(0, 5)

    if (componentes.palavras_chave.length > 0) {
        componentes.principio_ativo = componentes.palavras_chave.slice(0, 2).join(' ')
    }

    return componentes
}

// Emulate Python's SequenceMatcher ratio utilizing string-similarity library
export function calcularSimilaridadePrecalc(comp1: ComponentesProduto, comp2: ComponentesProduto, ignorePenalties = false): { score: number, detalhes: string } {
    let score = 0
    const detalhes: string[] = []

    const sinonimos: Record<string, string[]> = {
        'AVENTAL': ['CAPOTE', 'AVENTAL', 'JALECO'],
        'CAPOTE': ['AVENTAL', 'CAPOTE', 'JALECO'],
        'JALECO': ['AVENTAL', 'CAPOTE', 'JALECO'],
        'ALGODAO': ['POLYCOT', 'ALGODAO', 'COTTON'],
        'GAZE': ['COMPRESSA', 'GAZE'],
        'COMPRESSA': ['GAZE', 'COMPRESSA'],
        'SORO': ['SOLUCAO', 'SORO', 'SOL'],
        'SOLUCAO': ['SORO', 'SOLUCAO', 'SOL'],
        'SALINA': ['NACL', 'CLORETO', 'SALINA', 'SF'],
        'SF': ['SALINA', 'NACL', 'CLORETO', 'SF'],
        'AMPOLA': ['AMP', 'AMPOLA', 'FRAMP', 'FRASCOAMPOLA'],
        'COMPRIMIDO': ['COMP', 'CP', 'COMPRIMIDO', 'DRAGEA'],
        'CAPSULA': ['CAPS', 'CAPSULA', 'CAP'],
        'INJETAVEL': ['INJ', 'INJETAVEL', 'IV', 'IM', 'SC'],
        'ORAL': ['VO', 'ORAL', 'BUCAL'],
        'DIPIRONA': ['METAMIZOL', 'DIPIRONA', 'NOVALGINA'],
        'PARACETAMOL': ['ACETAMINOFENO', 'PARACETAMOL'],
        'OMEPRAZOL': ['OMEPRAZOL', 'LOSEC'],
        'DICLOFENACO': ['DICLOFENACO', 'VOLTAREN', 'CATAFLAM'],
        'GLICOSE': ['DEXTROSE', 'GLICOSE'],
    }

    let temSinonimo = false
    for (const [termo, listaSin] of Object.entries(sinonimos)) {
        if (comp1.normalizado.includes(termo) && listaSin.some(s => comp2.normalizado.includes(s))) {
            temSinonimo = true
            break
        }
    }

    if (temSinonimo) {
        score += 15
        detalhes.push("Sinônimo:✓")
    }

    // Uses Dice's Coefficient which string-similarity wraps
    const simGeral = stringSimilarity.compareTwoStrings(comp1.normalizado, comp2.normalizado)
    score += Math.round(simGeral * 30)
    detalhes.push(`Texto:${Math.round(simGeral * 100)}%`)

    if (comp1.principio_ativo && comp2.principio_ativo) {
        const simPrincipio = stringSimilarity.compareTwoStrings(comp1.principio_ativo, comp2.principio_ativo)
        score += Math.round(simPrincipio * 35)
        detalhes.push(`Princípio:${Math.round(simPrincipio * 100)}%`)
    }

    if (comp1.concentracao && comp2.concentracao) {
        const c1 = comp1.concentracao.replace(/\s/g, '').toUpperCase()
        const c2 = comp2.concentracao.replace(/\s/g, '').toUpperCase()

        if (c1 === c2) {
            score += 20
            detalhes.push("Conc:✓")
        } else {
            const nums1: string[] = c1.match(/\d+\.?\d*/g) || []
            const nums2: string[] = c2.match(/\d+\.?\d*/g) || []
            const comum = nums1.filter(n => nums2.includes(n))

            if (comum.length > 0 && comum.length >= nums1.length * 0.5) {
                score += 15
                detalhes.push("Conc:~")
            } else {
                const simConc = stringSimilarity.compareTwoStrings(c1, c2)
                if (simConc > 0.7) {
                    score += Math.round(simConc * 15)
                    detalhes.push(`Conc:~${Math.round(simConc * 100)}%`)
                } else if (!ignorePenalties) {
                    score -= 25
                    detalhes.push("Conc:Mismatch")
                }
            }
        }
    }

    if (comp1.dimensao && comp2.dimensao) {
        if (comp1.dimensao === comp2.dimensao) {
            score += 15
            detalhes.push("Dim:✓")
        } else {
            const nums1 = comp1.dimensao.split('X')
            const nums2 = comp2.dimensao.split('X')
            const comum = nums1.filter(n => nums2.includes(n))
            if (comum.length >= 2) {
                score += 10
                detalhes.push("Dim:~")
            } else if (comum.length >= 1) {
                score += 5
                detalhes.push("Dim:part")
            } else if (!ignorePenalties) {
                score -= 15
                detalhes.push("Dim:Mismatch")
            }
        }
    }

    if (comp1.apresentacao && comp2.apresentacao) {
        if (comp1.apresentacao === comp2.apresentacao) {
            score += 10
            detalhes.push("Apres:✓")
        } else {
            const equivApresentacao = {
                'AMPOLA': ['AMP', 'AMPOLA', 'FR/AMP', 'FRASCO/AMPOLA'],
                'FR/AMP': ['AMP', 'AMPOLA', 'FR/AMP', 'FRASCO/AMPOLA'],
                'COMPRIMIDO': ['COMP', 'CP', 'COMPRIMIDO'],
                'CAPSULA': ['CAPS', 'CAPSULA'],
                'FRASCO': ['FR', 'FRASCO', 'FR/AMP'],
                'SERINGA': ['SER', 'SERINGA']
            }

            let matchApres = false
            for (const grupo of Object.values(equivApresentacao)) {
                if (grupo.includes(comp1.apresentacao) && grupo.includes(comp2.apresentacao)) {
                    score += 10
                    detalhes.push("Apres:equiv")
                    matchApres = true
                    break
                }
            }
            if (!matchApres && !ignorePenalties) {
                score -= 10
                detalhes.push("Apres:Mismatch")
            }
        }
    }

    const comumPalavras = comp1.palavras_chave.filter(p => comp2.palavras_chave.includes(p))
    if (comumPalavras.length > 0) {
        const p = comumPalavras.length / Math.max(comp1.palavras_chave.length, comp2.palavras_chave.length)
        score += Math.round(p * 5)
        detalhes.push(`Palavras:${comumPalavras.length}`)
    }

    return { score, detalhes: detalhes.join(' | ') }
}

export function ehCasaPortugal(unidade: string): boolean {
    const uni = String(unidade || '').toUpperCase().trim()
    return uni.includes('CASA') && uni.includes('PORTUGAL')
}
