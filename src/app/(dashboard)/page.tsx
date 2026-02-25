'use client'

import React, { useState } from 'react'
import { UploadCloud, CheckCircle, AlertTriangle, Info } from 'lucide-react'

// Funções Helpers
const formatCurrency = (val: number | null) => {
  if (val === null || val === undefined) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

export default function DashboardPage() {
  const [fileSaida, setFileSaida] = useState<File | null>(null)
  const [fileEntrada, setFileEntrada] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<any[]>([])

  // Simulador Local para demonstração
  const handleProcess = () => {
    if (!fileSaida || !fileEntrada) {
      alert("Por favor, faça upload de ambos os arquivos básicos.")
      return
    }

    setIsProcessing(true)
    setTimeout(() => {
      setResults([
        { status: "✅ Conforme", data: "24/10/2026", origem: "Hospital Central", dest: "Clínica Leste", doc: "DOC-991", prodS: "Dipirona 500mg", prodE: "Dipirona 500mg", valS: 1200, dif: 0 },
        { status: "⚠️ Faltando na Entrada", data: "23/10/2026", origem: "Hospital Zona Sul", dest: "Hospital Oeste", doc: "DOC-882", prodS: "Luvas Cirúrgicas", prodE: "-", valS: 3500, dif: null },
        { status: "❌ Divergente", data: "24/10/2026", origem: "Hospital Norte", dest: "Hospital Central", doc: "DOC-773", prodS: "Seringa 10ml", prodE: "Seringa 10ml", valS: 800, dif: -50 }
      ])
      setIsProcessing(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-[1000px] mx-auto w-full font-sans text-slate-800">

      {/* Cabeçalho centralizado do Streamlit */}
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/logo.png" alt="Logo Hospitalar" className="h-[65px] mb-4 object-contain" />
        <h1 className="text-center text-[#001A72] text-[2.5rem] font-bold leading-tight mb-2">
          Análise de Transferências<br /><span className="text-[1.8rem] font-semibold">Via Empréstimo</span>
        </h1>
      </div>

      {/* Caixas de Upload (st.columns(2) ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">

        {/* Coluna 1: Saída */}
        <div className="flex flex-col">
          <p className="text-center text-[#001A72] font-bold mb-3">🏥 Relatório Hospitalidade (Base)</p>
          <label
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-white hover:border-orange-400 cursor-pointer transition-colors"
            htmlFor="file-saida"
          >
            <UploadCloud size={32} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 font-medium">Drag and drop file here</span>
            <span className="text-xs text-gray-400 mt-1">Limit 200MB per file • XLS, XLSX, CSV</span>

            <div className="mt-4 px-3 py-1 bg-white border border-gray-200 shadow-sm rounded text-sm text-gray-700 font-medium hover:border-gray-300">
              Browse files
            </div>

            <input
              id="file-saida"
              type="file"
              className="hidden"
              accept=".xls,.xlsx,.csv"
              onChange={e => setFileSaida(e.target.files?.[0] || null)}
            />
          </label>
          {fileSaida && (
            <div className="mt-2 text-sm text-slate-600 bg-slate-100 p-2 rounded flex justify-between">
              <span>{fileSaida.name}</span>
              <span className="text-xs text-slate-400">{(fileSaida.size / 1024).toFixed(1)}KB</span>
            </div>
          )}
        </div>

        {/* Coluna 2: Entrada */}
        <div className="flex flex-col">
          <p className="text-center text-[#001A72] font-bold mb-3">📋 Relatório Central (Contra-parte)</p>
          <label
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-white hover:border-orange-400 cursor-pointer transition-colors"
            htmlFor="file-entrada"
          >
            <UploadCloud size={32} className="text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 font-medium">Drag and drop file here</span>
            <span className="text-xs text-gray-400 mt-1">Limit 200MB per file • XLS, XLSX, CSV</span>

            <div className="mt-4 px-3 py-1 bg-white border border-gray-200 shadow-sm rounded text-sm text-gray-700 font-medium hover:border-gray-300">
              Browse files
            </div>

            <input
              id="file-entrada"
              type="file"
              className="hidden"
              accept=".xls,.xlsx,.csv"
              onChange={e => setFileEntrada(e.target.files?.[0] || null)}
            />
          </label>
          {fileEntrada && (
            <div className="mt-2 text-sm text-slate-600 bg-slate-100 p-2 rounded flex justify-between">
              <span>{fileEntrada.name}</span>
              <span className="text-xs text-slate-400">{(fileEntrada.size / 1024).toFixed(1)}KB</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Processamento Streamlit */}
      <button
        onClick={handleProcess}
        disabled={isProcessing || !fileSaida || !fileEntrada}
        className="w-full bg-[#E87722] hover:bg-[#d16615] text-white font-bold py-3 px-4 rounded transition-colors shadow disabled:opacity-50 mt-4 mb-8"
      >
        {isProcessing ? 'Processando...' : 'Analisar Transferências'}
      </button>

      {/* Resultados - Tabela Streamlit-Like */}
      {results.length > 0 && (
        <div className="mt-4">
          {/* Info Cards do Streamlit st.info */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-blue-800 text-sm flex gap-3 rounded-r">
            <Info size={18} className="mt-0.5 text-blue-500" />
            <p><strong>Resultados da Análise Cumulativa Prontos!</strong> Total de divergências e pendências mapeadas abaixo.</p>
          </div>

          <div className="border border-slate-200 rounded overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Unidade Origem</th>
                  <th className="px-4 py-3 font-semibold">Unidade Destino</th>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Produto (Saída)</th>
                  <th className="px-4 py-3 font-semibold">Produto (Entrada)</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor Saída</th>
                  <th className="px-4 py-3 font-semibold text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{r.data}</td>
                    <td className="px-4 py-3">{r.origem}</td>
                    <td className="px-4 py-3">{r.dest}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.doc}</td>
                    <td className="px-4 py-3">{r.prodS}</td>
                    <td className="px-4 py-3 text-slate-500">{r.prodE}</td>
                    <td className="px-4 py-3 font-mono text-right">{formatCurrency(r.valS)}</td>
                    <td className="px-4 py-3 font-mono text-right text-red-600">
                      {r.dif ? formatCurrency(r.dif) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
