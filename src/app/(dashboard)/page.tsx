'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, RefreshCw, Info, Activity, AlertCircle, FileText, CheckCircle2, Clock, Inbox, AlertTriangle } from 'lucide-react'

// Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// MOCK DATA
const pieData = [
  { name: 'Conforme', value: 65, color: '#00C853' },
  { name: 'Não Conforme', value: 15, color: '#FF4444' },
  { name: 'Não Recebido', value: 20, color: '#FF9800' },
]

const barData = [
  { name: 'Hosp. Central', value: 150 },
  { name: 'Hosp. Zona Sul', value: 80 },
  { name: 'Hosp. Norte', value: 65 },
  { name: 'Clinica Leste', value: 40 },
  { name: 'Hosp. Oeste', value: 15 },
]

const tableData = [
  { data: '24/02/2026', origem: 'Hospital Central', destino: 'Clínica Leste', doc: 'DOC-991', prodS: 'Dipirona 500mg', prodE: 'Dipirona 500mg' },
  { data: '23/02/2026', origem: 'Hospital Zona Sul', destino: 'Hospital Oeste', doc: 'DOC-882', prodS: 'Luvas Cirúrgicas', prodE: '-' },
  { data: '22/02/2026', origem: 'Hospital Norte', destino: 'Hospital Central', doc: 'DOC-773', prodS: 'Seringa 10ml', prodE: 'Seringa 10ml' },
  { data: '22/02/2026', origem: 'Clínica Leste', destino: 'Hospital Central', doc: 'DOC-774', prodS: 'Gaze Estéril', prodE: 'Gaze Estéril' },
  { data: '21/02/2026', origem: 'Hospital Oeste', destino: 'Hospital Zona Sul', doc: 'DOC-621', prodS: 'Soro Fisiológico', prodE: 'Soro Fisiológico (100ml)' },
]

