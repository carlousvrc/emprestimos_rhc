'use client'

import React, { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UploadCloud, FileSpreadsheet, File, X, Loader2, Sparkles, History as HistoryIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const uploadFiles = async (files: File[]): Promise<string> => {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  const res = await fetch('/api/upload-historico', { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Falha ao processar.')
  return data.message || 'Arquivos processados e inseridos no Banco de Dados Cumulativo!'
}

export default function HistoricoPage() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: () => uploadFiles(files),
    onMutate: () => toast.loading('Processando arquivos via Python...', { id: 'upload' }),
    onSuccess: (message) => {
      toast.success(message, { id: 'upload', duration: 6000 })
      setFiles([])
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: 'upload', duration: 8000 })
    },
  })

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(f =>
      f.name.endsWith('.xls') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv')
    )
    if (valid.length) {
      setFiles(prev => [...prev, ...valid])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
  }

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index))

  const isUploading = uploadMutation.isPending

  return (
    <div className="flex flex-col gap-8 pb-20 font-sans w-full max-w-[1200px] mx-auto px-4 md:px-8 mt-10">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E87722]/10 text-[#E87722] text-xs font-bold tracking-widest uppercase mb-1 w-fit">
          <HistoryIcon size={14} /> Repositório de Dados
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#001A72] tracking-tight">Importação de Histórico</h1>
        <p className="text-slate-500 font-medium max-w-2xl">
          Faça o upload de planilhas antigas (múltiplos arquivos de Entrada e Saída ao mesmo tempo). O robô irá classificar,
          confrontar e concatenar os itens de forma inteligente no <strong>Banco Cumulativo</strong> sem duplicar os existentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Drop Zone + Queue */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          <div
            className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px] cursor-pointer ${
              isDragging
                ? 'border-[#E87722] bg-orange-50/50 scale-[1.02]'
                : 'border-slate-200 bg-white hover:border-[#001A72]/30 hover:bg-slate-50'
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 rounded-full bg-[#001A72]/5 text-[#001A72] flex items-center justify-center mb-6 pointer-events-none">
              <UploadCloud size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2 pointer-events-none">
              Arraste e Solte os arquivos aqui
            </h3>
            <p className="text-slate-400 font-medium text-sm text-center max-w-sm pointer-events-none mb-8">
              Selecione planilhas .xls, .xlsx ou .csv em lote (Entrada e Saída juntas).
            </p>

            <input
              type="file"
              multiple
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              onClick={e => e.stopPropagation()}
            />

            <Button
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="bg-[#001A72] hover:bg-[#00279c] text-white font-bold px-8 py-6 rounded-2xl shadow-lg pointer-events-auto"
            >
              Selecionar Arquivos Manualmente
            </Button>
          </div>

          {/* File Queue */}
          {files.length > 0 && (
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h4 className="text-lg font-black text-[#001A72] tracking-tight">Arquivos na Fila</h4>
                <span className="bg-[#001A72] text-white px-3 py-1 rounded-lg text-xs font-bold">
                  {files.length} planilhas
                </span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 w-[200px] sm:w-[350px] truncate">{file.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-end gap-3">
                {files.length < 2 && (
                  <p className="text-xs font-bold text-orange-500 text-right bg-orange-50 p-3 rounded-xl w-full">
                    ⚠️ É necessário ao menos 1 arquivo de Entrada e 1 de Saída para o robô confrontar os dados.
                  </p>
                )}
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={isUploading || files.length < 2}
                  className="bg-[#E87722] hover:bg-[#d16615] text-white font-black px-8 py-7 rounded-2xl shadow-lg shadow-[#E87722]/30 transition-all w-full sm:w-auto"
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 animate-spin" size={20} /> Processando via Python...</>
                  ) : (
                    <><Sparkles className="mr-2" size={20} /> Processar Arquivos e Consolidar</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#001A72] to-[#00279c] rounded-[2rem] p-8 text-white shadow-xl shadow-[#001A72]/20 sticky top-28">
            <h3 className="text-xl font-black mb-6">Como Funciona?</h3>

            <ul className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Identificação Semântica Automática',
                  desc: 'Não é preciso separar "Entrada" de "Saída". O robô deduz lendo o nome interno de cada planilha.',
                },
                {
                  step: '2',
                  title: 'Mapeamento (Machine Learning Py)',
                  desc: 'Confronta documentações usando Fuzzy Matching (analise_core.py) e consolida divergências.',
                },
                {
                  step: '3',
                  title: 'Deduplicação Inteligente (RLS)',
                  desc: 'Verifica linha por linha no Supabase se o documento já existe, impedindo duplicatas.',
                },
              ].map(item => (
                <li key={item.step} className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center font-black text-sm text-[#E87722]">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">{item.title}</p>
                    <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-black/20 rounded-2xl flex items-center gap-3">
              <File size={24} className="text-[#E87722] shrink-0" />
              <p className="text-[11px] font-bold text-white/80">
                O processamento preserva nomes sensíveis de Hospitais seguindo a LGPD para uso no Dashboard.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
