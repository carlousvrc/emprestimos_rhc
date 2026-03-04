'use client'

import React, { useMemo, Suspense } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parseAsString, parseAsArrayOf, parseAsInteger, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Download, RefreshCw, Info, Activity, AlertCircle, FileText,
  TrendingUp, Sparkles, Filter, Loader2, Calendar as CalendarIcon,
  Clock, Inbox, ChevronLeft, ChevronRight
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemClinico {
  id?: string
  data_transferencia: string
  unidade_origem: string
  unidade_destino: string
  documento: string
  produto_saida: string
  produto_entrada?: string
  valor_saida?: number
  valor_entrada?: number
  diferenca_financeira?: number
  status_item: string
  created_at?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const fetchAllItens = async (): Promise<{ itens: ItemClinico[]; lastUpdate: string }> => {
  const supabase = createClient()

  const [{ data: analises }, allItens] = await Promise.all([
    supabase
      .from('analises_consolidadas')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1),
    (async () => {
      const PAGE_SIZE = 1000 // Supabase max-rows padrão é 1000 por request
      let items: ItemClinico[] = []
      let from = 0
      let keepFetching = true
      while (keepFetching) {
        const { data: page, error } = await supabase
          .from('itens_clinicos')
          .select('*')
          .order('data_transferencia', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)
        if (error) throw error
        if (page && page.length > 0) {
          items = [...items, ...page]
          from += PAGE_SIZE
          if (page.length < PAGE_SIZE) keepFetching = false
        } else {
          keepFetching = false
        }
      }
      return items
    })(),
  ])

  const lastUpdate =
    analises && analises.length > 0
      ? new Date(analises[0].created_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''

  return { itens: allItens, lastUpdate }
}

const syncEmails = async (): Promise<string> => {
  const res = await fetch('/api/atualizar-agora', { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar')
  return data.message || 'Sincronização concluída!'
}

// ─── Lógica de filtragem e paginação ──────────────────────────────────────────

const PERIODOS = ['Todo o Período', 'Mês Atual', 'Mês Anterior', 'Últimos 3 Meses'] as const
const PAGE_SIZES = [25, 50, 100, 200]

function applyFilters(
  items: ItemClinico[],
  periodo: string,
  statusFilter: string[],
  unidadeFilter: string[]
): ItemClinico[] {
  let result = items

  if (periodo !== 'Todo o Período') {
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()

    result = result.filter(item => {
      const raw = item.data_transferencia
      if (!raw) return false
      const d = new Date(raw)
      if (isNaN(d.getTime())) return false
      const mes = d.getMonth()
      const ano = d.getFullYear()

      if (periodo === 'Mês Atual') return mes === mesAtual && ano === anoAtual
      if (periodo === 'Mês Anterior') {
        const mesAnt = mesAtual === 0 ? 11 : mesAtual - 1
        const anoAnt = mesAtual === 0 ? anoAtual - 1 : anoAtual
        return mes === mesAnt && ano === anoAnt
      }
      if (periodo === 'Últimos 3 Meses') {
        const limite = new Date()
        limite.setMonth(limite.getMonth() - 3)
        return d >= limite
      }
      return true
    })
  }

  if (statusFilter.length > 0) {
    result = result.filter(item => statusFilter.includes(item.status_item || 'Desconhecido'))
  }

  if (unidadeFilter.length > 0) {
    result = result.filter(
      item =>
        unidadeFilter.includes(item.unidade_origem) ||
        unidadeFilter.includes(item.unidade_destino)
    )
  }

  return result
}

function computeMetrics(filteredData: ItemClinico[]) {
  let tSaida = 0, tEntrada = 0, tPendente = 0, tDivergencia = 0
  let iConf = 0, iNConf = 0, iPend = 0

  filteredData.forEach(item => {
    const vS = item.valor_saida != null ? Number(item.valor_saida) : null
    const vE = item.valor_entrada != null ? Number(item.valor_entrada) : null
    const statusLower = String(item.status_item || '').toLowerCase()
    const hasValorSaida = vS !== null && !isNaN(vS)

    if (hasValorSaida) tSaida += vS!
    if (hasValorSaida && vE !== null && !isNaN(vE)) tEntrada += vE

    if (statusLower.includes('não recebido')) {
      if (hasValorSaida) tPendente += vS!
      iPend++
    } else if (statusLower === 'conforme') {
      iConf++
    } else if (statusLower.includes('não conforme')) {
      iNConf++
      const dif = typeof item.diferenca_financeira === 'number' ? item.diferenca_financeira : 0
      tDivergencia += Math.abs(dif)
    }
  })

  return {
    totalSaida: tSaida,
    totalEntrada: tEntrada,
    pendentes: tPendente,
    divergencias: tDivergencia,
    itensProcessados: filteredData.length,
    conformes: iConf,
    naoConformes: iNConf,
    itensPendentes: iPend,
    entradasInferiores: 0,
    divergenciaQuantidade: iNConf,
    tempoMedio: 24,
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  if (s === 'conforme')
    return <span className="inline-flex text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Conforme</span>
  if (s.includes('não recebido') || s === 'pendente')
    return <span className="inline-flex text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Pendente</span>
  if (s.includes('não conforme'))
    return <span className="inline-flex text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Não Conforme</span>
  if (s.includes('divergente'))
    return <span className="inline-flex text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Divergente</span>
  return <span className="inline-flex text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">{status}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

function DashboardInner() {
  const queryClient = useQueryClient()

  // ── URL State (nuqs) ──
  const [filters, setFilters] = useQueryStates({
    periodo: parseAsString.withDefault('Todo o Período'),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    unidade: parseAsArrayOf(parseAsString).withDefault([]),
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(50),
  })

  const { periodo, status: statusFilter, unidade: unidadeFilter, page, pageSize } = filters

  // ── Data Fetching (TanStack Query) ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-itens'],
    queryFn: fetchAllItens,
  })

  const rawItens = data?.itens ?? []
  const lastUpdate = data?.lastUpdate ?? ''

  // ── Sync Mutation ──
  const syncMutation = useMutation({
    mutationFn: syncEmails,
    onMutate: () => {
      toast.loading('Sincronizando emails do Gmail...', { id: 'sync' })
    },
    onSuccess: (message) => {
      toast.success(message, { id: 'sync', duration: 5000 })
      queryClient.invalidateQueries({ queryKey: ['dashboard-itens'] })
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: 'sync', duration: 8000 })
      queryClient.invalidateQueries({ queryKey: ['dashboard-itens'] })
    },
  })

  // ── Computed Data ──
  const filteredData = useMemo(
    () => applyFilters(rawItens, periodo, statusFilter, unidadeFilter),
    [rawItens, periodo, statusFilter, unidadeFilter]
  )

  const metrics = useMemo(() => computeMetrics(filteredData), [filteredData])

  const periodoApurado = useMemo(() => {
    const datas = filteredData
      .map(i => (i.data_transferencia ? new Date(i.data_transferencia) : null))
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    if (datas.length === 0) return null
    const min = new Date(Math.min(...datas.map(d => d.getTime())))
    const max = new Date(Math.max(...datas.map(d => d.getTime())))
    return `${min.toLocaleDateString('pt-BR')} até ${max.toLocaleDateString('pt-BR')}`
  }, [filteredData])

  const availableStatuses = useMemo(
    () => Array.from(new Set(rawItens.map(i => i.status_item || 'Desconhecido'))).sort(),
    [rawItens]
  )

  const availableUnits = useMemo(
    () =>
      Array.from(
        new Set([...rawItens.map(i => i.unidade_origem), ...rawItens.map(i => i.unidade_destino)].filter(Boolean))
      ).sort(),
    [rawItens]
  )

  const pieData = [
    { name: 'Conforme', value: metrics.conformes || 1, color: '#10B981' },
    { name: 'Divergente', value: metrics.naoConformes || 0, color: '#EF4444' },
    { name: 'Pendente', value: metrics.itensPendentes || 0, color: '#F59E0B' },
  ]

  const barData = useMemo(() => {
    const hospitalDivergencias: Record<string, number> = {}
    filteredData.forEach(item => {
      const s = (item.status_item || '').toLowerCase()
      if (s.includes('não conforme') || s.includes('divergente')) {
        hospitalDivergencias[item.unidade_origem] = (hospitalDivergencias[item.unidade_origem] || 0) + 1
      }
    })
    const rankings = Object.keys(hospitalDivergencias)
      .map(k => ({ name: k.replace('Hospital ', ''), value: hospitalDivergencias[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    return rankings.length > 0 ? rankings : [{ name: 'Nenhuma', value: 0 }]
  }, [filteredData])

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedData = filteredData.slice((safePage - 1) * pageSize, safePage * pageSize)

  const setPage = (p: number) => setFilters({ page: p })
  const setPageSize = (s: number) => setFilters({ pageSize: s, page: 1 })
  const setPeriodo = (p: string) => setFilters({ periodo: p, page: 1 })
  const setStatusFilter = (s: string[]) => setFilters({ status: s, page: 1 })
  const setUnidadeFilter = (u: string[]) => setFilters({ unidade: u, page: 1 })

  // ── Export ──
  const exportToExcel = () => {
    const flatData = filteredData.map(item => ({
      'Data': new Date(item.data_transferencia).toLocaleDateString('pt-BR'),
      'Unidade Origem': item.unidade_origem,
      'Unidade Destino': item.unidade_destino,
      'Documento': item.documento,
      'Produto (Saída)': item.produto_saida,
      'Produto (Entrada)': item.produto_entrada || '-',
      'Valor Saída (R$)': item.valor_saida,
      'Valor Entrada (R$)': item.valor_entrada,
      'Diferença (R$)': (item.valor_saida || 0) - (item.valor_entrada || 0),
      'Status': item.status_item?.toUpperCase(),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flatData), 'Análise Filtrada')

    const ncData = flatData.filter(
      i => i['Status']?.includes('NÃO CONFORME') || i['Status']?.includes('DIVERGENTE')
    )
    if (ncData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ncData), 'Não Conformes')
    }

    const confData = flatData.filter(i => i['Status'] === 'CONFORME')
    if (confData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(confData), 'Conformes')
    }

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `exportacao_rhc_analise_${Date.now()}.xlsx`
    )
    toast.success(`${filteredData.length} registros exportados com sucesso!`)
  }

  const isSyncing = syncMutation.isPending
  const isLoadingData = isLoading && rawItens.length === 0

  // ── Loading State ──
  if (isLoadingData) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center gap-4">
        <Loader2 size={48} className="animate-spin text-[#001A72]" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">
          Consultando Banco de Dados...
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <p className="text-slate-700 font-bold text-lg">Erro ao carregar dados</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard-itens'] })} className="bg-[#001A72] text-white">
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:gap-10 pb-20 font-sans w-full max-w-[1600px] mx-auto px-4 md:px-8 mt-6">

      {/* 1. Hero Section */}
      <div className="relative w-full rounded-[2rem] bg-gradient-to-br from-[#001A72] via-[#00279c] to-[#0039cc] p-8 md:p-10 shadow-2xl shadow-[#001A72]/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E87722] opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-2 w-fit">
            <Sparkles size={14} className="text-[#E87722]" /> Visão Geral
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Transferências <span className="text-[#E87722]">Via Empréstimo</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base font-medium max-w-xl mt-2 leading-relaxed">
            Mapeamento Interativo com Filtros. Analisando{' '}
            <strong className="text-white bg-white/20 px-2 py-0.5 rounded-md">
              {filteredData.length} registros
            </strong>{' '}
            de transferências entre unidades.
          </p>
          {periodoApurado && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white/80 text-xs font-bold mt-2 w-fit">
              <CalendarIcon size={13} className="text-[#E87722]" />
              Período Apurado: <span className="text-white">{periodoApurado}</span>
            </div>
          )}
        </div>

        <div className="relative z-10 flex flex-col items-end gap-4 w-full md:w-auto">
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={isSyncing || isLoading}
            className="w-full md:w-auto bg-[#E87722] hover:bg-white hover:text-[#E87722] text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-[#E87722]/30 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <RefreshCw
              size={20}
              className={`${isSyncing || isLoading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}
            />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Emails'}
          </Button>
          <div className="flex items-center gap-2 text-white/60 text-xs font-bold bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Info size={14} /> Atualizado {lastUpdate ? `hoje, às ${lastUpdate}` : 'agora'}
          </div>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 -mt-8 md:-mt-12 relative z-20 px-4">
        <div className="w-full xl:w-auto bg-white/90 backdrop-blur-xl p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 flex flex-wrap gap-2">
          <div className="hidden sm:flex items-center justify-center px-4 text-slate-300 border-r border-slate-100 mr-2">
            <CalendarIcon size={18} />
          </div>
          {PERIODOS.map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                periodo === p
                  ? 'bg-[#001A72] text-white shadow-md'
                  : 'bg-transparent text-slate-500 hover:bg-slate-100/50 hover:text-[#001A72]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-3 bg-white/90 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
          <div className="flex items-center gap-2 text-[#E87722] font-black text-xs uppercase tracking-widest px-2 min-w-[max-content]">
            <Filter size={16} /> Filtros
          </div>
          <div className="w-full sm:w-[220px]">
            <MultiSelect
              options={availableStatuses}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Status da Análise..."
            />
          </div>
          <div className="w-full sm:w-[260px]">
            <MultiSelect
              options={availableUnits}
              selected={unidadeFilter}
              onChange={setUnidadeFilter}
              placeholder="Buscar Hospitais..."
            />
          </div>
        </div>
      </div>

      {/* 3. Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[1.5rem] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp size={20} strokeWidth={2.5} />
          </div>
          <div className="mt-2">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Enviado</p>
            <h3 className="text-xl lg:text-2xl font-black text-[#001A72] tracking-tight truncate" title={formatCurrency(metrics.totalSaida)}>
              {formatCurrency(metrics.totalSaida)}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-[1.5rem] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Inbox size={20} strokeWidth={2.5} className="scale-y-[-1]" />
          </div>
          <div className="mt-2">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Recebido</p>
            <h3 className="text-xl lg:text-2xl font-black text-[#001A72] tracking-tight truncate" title={formatCurrency(metrics.totalEntrada)}>
              {formatCurrency(metrics.totalEntrada)}
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-orange-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="w-10 h-10 rounded-xl bg-[#E87722] text-white flex items-center justify-center relative z-10 shadow-md shadow-orange-500/20">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div className="relative z-10 mt-2 flex-1">
            <p className="text-orange-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Valores Pendentes</p>
            <h3 className="text-xl lg:text-2xl font-black text-[#85400d] tracking-tight truncate" title={formatCurrency(metrics.pendentes)}>
              {formatCurrency(metrics.pendentes)}
            </h3>
          </div>
          <div className="mt-1 pt-2 border-t border-orange-200/50 relative z-10">
            <span className="text-[10px] text-[#E87722] font-black tracking-wide">
              — {metrics.totalSaida > 0 ? ((metrics.pendentes / metrics.totalSaida) * 100).toFixed(1) : 0}% do Total
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-[1.5rem] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-red-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center relative z-10 shadow-md shadow-red-500/20">
            <AlertCircle size={20} strokeWidth={2.5} />
          </div>
          <div className="relative z-10 mt-2 flex-1">
            <p className="text-red-900/60 text-[10px] font-black uppercase tracking-widest mb-1">Divergências</p>
            <h3 className="text-xl lg:text-2xl font-black text-red-950 tracking-tight truncate" title={formatCurrency(metrics.divergencias)}>
              {formatCurrency(metrics.divergencias)}
            </h3>
          </div>
          <div className="mt-1 pt-2 border-t border-red-200/50 relative z-10">
            <span className="text-[10px] text-red-600 font-black tracking-wide">
              ! {metrics.totalEntrada > 0 ? ((metrics.divergencias / metrics.totalEntrada) * 100).toFixed(1) : 0}% da Entrada
            </span>
          </div>
        </div>
      </div>

      {/* 4. Operational KPIs */}
      <h2 className="text-2xl font-black text-[#001A72] tracking-tight mt-6 md:mt-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#E87722]/10 text-[#E87722] flex items-center justify-center">
          <Activity size={18} strokeWidth={3} />
        </div>
        Desempenho Operacional Resumido
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-center relative overflow-hidden">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Itens Desse Filtro</p>
          <h4 className="text-6xl font-black text-[#001A72] tracking-tighter truncate">
            {metrics.itensProcessados.toLocaleString('pt-BR')}
          </h4>
          <p className="text-sm font-bold text-slate-500 mt-2">Registros em exibição.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#f0fdf4] p-6 rounded-3xl border border-emerald-100 flex flex-col justify-center items-center text-center">
            <p className="text-emerald-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Conformes</p>
            <p className="text-4xl font-black text-emerald-700">{metrics.conformes.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#fef2f2] p-6 rounded-3xl border border-red-100 flex flex-col justify-center items-center text-center">
            <p className="text-red-500/70 text-[10px] font-black uppercase tracking-widest mb-2">Divergente</p>
            <p className="text-4xl font-black text-red-600">{metrics.naoConformes.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-[#fff7ed] p-6 rounded-3xl border border-orange-100 flex flex-col justify-center items-center text-center col-span-2">
            <p className="text-orange-900/60 text-xs font-black uppercase tracking-widest">Pendentes (Sem Entrada)</p>
            <p className="text-3xl font-black text-[#85400d]">{metrics.itensPendentes.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-[#001A72] text-white p-8 rounded-[2rem] shadow-xl shadow-[#001A72]/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Entradas Inferiores</span>
            <span className="text-2xl font-black">{metrics.entradasInferiores}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 py-4 relative z-10">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Diverg. Quantidade</span>
            <span className="text-2xl font-black">{metrics.divergenciaQuantidade}</span>
          </div>
          <div className="flex items-center justify-between pt-4 relative z-10">
            <span className="text-xs font-bold text-[#E87722] uppercase tracking-widest">T. Médio</span>
            <span className="text-3xl font-black text-[#E87722]">
              {metrics.tempoMedio}<span className="text-lg font-bold text-[#E87722]/60">H</span>
            </span>
          </div>
        </div>
      </div>

      {/* 5. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-8 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-black text-[#001A72] tracking-tight">Eficácia (Aplicando Filtros)</h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Status percentual dos itens emparelhados</p>
          </div>
          <div className="flex-1 w-full min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  strokeWidth={0}
                  cornerRadius={10}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    borderRadius: '16px', border: 'none', padding: '16px',
                    boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)',
                    backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
                  }}
                  itemStyle={{ color: '#001A72', fontWeight: 900, fontSize: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-[#001A72]">
                {metrics.itensProcessados > 0
                  ? Math.round((metrics.conformes / metrics.itensProcessados) * 100)
                  : 0}%
              </span>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Conformidade</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-8 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-black text-[#001A72] tracking-tight">Hospitais Críticos</h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">Top 5 unidades com divergência vs recebimento</p>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fill: '#001A72', fontWeight: 800, fontSize: 13 }} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', radius: 12 } as object}
                  contentStyle={{ borderRadius: '16px', border: 'none', padding: '16px', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)' }}
                  itemStyle={{ color: '#E87722', fontWeight: 900, fontSize: '16px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                  {barData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#E87722' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Data Table */}
      <div className="flex flex-col gap-4 mt-6 md:mt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
          <h2 className="text-2xl font-black text-[#001A72] tracking-tight flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#001A72]/10 text-[#001A72] flex items-center justify-center">
              <FileText size={18} strokeWidth={3} />
            </div>
            Detalhamento dos Dados
            <span className="text-sm font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
              {filteredData.length} registros
            </span>
          </h2>
          <Button
            onClick={exportToExcel}
            className="bg-white hover:bg-slate-50 text-[#001A72] border border-slate-200 font-bold py-5 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2 text-sm group"
          >
            <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
            Exportar Excel (.xlsx)
          </Button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-b border-slate-100 hover:bg-transparent">
                  <TableHead className="font-extrabold text-slate-400 py-6 px-8 text-xs uppercase tracking-widest w-[120px]">Data</TableHead>
                  <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Origem</TableHead>
                  <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Destino</TableHead>
                  <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Documento</TableHead>
                  <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Registros (Saída → Entrada)</TableHead>
                  <TableHead className="font-extrabold text-slate-400 py-6 px-8 text-xs uppercase tracking-widest text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                      Nenhum dado se adequa aos filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((row, idx) => (
                    <TableRow key={idx} className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors">
                      <TableCell className="py-5 px-8">
                        <div className="font-bold text-slate-600 bg-slate-100/50 inline-block px-3 py-1.5 rounded-lg text-xs">
                          {new Date(row.data_transferencia || row.created_at || '').toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-[#001A72] py-5 px-4">{row.unidade_origem}</TableCell>
                      <TableCell className="font-bold text-[#001A72] py-5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#E87722] shrink-0" />
                          {row.unidade_destino}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm font-bold text-slate-400 py-5 px-4">{row.documento}</TableCell>
                      <TableCell className="py-5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-800 font-bold text-sm truncate max-w-[200px]" title={row.produto_saida}>
                            {row.produto_saida}
                          </span>
                          <span className="text-slate-400 font-semibold text-xs flex items-center gap-1 truncate max-w-[200px]" title={row.produto_entrada}>
                            ↳ {row.produto_entrada || '---'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-8 text-right">
                        <StatusBadge status={row.status_item} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                <span>Linhas por página:</span>
                <div className="flex gap-1">
                  {PAGE_SIZES.map(s => (
                    <button
                      key={s}
                      onClick={() => setPageSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pageSize === s
                          ? 'bg-[#001A72] text-white'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-[#001A72] hover:text-[#001A72]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500">
                  {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, filteredData.length)} de {filteredData.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#001A72] hover:text-[#001A72] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number
                    if (totalPages <= 5) {
                      p = i + 1
                    } else if (safePage <= 3) {
                      p = i + 1
                    } else if (safePage >= totalPages - 2) {
                      p = totalPages - 4 + i
                    } else {
                      p = safePage - 2 + i
                    }
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                          safePage === p
                            ? 'bg-[#001A72] text-white shadow-md'
                            : 'border border-slate-200 text-slate-500 hover:border-[#001A72] hover:text-[#001A72]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                    disabled={safePage >= totalPages}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:border-[#001A72] hover:text-[#001A72] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// nuqs requires useSearchParams → wrap in Suspense to satisfy static rendering
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[600px] flex flex-col items-center justify-center gap-4">
          <Loader2 size={48} className="animate-spin text-[#001A72]" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">
            Carregando Dashboard...
          </p>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  )
}
