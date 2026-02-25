'use client'

import React, { useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw, Calendar as CalendarIcon, Filter } from 'lucide-react'

// Shadcn UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

// --- MOCK DATA ---
const pieData = [
  { name: 'Conforme', value: 75, color: '#00C853' },
  { name: 'Não Conforme', value: 10, color: '#FF4444' },
  { name: 'Não Recebido', value: 15, color: '#FF9800' },
]

const barData = [
  { name: 'Hosp. Central', value: 150 },
  { name: 'Hosp. Zona Sul', value: 80 },
  { name: 'Hosp. Norte', value: 65 },
  { name: 'Clinica Leste', value: 40 },
  { name: 'Hosp. Oeste', value: 15 },
]

const tableData = [
  {
    date: '24/10/2026',
    origem: 'Hospital Central',
    destino: 'Clínica Leste',
    produto: 'Dipirona 500mg',
    valor: 'R$ 1.200,00',
    diferenca: 0,
    status: 'Conforme',
  },
  {
    date: '24/10/2026',
    origem: 'Hospital Norte',
    destino: 'Hospital Central',
    produto: 'Seringa 10ml',
    valor: 'R$ 800,00',
    diferenca: -50,
    status: 'Não Conforme',
  },
  {
    date: '23/10/2026',
    origem: 'Hospital Zona Sul',
    destino: 'Hospital Oeste',
    produto: 'Luvas Cirúrgicas',
    valor: 'R$ 3.500,00',
    diferenca: 0,
    status: 'Não Recebido',
  },
  {
    date: '23/10/2026',
    origem: 'Hospital Central',
    destino: 'Hospital Zona Sul',
    produto: 'Omeprazol 20mg',
    valor: 'R$ 450,00',
    diferenca: 0,
    status: 'Conforme',
  },
]

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col gap-8 pb-10 min-h-screen bg-[#F0F2F6]">

      {/* 1. Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#001A72' }}>
          Análise de Transferências - Via Empréstimo
        </h1>
        <Button
          style={{ backgroundColor: '#E87722', color: '#FFFFFF' }}
          className="hover:opacity-90 transition-opacity flex items-center gap-2 px-6 py-5 rounded-md shadow-md font-semibold"
        >
          <RefreshCw size={18} />
          Atualizar Dados
        </Button>
      </div>

      {/* 2. Filters Section (Accordion) */}
      <Card className="bg-[#FFFFFF] border-none shadow-sm rounded-xl">
        <CardContent className="p-1">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline text-[#001A72] font-semibold text-base flex justify-start gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={18} />
                  <span>Filtros de Análise Reflexiva</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#001A72]">Status</label>
                    <Select>
                      <SelectTrigger className="w-full border-slate-200">
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="conforme">Conforme</SelectItem>
                        <SelectItem value="nao_conforme">Não Conforme</SelectItem>
                        <SelectItem value="pendente">Pendente / Não Recebido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Origem/Destino Dropdown */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#001A72]">Unidade</label>
                    <Select>
                      <SelectTrigger className="w-full border-slate-200">
                        <SelectValue placeholder="Todas as Unidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Unidades</SelectItem>
                        <SelectItem value="central">Hospital Central</SelectItem>
                        <SelectItem value="sul">Hospital Zona Sul</SelectItem>
                        <SelectItem value="norte">Hospital Norte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Picker (Mocked with single Calendar for aesthetics) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#001A72]">Período</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-slate-200 text-slate-600"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-slate-200 shadow-lg">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* 3. KPI Cards Section (Grid 4 col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-[#001A72]">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-[#001A72] uppercase tracking-wide">
              Total Saída
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#001A72' }}>R$ 15.000,00</div>
            <p className="text-sm font-medium text-slate-500 mt-1">Enviado</p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-[#00C853]">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-[#001A72] uppercase tracking-wide">
              Total Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#001A72' }}>R$ 14.200,00</div>
            <p className="text-sm font-medium text-slate-500 mt-1">Recebido</p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-[#FF9800]">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-[#001A72] uppercase tracking-wide">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#001A72' }}>R$ 800,00</div>
            <p className="text-sm font-bold mt-1" style={{ color: '#FF9800' }}>
              - 5.3% do total
            </p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-0 border-l-4 border-[#FF4444]">
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-sm font-bold text-[#001A72] uppercase tracking-wide">
              Divergência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: '#001A72' }}>R$ 350,00</div>
            <p className="text-sm font-bold mt-1" style={{ color: '#FF4444' }}>
              ! 2.4% da entrada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Charts Section (Grid 2 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Donut Chart */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-slate-100 p-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold" style={{ color: '#001A72' }}>Status de Recebimento</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#001A72', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Right: Horizontal Bar Chart */}
        <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-slate-100 p-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold" style={{ color: '#001A72' }}>Top 5 Hospitais com Divergências</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} style={{ fill: '#001A72', fontWeight: 500, fontSize: 13 }} />
                <Tooltip
                  cursor={{ fill: '#F0F2F6' }}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="value" fill="#E87722" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 5. Data Table Section */}
      <Card className="bg-[#FFFFFF] rounded-xl shadow-sm border-slate-100 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold" style={{ color: '#001A72' }}>Relatório Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="hover:bg-slate-50 border-slate-200">
                <TableHead className="font-bold text-[#001A72] py-4">Data</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Unidade Origem</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Unidade Destino</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4">Produto</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4 text-right">Valor Saída</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4 text-right">Diferença Qtd</TableHead>
                <TableHead className="font-bold text-[#001A72] py-4 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, idx) => (
                <TableRow key={idx} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-600 border-r border-slate-50">{row.date}</TableCell>
                  <TableCell className="font-semibold text-[#001A72]">{row.origem}</TableCell>
                  <TableCell className="font-semibold text-[#001A72]">{row.destino}</TableCell>
                  <TableCell className="text-slate-700">{row.produto}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-slate-600">{row.valor}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    <span className={row.diferenca < 0 ? 'text-[#FF4444]' : 'text-slate-500'}>
                      {row.diferenca}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`font-bold px-3 py-1 shadow-none transition-none shadow-sm ${row.status === 'Conforme'
                        ? 'bg-[#00C853] hover:bg-[#00C853]/90 text-white'
                        : row.status === 'Não Conforme'
                          ? 'bg-[#FF4444] hover:bg-[#FF4444]/90 text-white'
                          : 'bg-[#FF9800] hover:bg-[#FF9800]/90 text-white'
                        }`}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}
