'use client'

import { useState } from 'react'
import { CloudUpload, X, Check, AlertTriangle, FileText, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files as FileList)])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)])
    }
  }

  const processFiles = async () => {
    if (files.length === 0) return
    setLoading(true)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })

      const resData = await response.json()
      if (resData.success) {
        setResults(resData.data)
        setStats(resData.stats)
      } else {
        alert(resData.error || "Erro no processamento")
      }
    } catch (err) {
      alert("Erro ao conectar com servidor")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 font-sans text-slate-800 pb-16">

      {/* Title Header Financial App Style */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Conciliação de Transferências
        </h1>
        <p className="text-slate-500 text-sm mt-1">Ferramenta de validação ERP (Saída vs Entrada)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upload Column (Takes 2 columns space) */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <FileText size={16} className="text-orange-500" /> Nova Análise
              </h2>
            </div>

            <div className="p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center
                    transition-all duration-200 cursor-pointer
                    ${isDragging ? 'border-orange-500 bg-orange-50/50' : 'border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-slate-100/50'}
                  `}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className={`p-4 rounded-full mb-3 ${isDragging ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                  <CloudUpload size={32} strokeWidth={2} />
                </div>
                <p className="text-slate-700 font-semibold mb-1">
                  {loading ? 'Analisando os Dados...' : 'Arraste planilhas XLS/CSV para esta área'}
                </p>
                <p className="text-sm text-slate-400 font-medium mb-6">Você pode selecionar múltiplos arquivos (Saída e Entrada)</p>

                <button className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-sm">
                  Selecionar Arquivos
                </button>

                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".xls,.xlsx,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
              </div>

              {/* Selected Files List */}
              {files.length > 0 && !loading && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Fila de Processamento ({files.length})
                  </h3>

                  <div className="flex flex-col gap-2 mb-6">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg group">
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                          <span className="text-slate-400">📄</span>
                          <span className="font-semibold text-slate-700 text-sm truncate">{file.name}</span>
                          <span className="text-slate-400 text-xs ml-auto shrink-0 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, i) => i !== idx)); }}
                          className="ml-4 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <X size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={processFiles}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm rounded-lg hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Processar Dados <ChevronRight size={18} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Column (Card ERP Style) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 h-full flex flex-col text-slate-300">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500" /> Diretrizes
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              O analisador financeiro irá classificar as transferências e validar as diferenças de valores.
            </p>

            <div className="space-y-4 flex-1">
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg">
                <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Passo 1</span>
                <p className="text-sm font-medium">Faça o upload do relatório de Saída do sistema de RH base.</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-lg">
                <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Passo 2</span>
                <p className="text-sm font-medium">Faça o upload do relatório de Entrada respectivo na mesma fila.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern ERP Results Section */}
      {stats && (
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Métricas Globais</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Cards Solid Financeiros */}
            <div className="bg-white p-5 rounded-xl border-l-4 border-l-emerald-500 shadow-sm border-t border-r border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider block mb-1">Validadas</span>
              <span className="text-3xl font-bold text-slate-900">{stats.conformes}</span>
            </div>
            <div className="bg-white p-5 rounded-xl border-l-4 border-l-red-500 shadow-sm border-t border-r border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider block mb-1">Divergências</span>
              <span className="text-3xl font-bold text-slate-900">{stats.nao_conformes}</span>
            </div>
            <div className="bg-white p-5 rounded-xl border-l-4 border-l-amber-500 shadow-sm border-t border-r border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider block mb-1">Não Localizadas</span>
              <span className="text-3xl font-bold text-slate-900">{stats.nao_encontrados}</span>
            </div>
            <div className="bg-white p-5 rounded-xl border-l-4 border-l-indigo-500 shadow-sm border-t border-r border-b border-slate-200">
              <span className="text-slate-500 font-bold uppercase text-[11px] tracking-wider block mb-1">Total Analisado</span>
              <span className="text-3xl font-bold text-slate-900">{results.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced ERP Data Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-700">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Registros Analíticos</h3>
            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded text-xs font-bold">{results.length} linhas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold tracking-wide">
                <tr>
                  <th className="px-5 py-3">Situação</th>
                  <th className="px-5 py-3">Emissão</th>
                  <th className="px-5 py-3">Movimentação</th>
                  <th className="px-5 py-3 font-mono">Documento</th>
                  <th className="px-5 py-3">Item Transferido (Base)</th>
                  <th className="px-5 py-3">Item Recebido (Contra-parte)</th>
                  <th className="px-5 py-3 text-right">Montante (R$)</th>
                  <th className="px-5 py-3 text-right">Gap R$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.slice(0, 100).map((r, i) => {
                  const isSuccess = r.status.includes('✅')
                  const isWarning = r.status.includes('⚠️')

                  return (
                    <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${!isSuccess ? 'bg-red-50/20' : ''}`}>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {isSuccess ? <Check size={14} strokeWidth={3} /> : isWarning ? <span className="font-serif">?</span> : <X size={14} strokeWidth={3} />}
                          {isSuccess ? 'OK' : isWarning ? 'Falta Referência' : 'Diferença'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">{r.data}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold truncate max-w-[150px]">{r.origem}</span>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider">{r.tipo_div || 'Normal'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-500 font-medium">{r.doc}</td>
                      <td className="px-5 py-3 text-slate-700 truncate max-w-[200px]" title={r.prod_saida}>{r.prod_saida}</td>
                      <td className="px-5 py-3 text-slate-500 font-mono text-[12px] truncate max-w-[200px]" title={r.prod_entrada}>{r.prod_entrada || '---'}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700 font-bold">
                        {r.val_saida ? r.val_saida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.dif_val !== null ? (
                          <span className={`font-mono font-bold px-2 py-1 rounded ${Math.abs(r.dif_val) > 10 ? 'bg-red-100 text-red-700' : 'text-slate-400'}`}>
                            {r.dif_val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {results.length > 100 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                Limite de Preview: Mostrando top 100 de {results.length} registros processados
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
