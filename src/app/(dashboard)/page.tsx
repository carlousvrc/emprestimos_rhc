'use client'

import { useState } from 'react'

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
    <div className="space-y-10 font-sans text-[#31333F]">

      {/* Title */}
      <div>
        <h1 className="text-[2.2rem] font-bold text-[#002D62] pb-2 tracking-tight">
          Análise de Transferências - Via Empréstimo
        </h1>
      </div>

      {/* Upload Section - Native Streamlit Uploader Styling */}
      <div className="space-y-4">
        <h2 className="text-[1.35rem] font-semibold text-[#31333F]">
          Analise de Documentos (Saída/Entrada)
        </h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center
            transition-all duration-200 ease-in-out cursor-pointer group
            ${isDragging ? 'border-[#F37021] bg-orange-50/30' : 'border-[#D3D4D6] bg-[#F9F9F9] hover:border-[#F37021]'}
          `}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {/* Default Upload Icon */}
          <div className="w-12 h-12 mb-3 text-gray-400 group-hover:text-[#F37021] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[#31333F] text-[15px] text-center mb-1 group-hover:text-[#F37021] transition-colors">
            {loading ? 'Processando Arquivos...' : 'Drag and drop file here'}
          </p>
          <p className="text-[14px] text-gray-500 mb-4">Limit 200MB per file • XLS, XLSX, CSV</p>

          <button className="px-4 py-1.5 bg-white border border-[#caced1] text-[#31333F] text-sm rounded hover:border-[#F37021] hover:text-[#F37021] transition-colors">
            Browse files
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

        {/* Selected Files List in Streamlit style (small tags) */}
        {files.length > 0 && !loading && (
          <div className="mt-4 px-1">
            <div className="flex flex-col gap-2 mb-6">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm text-[#31333F] bg-white border border-[#D3D4D6] px-4 py-2.5 rounded shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-gray-400">📄</span>
                    <span className="truncate">{file.name}</span>
                    <span className="text-gray-400 text-xs ml-2">{(file.size / 1024).toFixed(1)}KB</span>
                  </div>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-red-500 font-bold ml-4"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Primary Action Button Streamlit */}
            <button
              onClick={processFiles}
              className="px-6 py-2.5 bg-[#F37021] text-white font-medium text-[15px] rounded hover:bg-[#d15e19] transition-colors shadow-sm"
            >
              Processar Análise
            </button>
          </div>
        )}
      </div>

      {/* Results Native Metrics streamit style */}
      {stats && (
        <div className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-[#31333F] text-sm mb-1">Conformes</span>
              <span className="text-3xl font-normal text-[#31333F]">{stats.conformes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#31333F] text-sm mb-1">Não Conformes</span>
              <span className="text-3xl font-normal text-[#31333F]">{stats.nao_conformes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#31333F] text-sm mb-1">Não Encontrados</span>
              <span className="text-3xl font-normal text-[#31333F]">{stats.nao_encontrados}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#31333F] text-sm mb-1">Total Processado</span>
              <span className="text-3xl font-normal text-[#31333F]">{results.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Table (Dataframe native look) */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-[1.35rem] font-semibold text-[#31333F]">Detalhamento da Análise</h2>
          <div className="border border-[#e6eaf1] rounded overflow-x-auto bg-white">
            <table className="w-full text-left text-[14px] text-[#31333F] whitespace-nowrap">
              <thead className="bg-[#f8f9fa] border-b border-[#e6eaf1]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Origem</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Documento</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Produto (Saída)</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Produto (Entrada)</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider text-right">Val Saída</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider text-right">Dif Val</th>
                  <th className="px-3 py-2.5 font-semibold font-mono text-xs text-gray-500 uppercase tracking-wider">Tipo Div</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((r, i) => (
                  <tr key={i} className={`border-b border-[#f0f2f6] ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfa]'} hover:bg-[#f0f2f6]`}>
                    <td className="px-3 py-2">
                      {r.status.includes('✅') ? '✅ Conforme' : r.status.includes('⚠️') ? '⚠️ Não Rec.' : '❌ Não Conf.'}
                    </td>
                    <td className="px-3 py-2 truncate max-w-[100px]">{r.data}</td>
                    <td className="px-3 py-2 truncate max-w-[130px]">{r.origem}</td>
                    <td className="px-3 py-2">{r.doc}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]" title={r.prod_saida}>{r.prod_saida}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]" title={r.prod_entrada}>{r.prod_entrada}</td>
                    <td className="px-3 py-2 text-right">{r.val_saida?.toFixed(2) || '-'}</td>
                    <td className={`px-3 py-2 text-right ${r.dif_val && Math.abs(r.dif_val) > 10 ? 'text-red-500' : 'text-[#31333F]'}`}>
                      {r.dif_val !== null ? r.dif_val?.toFixed(2) : '-'}
                    </td>
                    <td className="px-3 py-2 truncate max-w-[150px] text-gray-500">{r.tipo_div}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length > 100 && (
            <div className="text-sm text-gray-500">
              Exibindo os primeiros 100 registros. Todos os {results.length} foram processados.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
