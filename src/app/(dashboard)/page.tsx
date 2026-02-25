'use client'

import { useState } from 'react'
import { CloudUpload, X, CheckCircle2, AlertCircle, PlayCircle, Info } from 'lucide-react'

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
    <div className="space-y-10 font-sans text-slate-800 pb-16">

      {/* Title Header Premium */}
      <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#001D6D] tracking-tight mb-2">
            Análise e Conciliação
          </h1>
          <p className="text-slate-500 font-medium">Faça o upload dos documentos e valide a conformidade automaticamente.</p>
        </div>
        <div className="hidden lg:block">
          <div className="h-16 w-16 bg-[#F0F2F6] rounded-full flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">

        {/* Upload Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#001D6D]/10 text-[#001D6D] p-2 rounded-xl">
              <CloudUpload size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Envio de Planilhas
            </h2>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative overflow-hidden border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center
              transition-all duration-300 ease-in-out cursor-pointer group shadow-sm
              ${isDragging ? 'border-[#F37021] bg-[#F37021]/5 scale-[0.99]' : 'border-slate-300 bg-white hover:border-[#F37021]/70 hover:shadow-md'}
            `}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {/* Modern Gradient Blob Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-[#F37021]/10 to-[#001D6D]/5 rounded-full blur-3xl transition-opacity duration-500 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>

            <div className={`relative z-10 p-5 rounded-2xl mb-4 transition-all duration-300 ${isDragging ? 'bg-[#F37021] text-white shadow-lg shadow-[#F37021]/30 rotate-6' : 'bg-slate-100 text-slate-500 group-hover:text-[#F37021] group-hover:bg-[#F37021]/10'}`}>
              <CloudUpload size={40} strokeWidth={2} />
            </div>

            <p className="text-slate-800 text-xl font-bold text-center mb-2 transition-colors relative z-10">
              {loading ? 'Analisando os Dados...' : 'Arraste os arquivos para cá'}
            </p>
            <p className="text-sm font-medium text-slate-500 mb-6 relative z-10">ou clique para procurar no computador</p>

            <button className="relative z-10 px-8 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:border-slate-300 hover:shadow-sm transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              Procurar Arquivos
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

          {/* Files Selected Miniatures */}
          {files.length > 0 && !loading && (
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Arquivos Selecionados ({files.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {files.map((file, idx) => (
                  <div key={idx} className="flex flex-col bg-slate-50 border border-slate-100 p-4 rounded-2xl relative group hover:border-slate-300 transition-colors">
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 p-1.5 rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100"
                      title="Remover arquivo"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                    <span className="font-bold text-slate-700 text-sm truncate pr-8">{file.name}</span>
                    <span className="text-slate-500 text-xs mt-1 font-medium">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>

              <button
                onClick={processFiles}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#001D6D] text-white font-bold text-[16px] rounded-2xl hover:bg-[#001D6D]/90 hover:shadow-xl hover:shadow-[#001D6D]/20 active:scale-[0.98] transition-all duration-300"
              >
                <PlayCircle size={22} />
                <span>Iniciar Processamento Inteligente</span>
              </button>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-8 shadow-sm h-full">
            <div className="bg-blue-100 text-blue-700 p-3 rounded-2xl inline-block mb-6">
              <Info size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Como funciona?</h3>
            <p className="text-blue-800/80 text-sm leading-relaxed mb-6 font-medium">
              O sistema utiliza um motor avançado para comparar planilhas de <b>Saída</b> e <b>Entrada</b> de estoques.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-blue-800/80 font-medium items-start">
                <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <span>Nomenclaturas são padronizadas via NLP.</span>
              </li>
              <li className="flex gap-3 text-sm text-blue-800/80 font-medium items-start">
                <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <span>Diferenças de valor acima de 10% são alertadas.</span>
              </li>
              <li className="flex gap-3 text-sm text-blue-800/80 font-medium items-start">
                <CheckCircle2 size={18} className="text-blue-600 mt-0.5 shrink-0" />
                <span>Lotes múltiplos são agregados automaticamente.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modern Results Section */}
      {stats && (
        <div className="pt-8 border-t border-slate-200 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
              <CheckCircle2 size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Resultado da Análise
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl"></div>
              <span className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2 z-10">Conformes</span>
              <span className="text-4xl font-black text-emerald-600 z-10">{stats.conformes}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full blur-2xl"></div>
              <span className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2 z-10">Não Conformes</span>
              <span className="text-4xl font-black text-red-600 z-10">{stats.nao_conformes}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl"></div>
              <span className="text-slate-500 font-bold uppercase text-xs tracking-wider mb-2 z-10">Não Encontrados</span>
              <span className="text-4xl font-black text-amber-500 z-10">{stats.nao_encontrados}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#001D6D] to-[#002b9e]">
              <span className="text-blue-200 font-bold uppercase text-xs tracking-wider mb-2 z-10">Total Validado</span>
              <span className="text-4xl font-black text-white z-10">{results.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modern Data Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden animate-in fade-in duration-1000">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">Detalhamento Completo</h3>
            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{results.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-5 py-4 min-w-[140px]">Status</th>
                  <th className="px-5 py-4">Data</th>
                  <th className="px-5 py-4">Origem / Destino</th>
                  <th className="px-5 py-4">Lote / Doc</th>
                  <th className="px-5 py-4 min-w-[250px]">Produto Referência (Saída)</th>
                  <th className="px-5 py-4 min-w-[250px]">Produto Validado (Entrada)</th>
                  <th className="px-5 py-4 text-right">Val Saída (R$)</th>
                  <th className="px-5 py-4 text-right">Divergência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.slice(0, 100).map((r, i) => {
                  const isSuccess = r.status.includes('✅')
                  const isWarning = r.status.includes('⚠️')

                  return (
                    <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${isSuccess ? 'bg-emerald-100 text-emerald-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {isSuccess ? <CheckCircle2 size={14} /> : isWarning ? <AlertCircle size={14} /> : <X size={14} />}
                          {isSuccess ? 'Conforme' : isWarning ? 'Não Encontrado' : 'Divergente'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium whitespace-nowrap">{r.data}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-bold truncate max-w-[150px]">{r.origem}</span>
                          <span className="text-xs text-slate-500 truncate max-w-[150px]">{r.tipo_div || 'Normal'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-600 text-[13px]">{r.doc}</td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{r.prod_saida}</td>
                      <td className="px-5 py-4 text-slate-500 text-sm truncate max-w-[250px]">{r.prod_entrada || '-'}</td>
                      <td className="px-5 py-4 text-right font-mono text-slate-600 font-medium">
                        {r.val_saida ? r.val_saida.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {r.dif_val !== null ? (
                          <span className={`font-mono font-bold px-2 py-1 rounded-md ${Math.abs(r.dif_val) > 10 ? 'bg-red-50 text-red-600' : 'text-emerald-600'}`}>
                            {r.dif_val > 0 ? '+' : ''}{r.dif_val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-sm text-slate-500 font-medium">
                Visualizando 100 resultados. Filtros e paginação completas estarão habilitados em breve.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
