'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, RefreshCw, Info } from 'lucide-react'

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
]

export default function EnterpriseDashboard() {
  const [periodo, setPeriodo] = useState('Mes Atual')

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans w-full max-w-[1400px] mx-auto text-[#001A72] bg-[#F0F2F6] min-h-screen p-6 md:p-10">

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFFFF] p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo Hospitalar" className="h-12 object-contain" />
          <div>
            <h1 className="text-3xl font-bold text-[#001A72]">Análise de Transferências - Via Empréstimo</h1>
          </div>
        </div>
        <Button className="bg-[#E87722] hover:bg-[#d16615] text-white font-bold px-6 py-6 text-base rounded-md shadow-md transition-colors flex items-center gap-2">
          <RefreshCw size={20} />
          Atualizar
        </Button>
      </div>

      {/* 2. Filters & Period Selection */}
      <div className="flex flex-col gap-4">
        <div className="bg-[#FFFFFF] p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4">
          {['Todo o Período', 'Mês Atual', 'Mês Anterior', 'Últimos 3 Meses'].map((p) => {
            const isSelected = periodo === p
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${isSelected
                    ? 'bg-[#E87722] text-white border-[#E87722]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#E87722] hover:text-[#E87722]'
                  }`}
              >
                {p}
              </button>
            )
          })}
        </div>
        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
          <Info size={18} className="text-blue-500" />
          <span>📅 Período Apurado: 01/02/2026 até 24/02/2026</span>
        </div>
      </div>

      {/* 3. Financial KPIs */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-[#001A72] pl-1">Balanço Financeiro do Período</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#3B82F6] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Total Saída</div>
            <div className="text-3xl font-extrabold text-[#001A72] mb-1">R$ 987.083,99</div>
            <div className="text-xs text-gray-500 font-medium">Enviado</div>
          </Card>

          {/* Card 2 */}
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#00C853] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Total Entrada</div>
            <div className="text-3xl font-extrabold text-[#001A72] mb-1">R$ 693.918,76</div>
            <div className="text-xs text-gray-500 font-medium">Recebido</div>
          </Card>

          {/* Card 3 */}
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF9800] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Pendentes</div>
            <div className="text-3xl font-extrabold text-[#001A72] mb-1">R$ 365.690,60</div>
            <div className="text-xs text-[#FF9800] bg-orange-50 px-2 py-1 inline-block rounded font-bold mt-1">- 37.0% do total</div>
          </Card>

          {/* Card 4 */}
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF4444] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Divergência Itens Recebidos</div>
            <div className="text-3xl font-extrabold text-[#001A72] mb-1">R$ 85.526,78</div>
            <div className="text-xs text-[#FF4444] bg-red-50 px-2 py-1 inline-block rounded font-bold mt-1">! 12.3% da entrada</div>
          </Card>
        </div>
      </div>

      {/* 4. Operational KPIs */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-xl font-bold text-[#001A72] pl-1">Indicadores Operacionais</h2>

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#3B82F6] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Total Itens</div>
            <div className="text-3xl font-extrabold text-[#001A72]">4.521</div>
          </Card>
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#00C853] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Conformes</div>
            <div className="text-3xl font-extrabold text-[#001A72]">3.850</div>
          </Card>
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF4444] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Não Conformes</div>
            <div className="text-3xl font-extrabold text-[#001A72]">412</div>
          </Card>
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF9800] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Itens Pendentes</div>
            <div className="text-3xl font-extrabold text-[#001A72]">259</div>
          </Card>
        </div>

        {/* Bottom row (Centered Grid of 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:w-3/4 mx-auto">
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF4444] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Entradas Inferiores a Saída</div>
            <div className="text-3xl font-extrabold text-[#001A72]">185</div>
          </Card>
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#FF4444] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Divergência de Quantidade</div>
            <div className="text-3xl font-extrabold text-[#001A72]">227</div>
          </Card>
          <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-l-[#A855F7] p-5">
            <div className="text-xs uppercase text-gray-500 font-bold mb-1">Tempo Médio Recebimento</div>
            <div className="text-3xl font-extrabold text-[#001A72]">4.2 dias</div>
          </Card>
        </div>
      </div>

      {/* 5. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Left: Donut Chart */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#001A72] mb-4">Status de Recebimento</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#001A72' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Horizontal Bar Chart */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#001A72] mb-4">Top 5 Hospitais com Divergências</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} tick={{ fill: '#001A72', fontWeight: 600, fontSize: 13 }} />
                <Tooltip
                  cursor={{ fill: '#F0F2F6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 600, color: '#001A72' }}
                />
                <Bar dataKey="value" fill="#E87722" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 6. Data Table Section */}
      <div className="flex flex-col gap-4 mt-4 mb-8">
        <h2 className="text-xl font-bold text-[#001A72] pl-1">Detalhamento dos Dados</h2>
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F0F2F6] border-b border-slate-200">
              <TableRow className="hover:bg-[#F0F2F6]">
                <TableHead className="font-bold text-[#001A72] py-4">Data</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Unidade Origem</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Unidade Destino</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Documento</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Produto (Saída)</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Produto (Entrada)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, idx) => (
                <TableRow key={idx} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-600 border-r border-slate-50">{row.data}</TableCell>
                  <TableCell className="font-semibold text-[#001A72]">{row.origem}</TableCell>
                  <TableCell className="font-semibold text-[#001A72]">{row.destino}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{row.doc}</TableCell>
                  <TableCell className="text-slate-700">{row.prodS}</TableCell>
                  <TableCell className="text-slate-500 font-medium">{row.prodE}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Download Button right aligned */}
        <div className="mt-2 text-right">
          <Button className="bg-[#E87722] hover:bg-[#d16615] text-white font-bold py-6 px-6 rounded-md shadow-md transition-colors inline-flex items-center gap-2">
            <Download size={20} />
            Baixar Dados Filtrados (Excel)
          </Button>
        </div>
      </div>

    </div>
  )
}
