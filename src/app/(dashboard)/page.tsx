'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, RefreshCw, Info, Activity, AlertCircle, FileText, CheckCircle2, Clock, Inbox, TrendingUp, Sparkles, Filter } from 'lucide-react'

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
  { name: 'Conforme', value: 65, color: '#10B981' }, // Emerald soft
  { name: 'Não Conforme', value: 15, color: '#EF4444' }, // Red soft
  { name: 'Não Recebido', value: 20, color: '#F59E0B' }, // Amber soft
]

const barData = [
  { name: 'Central', value: 150 },
  { name: 'Zona Sul', value: 80 },
  { name: 'Norte', value: 65 },
  { name: 'Leste', value: 40 },
  { name: 'Oeste', value: 15 },
]

const tableData = [
  { data: '24/02/2026', origem: 'Hospital Central', destino: 'Clínica Leste', doc: 'DOC-991', prodS: 'Dipirona 500mg', prodE: 'Dipirona 500mg', status: 'conforme' },
  { data: '23/02/2026', origem: 'Hospital Zona Sul', destino: 'Hospital Oeste', doc: 'DOC-882', prodS: 'Luvas Cirúrgicas', prodE: '-', status: 'pendente' },
  { data: '22/02/2026', origem: 'Hospital Norte', destino: 'Hospital Central', doc: 'DOC-773', prodS: 'Seringa 10ml', prodE: 'Seringa 10ml', status: 'divergente' },
  { data: '21/02/2026', origem: 'Clínica Leste', destino: 'Hospital Norte', doc: 'DOC-512', prodS: 'Gaze Estéril', prodE: 'Gaze Estéril', status: 'conforme' },
  { data: '20/02/2026', origem: 'Hospital Oeste', destino: 'Clínica Leste', doc: 'DOC-404', prodS: 'Cateter', prodE: 'Cateter', status: 'conforme' },
]

