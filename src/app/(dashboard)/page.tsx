'use client'

import { useState } from 'react'
import { UploadCloud, CheckCircle, AlertTriangle, SearchX } from 'lucide-react'

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[#001A72]">
        Análise de Transferências - Via Empréstimo
      </h1>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-[#001A72] mb-4">Analise de Documentos (Saída/Entrada)</h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center
            transition-colors duration-200 ease-in-out cursor-pointer
            ${isDragging ? 'border-[#E87722] bg-[rgba(232,119,34,0.1)]' : 'border-[#E87722] bg-[rgba(232,119,34,0.06)]'}
          `}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <UploadCloud className="w-12 h-12 text-[#E87722] mb-4" />
          <p className="text-[#E87722] font-semibold text-lg text-center">
            {loading ? 'Processando Arquivos...' : 'Arraste e solte arquivos aqui, ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-500 mt-2">Requer pelo menos um arquivo de Saída e um de Entrada (.xls, .xlsx)</p>
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

        {files.length > 0 && !loading && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Arquivos Selecionados:</h3>
            <ul className="space-y-2 mb-4">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                  <span className="truncate">{file.name}</span>
                  <button
                    onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 font-bold ml-4"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={processFiles}
              className="px-6 py-2 bg-[#E87722] text-white font-medium rounded hover:bg-[#d16615] transition-colors"
            >
              Processar Análise
            </button>
          </div>
        )}
      </div>

      {/* Results KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle size={20} />
              <span className="font-semibold">Conformes</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.conformes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle size={20} />
              <span className="font-semibold">Não Conformes</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.nao_conformes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <SearchX size={20} />
              <span className="font-semibold">Não Encontrados</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.nao_encontrados}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <span className="font-semibold">Total Processado</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{results.length}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <h2 className="text-xl font-semibold text-[#001A72] mb-4">Detalhamento da Análise</h2>
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-[#F0F2F6] text-[#001A72] border-b">
              <tr>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Origem</th>
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Produto (Saída)</th>
                <th className="px-4 py-3 font-semibold">Produto (Entrada)</th>
                <th className="px-4 py-3 font-semibold">Val Saída (R$)</th>
                <th className="px-4 py-3 font-semibold">Dif Val (R$)</th>
                <th className="px-4 py-3 font-semibold">Tipo Div</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50 border-gray-100">
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 truncate max-w-[120px]">{r.data}</td>
                  <td className="px-4 py-2 truncate max-w-[150px]">{r.origem}</td>
                  <td className="px-4 py-2">{r.doc}</td>
                  <td className="px-4 py-2 truncate max-w-[200px]" title={r.prod_saida}>{r.prod_saida}</td>
                  <td className="px-4 py-2 truncate max-w-[200px]" title={r.prod_entrada}>{r.prod_entrada}</td>
                  <td className="px-4 py-2">{r.val_saida?.toFixed(2) || '-'}</td>
                  <td className={`px-4 py-2 font-medium ${r.dif_val && Math.abs(r.dif_val) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {r.dif_val !== null ? r.dif_val?.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2 text-xs truncate max-w-[150px]">{r.tipo_div}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.length > 100 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Exibindo os primeiros 100 registros. {results.length - 100} ocultos.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