export default function EnterpriseDashboard() {
  const [periodo, setPeriodo] = useState('Mês Atual')

  return (
    <div className="flex flex-col gap-8 pb-16 font-sans w-full max-w-[1500px] mx-auto text-[#001A72] bg-[#F0F2F6] min-h-screen p-4 md:p-8">

      {/* 1. Header (Clean & Modern) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#FFFFFF] p-6 rounded-2xl shadow-sm border border-slate-200/60 sticky top-0 z-10 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-5">
          <div className="bg-slate-50 p-2 rounded-xl shadow-inner border border-slate-100">
            <img src="/logo.png" alt="Logo Hospitalar" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#001A72] tracking-tight">Análise de Transferências</h1>
            <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase mt-0.5">Via Empréstimo Corporativo</p>
          </div>
        </div>
        <Button className="bg-[#E87722] hover:bg-[#d16615] hover:shadow-orange-500/20 text-white font-bold px-8 py-6 text-sm rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95">
          <RefreshCw size={18} />
          Atualizar Painel
        </Button>
      </div>

      {/* 2. Filters & Period Selection (Pill shaped, elegant) */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        <div className="bg-[#FFFFFF] p-2 rounded-2xl shadow-sm border border-slate-200/60 flex flex-wrap gap-2 flex-1 max-w-[fit-content]">
          {['Todo o Período', 'Mês Atual', 'Mês Anterior', 'Últimos 3 Meses'].map((p) => {
            const isSelected = periodo === p
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isSelected
                    ? 'bg-[#E87722] text-white shadow-md shadow-orange-500/20'
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-[#001A72]'
                  }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <div className="bg-blue-50/80 border border-blue-100 text-[#001A72] px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-sm grow-0">
          <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><Info size={18} strokeWidth={2.5} /></div>
          <span className="tracking-wide">Período Apurado: 01/02/2026 a 24/02/2026</span>
        </div>
      </div>

      {/* 3. Financial KPIs (Modernized Grid) */}
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-extrabold text-[#001A72] flex items-center gap-2 px-1">
          <Activity size={20} className="text-[#E87722]" />
          Balanço Financeiro do Período
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Card 1 */}
          <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#3B82F6] p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Inbox size={64} /></div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold mb-3">Total Saída</div>
            <div className="text-3xl font-black text-[#001A72] tracking-tight mb-2">R$ 987.083<span className="text-lg text-slate-400">,99</span></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              <span className="text-xs text-slate-500 font-bold">Enviado</span>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#00C853] p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Inbox size={64} className="scale-y-[-1]" /></div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold mb-3">Total Entrada</div>
            <div className="text-3xl font-black text-[#001A72] tracking-tight mb-2">R$ 693.918<span className="text-lg text-slate-400">,76</span></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C853]"></span>
              <span className="text-xs text-slate-500 font-bold">Recebido</span>
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#FF9800] p-6 hover:shadow-md transition-shadow">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold mb-3">Valores Pendentes</div>
            <div className="text-3xl font-black text-[#001A72] tracking-tight mb-3">R$ 365.690<span className="text-lg text-slate-400">,60</span></div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#FF9800] bg-orange-50 px-3 py-1.5 rounded-lg font-bold border border-orange-100">
              <Clock size={14} /> - 37.0% do total
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-[#FF4444] p-6 hover:shadow-md transition-shadow">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-extrabold mb-3">Divergência (Recebidos)</div>
            <div className="text-3xl font-black text-[#001A72] tracking-tight mb-3">R$ 85.526<span className="text-lg text-slate-400">,78</span></div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#FF4444] bg-red-50 px-3 py-1.5 rounded-lg font-bold border border-red-100">
              <AlertCircle size={14} /> ! 12.3% da entrada
            </div>
          </Card>

        </div>
      </div>

      {/* 4. Operational KPIs (Consolidated Blocks) */}
      <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-extrabold text-[#001A72] flex items-center gap-2 mb-2">
          <FileText size={20} className="text-[#E87722]" />
          Indicadores Operacionais
        </h2>

        {/* Top row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#3B82F6] flex flex-col justify-between">
            <div className="text-[11px] uppercase text-slate-500 font-bold mb-1">Total Itens Analisados</div>
            <div className="text-2xl font-black text-[#001A72]">4.521</div>
          </div>
          <div className="bg-emerald-50/30 p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#00C853] flex flex-col justify-between">
            <div className="text-[11px] uppercase text-slate-500 font-bold mb-1">Itens Conformes</div>
            <div className="text-2xl font-black text-[#00C853] flex items-center gap-2"><CheckCircle2 size={24} /> 3.850</div>
          </div>
          <div className="bg-red-50/30 p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#FF4444] flex flex-col justify-between">
            <div className="text-[11px] uppercase text-slate-500 font-bold mb-1">Não Conformes</div>
            <div className="text-2xl font-black text-[#FF4444] flex items-center gap-2"><AlertTriangle size={20} /> 412</div>
          </div>
          <div className="bg-orange-50/30 p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#FF9800] flex flex-col justify-between">
            <div className="text-[11px] uppercase text-slate-500 font-bold mb-1">Itens Pendentes</div>
            <div className="text-2xl font-black text-[#FF9800] flex items-center gap-2"><Clock size={20} /> 259</div>
          </div>
        </div>

        {/* Bottom row (Centered Grid of 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100/80">
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#FF4444] shadow-sm flex items-center justify-between">
            <div className="text-xs uppercase text-slate-600 font-bold pr-2">Entradas Inferiores a Saída</div>
            <div className="text-2xl font-black text-[#FF4444] bg-red-50 px-3 py-1 rounded-lg">185</div>
          </div>
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#FF4444] shadow-sm flex items-center justify-between">
            <div className="text-xs uppercase text-slate-600 font-bold pr-2">Divergência de Quantidade</div>
            <div className="text-2xl font-black text-[#FF4444] bg-red-50 px-3 py-1 rounded-lg">227</div>
          </div>
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-slate-100 border-l-4 border-l-[#A855F7] shadow-sm flex items-center justify-between">
            <div className="text-xs uppercase text-slate-600 font-bold pr-2">Tempo Médio Recebimento</div>
            <div className="text-2xl font-black text-[#A855F7] bg-purple-50 px-3 py-1 rounded-lg">4.2d</div>
          </div>
        </div>
      </div>

      {/* 5. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Donut Chart */}
        <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-200/60 p-6 xl:p-8 flex flex-col">
          <div className="mb-6 flex flex-col">
            <h3 className="text-lg font-extrabold text-[#001A72]">Status de Recebimento</h3>
            <p className="text-sm text-slate-400 font-medium">Distribuição percentual dos itens (Conformidade)</p>
          </div>
          <div className="h-[320px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={125}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px', boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#001A72', fontWeight: 800, fontSize: '14px' }}
                />
                <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Horizontal Bar Chart */}
        <Card className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-200/60 p-6 xl:p-8 flex flex-col">
          <div className="mb-6 flex flex-col">
            <h3 className="text-lg font-extrabold text-[#001A72]">Top 5 Hospitais com Divergências</h3>
            <p className="text-sm text-slate-400 font-medium">Unidades com maior volume de discrepância R$</p>
          </div>
          <div className="h-[320px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
              >
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} tick={{ fill: '#001A72', fontWeight: 700, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#E87722', fontWeight: 800 }}
                />
                <Bar dataKey="value" fill="#E87722" radius={[0, 6, 6, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 6. Data Table Section */}
      <div className="flex flex-col gap-4 mt-2 mb-8">

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-extrabold text-[#001A72] pl-1 flex items-center gap-2">
            <FileText size={20} className="text-[#E87722]" /> Detalhamento dos Dados
          </h2>
          <Button className="bg-[#E87722] hover:bg-[#d16615] text-white font-bold py-5 px-6 rounded-xl shadow-md transition-shadow hover:shadow-lg flex items-center gap-2 text-sm">
            <Download size={18} />
            Baixar Excel
          </Button>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200/60">
              <TableRow className="hover:bg-slate-50/80">
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Data</TableHead>
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Origem</TableHead>
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Destino</TableHead>
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Documento</TableHead>
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Saída</TableHead>
                <TableHead className="font-extrabold text-[#001A72] py-5 px-6 text-xs uppercase tracking-wider">Entrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, idx) => (
                <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-bold text-slate-500 py-4 px-6 text-xs">{row.data}</TableCell>
                  <TableCell className="font-bold text-[#001A72] py-4 px-6 text-sm">{row.origem}</TableCell>
                  <TableCell className="font-bold text-[#001A72] py-4 px-6 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E87722]"></div> {row.destino}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-400 py-4 px-6">{row.doc}</TableCell>
                  <TableCell className="text-slate-700 font-medium py-4 px-6 text-sm">{row.prodS}</TableCell>
                  <TableCell className="text-slate-500 font-medium py-4 px-6 text-sm">{row.prodE}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  )
}