export default function ModernDashboard() {
  const [periodo, setPeriodo] = useState('Mês Atual')

  return (
    <div className="flex flex-col gap-6 md:gap-10 pb-20 font-sans w-full max-w-[1600px] mx-auto px-4 md:px-8 mt-6">

      {/* 1. Hero Section (Gradient Banner) */}
      <div className="relative w-full rounded-[2rem] bg-gradient-to-br from-[#001A72] via-[#00279c] to-[#0039cc] p-8 md:p-10 shadow-2xl shadow-[#001A72]/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E87722] opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-widest uppercase mb-2 w-fit">
            <Sparkles size={14} className="text-[#E87722]" /> Visão Geral
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Transferências <span className="text-[#E87722]">Via Empréstimo</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base font-medium max-w-xl mt-2 leading-relaxed">
            Monitore indicadores de entrada, saída, divergências financeiras e eficácia operacional entre as unidades da rede em tempo real.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-4 w-full md:w-auto">
          <Button className="w-full md:w-auto bg-[#E87722] hover:bg-white hover:text-[#E87722] text-white font-black px-8 py-6 rounded-2xl shadow-lg shadow-[#E87722]/30 transition-all active:scale-95 flex items-center gap-2 group">
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            Sincronizar Dados
          </Button>
          <div className="flex items-center gap-2 text-white/60 text-xs font-bold bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Info size={14} /> Atualizado hoje, às 14:20
          </div>
        </div>
      </div>

      {/* 2. Controls & Period Selection (Floating Modern Pill) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 -mt-8 md:-mt-12 relative z-20 px-4">

        <div className="w-full lg:w-auto bg-white/90 backdrop-blur-xl p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-wrap gap-2">
          <div className="hidden sm:flex items-center justify-center px-4 text-slate-300">
            <Filter size={18} />
          </div>
          {['Todo o Período', 'Mês Atual', 'Mês Anterior', 'Últimos 3 Meses'].map((p) => {
            const isSelected = periodo === p
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isSelected
                    ? 'bg-[#001A72] text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:bg-slate-100/50 hover:text-[#001A72]'
                  }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        <div className="w-full lg:w-auto bg-white/90 backdrop-blur-xl px-6 py-3.5 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-[#E87722] animate-pulse"></div>
          <span className="text-sm font-bold text-[#001A72]">01/02 a 24/02/2026</span>
        </div>
      </div>

      {/* 3. Financial KPIs (Modern Glass Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Total Saída */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Enviado</p>
            <h3 className="text-3xl lg:text-4xl font-black text-[#001A72] tracking-tight">R$ 987k</h3>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-50">
            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-lg">R$ 987.083,99 exatos</span>
          </div>
        </div>

        {/* Card 2: Entrada */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Inbox size={24} strokeWidth={2.5} className="scale-y-[-1]" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total Recebido</p>
            <h3 className="text-3xl lg:text-4xl font-black text-[#001A72] tracking-tight">R$ 693k</h3>
          </div>
          <div className="mt-auto pt-4 border-t border-slate-50">
            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-lg">R$ 693.918,76 exatos</span>
          </div>
        </div>

        {/* Card 3: Pendentes */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/30 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-orange-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-12 h-12 rounded-2xl bg-[#E87722] text-white flex items-center justify-center mb-2 relative z-10 shadow-lg shadow-orange-500/20">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <div className="relative z-10">
            <p className="text-orange-900/60 text-xs font-black uppercase tracking-widest mb-1">Valores Pendentes</p>
            <h3 className="text-3xl lg:text-4xl font-black text-[#85400d] tracking-tight">R$ 365k</h3>
          </div>
          <div className="mt-auto pt-4 border-t border-orange-200/50 relative z-10">
            <span className="text-xs text-[#E87722] font-black tracking-wide">— 37.0% do Total</span>
          </div>
        </div>

        {/* Card 4: Divergência */}
        <div className="bg-gradient-to-br from-red-50 to-red-100/30 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-red-100 hover:-translate-y-1 transition-transform duration-300 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center mb-2 relative z-10 shadow-lg shadow-red-500/20">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="relative z-10">
            <p className="text-red-900/60 text-xs font-black uppercase tracking-widest mb-1">Divergências</p>
            <h3 className="text-3xl lg:text-4xl font-black text-red-950 tracking-tight">R$ 85k</h3>
          </div>
          <div className="mt-auto pt-4 border-t border-red-200/50 relative z-10">
            <span className="text-xs text-red-600 font-black tracking-wide">! 12.3% da Entrada</span>
          </div>
        </div>

      </div>

      {/* 4. Operational KPIs (Bento Grid Style) */}
      <h2 className="text-2xl font-black text-[#001A72] tracking-tight mt-6 md:mt-10 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#E87722]/10 text-[#E87722] flex items-center justify-center">
          <Activity size={18} strokeWidth={3} />
        </div>
        Desempenho Operacional
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6">

        {/* Bento Block 1 (Large) */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 text-slate-50 translate-x-8 translate-y-8 group-hover:scale-110 transition-transform duration-700">
            <FileText size={180} />
          </div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 relative z-10">Volume Processado</p>
          <h4 className="text-6xl font-black text-[#001A72] tracking-tighter relative z-10">4.521</h4>
          <p className="text-sm font-bold text-slate-500 mt-2 relative z-10">Total de itens analisados no período.</p>
        </div>

        {/* Bento Block 2 (Status grid) */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-[#f0fdf4] p-6 rounded-3xl border border-emerald-100 flex flex-col justify-center items-center text-center">
            <p className="text-emerald-600/70 text-[10px] font-black uppercase tracking-widest mb-2">Conformes</p>
            <p className="text-4xl font-black text-emerald-700">3.850</p>
          </div>
          <div className="bg-[#fef2f2] p-6 rounded-3xl border border-red-100 flex flex-col justify-center items-center text-center">
            <p className="text-red-500/70 text-[10px] font-black uppercase tracking-widest mb-2">Não Conf.</p>
            <p className="text-4xl font-black text-red-600">412</p>
          </div>
          <div className="bg-[#fff7ed] p-6 rounded-3xl border border-orange-100 flex flex-col justify-center items-center text-center col-span-2 shadow-inner">
            <div className="flex items-center gap-4">
              <span className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Clock size={24} /></span>
              <div className="text-left">
                <p className="text-orange-900/60 text-xs font-black uppercase tracking-widest">Itens Pendentes</p>
                <p className="text-3xl font-black text-[#85400d]">259</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Block 3 (Secondary Metrics) */}
        <div className="xl:col-span-2 bg-[#001A72] text-white p-8 rounded-[2rem] shadow-xl shadow-[#001A72]/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Entradas Inferiores</span>
            <span className="text-2xl font-black">185</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 py-4 relative z-10">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Diverg. Quantidade</span>
            <span className="text-2xl font-black">227</span>
          </div>
          <div className="flex items-center justify-between pt-4 relative z-10">
            <span className="text-xs font-bold text-[#E87722] uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> T. Médio Receb.</span>
            <span className="text-3xl font-black text-[#E87722]">4.2<span className="text-lg font-bold text-[#E87722]/60">d</span></span>
          </div>
        </div>
      </div>

      {/* 5. Charts Section (Beautiful Padded Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">

        {/* Left: Donut Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-8 flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-black text-[#001A72] tracking-tight">Eficácia do Recebimento</h3>
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
                  contentStyle={{ borderRadius: '16px', border: 'none', padding: '16px', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#001A72', fontWeight: 900, fontSize: '15px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-[#001A72]">65%</span>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Conformes</span>
            </div>
          </div>

          {/* Custom Elegant Legend */}
          <div className="flex justify-center gap-6 mt-6">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-xs font-bold text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Horizontal Bar Chart */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 p-8 flex flex-col">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-black text-[#001A72] tracking-tight">Hospitais Críticos</h3>
              <p className="text-sm font-semibold text-slate-400 mt-1">Top 5 unidades com divergência vs recebimento</p>
            </div>
            <div className="hidden sm:flex bg-[#E87722]/10 text-[#E87722] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest items-center gap-1">
              <Filter size={14} /> Top 5
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 10, bottom: 0 }}
              >
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fill: '#001A72', fontWeight: 800, fontSize: 13 }} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9', radius: 12 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', padding: '16px', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)' }}
                  itemStyle={{ color: '#E87722', fontWeight: 900, fontSize: '16px' }}
                />
                <Bar dataKey="value" fill="#E87722" radius={[0, 8, 8, 0]} barSize={28}>
                  {
                    barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#E87722' : '#fdba74'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. Data Table Section */}
      <h2 className="text-2xl font-black text-[#001A72] tracking-tight mt-6 md:mt-10 px-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#001A72]/10 text-[#001A72] flex items-center justify-center">
            <FileText size={18} strokeWidth={3} />
          </div>
          Detalhamento Clínico
        </div>
        <Button className="bg-white hover:bg-slate-50 text-[#001A72] border border-slate-200 font-bold py-5 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2 text-sm">
          <Download size={18} />
          Exportar Planilha
        </Button>
      </h2>

      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b-none border-b border-slate-100 hover:bg-transparent">
                <TableHead className="font-extrabold text-slate-400 py-6 px-8 text-xs uppercase tracking-widest w-[120px]">Data</TableHead>
                <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Origem</TableHead>
                <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Destino</TableHead>
                <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Documento</TableHead>
                <TableHead className="font-extrabold text-slate-400 py-6 px-4 text-xs uppercase tracking-widest">Registros (Saída → Entrada)</TableHead>
                <TableHead className="font-extrabold text-slate-400 py-6 px-8 text-xs uppercase tracking-widest text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, idx) => (
                <TableRow key={idx} className="border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors group">
                  <TableCell className="py-5 px-8">
                    <div className="font-bold text-slate-600 bg-slate-100/50 inline-block px-3 py-1.5 rounded-lg text-xs">{row.data}</div>
                  </TableCell>
                  <TableCell className="font-bold text-[#001A72] py-5 px-4">{row.origem}</TableCell>
                  <TableCell className="font-bold text-[#001A72] py-5 px-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E87722]"></div> {row.destino}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-bold text-slate-400 py-5 px-4">{row.doc}</TableCell>
                  <TableCell className="py-5 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-800 font-bold text-sm">{row.prodS}</span>
                      <span className="text-slate-400 font-semibold text-xs flex items-center gap-1">↳ {row.prodE}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-8 text-right">
                    {row.status === 'conforme' && <span className="inline-flex text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Conforme</span>}
                    {row.status === 'pendente' && <span className="inline-flex text-orange-700 bg-orange-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Pendente</span>}
                    {row.status === 'divergente' && <span className="inline-flex text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">Divergente</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  )
}
