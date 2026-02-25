'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, File, X, Loader2, Sparkles, History as HistoryIcon, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function HistoricoPage() {
    const [files, setFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState<{ success?: boolean, message?: string } | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xls') || f.name.endsWith('.xlsx') || f.name.endsWith('.csv'))

        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles])
            setUploadResult(null)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files)
            setFiles(prev => [...prev, ...selectedFiles])
            setUploadResult(null)
        }
    }

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setIsUploading(true)
        setUploadResult(null)

        const formData = new FormData()
        files.forEach((file) => {
            formData.append('files', file)
        })

        try {
            const res = await fetch('/api/upload-historico', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()

            if (res.ok) {
                setUploadResult({ success: true, message: data.message || 'Arquivos processados e inseridos no Banco de Dados Cumulativo!' })
                setFiles([]) // Limpa após sucesso
            } else {
                setUploadResult({ success: false, message: data.error || 'Falha ao processar.' })
            }
        } catch (error) {
            console.error(error)
            setUploadResult({ success: false, message: 'Erro de comunicação com o servidor. A API pode não estar compilada.' })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="flex flex-col gap-8 pb-20 font-sans w-full max-w-[1200px] mx-auto px-4 md:px-8 mt-10">

            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E87722]/10 text-[#E87722] text-xs font-bold tracking-widest uppercase mb-1 w-fit">
                    <HistoryIcon size={14} /> Repositório de Dados
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-[#001A72] tracking-tight">Importação de Histórico</h1>
                <p className="text-slate-500 font-medium max-w-2xl">
                    Faça o upload de planilhas antigas (Múltiplos arquivos de Entrada e Saída ao mesmo tempo). O robô irá classificar, confrontar e concatenar os itens de forma inteligente no <strong>Banco Cumulativo</strong> sem duplicar os existentes.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Coluna Dropzone */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div
                        className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all duration-300 min-h-[300px] ${isDragging
                                ? 'border-[#E87722] bg-orange-50/50 scale-[1.02]'
                                : 'border-slate-200 bg-white hover:border-[#001A72]/30 hover:bg-slate-50'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="w-20 h-20 rounded-full bg-[#001A72]/5 text-[#001A72] flex items-center justify-center mb-6 pointer-events-none">
                            <UploadCloud size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-slate-700 mb-2 pointer-events-none">Arraste e Solte os arquivos aqui</h3>
                        <p className="text-slate-400 font-medium text-sm text-center max-w-sm pointer-events-none mb-8">
                            Selecione planilhas nos formatos .xls, .xlsx ou .csv em lote (Entrada e Saída juntas).
                        </p>

                        <input
                            type="file"
                            multiple
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />

                        <Button onClick={() => fileInputRef.current?.click()} className="bg-[#001A72] hover:bg-[#00279c] text-white font-bold px-8 py-6 rounded-2xl shadow-lg">
                            Selecionar Arquivos Manualmente
                        </Button>
                    </div>

                    {/* Preview da Fila */}
                    {files.length > 0 && (
                        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                <h4 className="text-lg font-black text-[#001A72] tracking-tight">Arquivos na Fila</h4>
                                <span className="bg-[#001A72] text-white px-3 py-1 rounded-lg text-xs font-bold">{files.length} planilhas</span>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                                {files.map((file, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                <FileSpreadsheet size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 w-[200px] sm:w-[350px] truncate">{file.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFile(i)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center justify-end">
                                <Button
                                    onClick={handleUpload}
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
                            {files.length < 2 && files.length > 0 && (
                                <p className="text-xs font-bold text-orange-500 text-right mt-3 bg-orange-50 p-3 rounded-xl">⚠️ É necessário adicionar ao menos 1 arquivo de Entrada e 1 de Saída para o robô confrontar os dados entre si.</p>
                            )}
                        </div>
                    )}

                    {/* Alertas de Resultado */}
                    {uploadResult && (
                        <div className={`p-6 rounded-[1.5rem] border flex gap-4 items-start ${uploadResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <div className="mt-1">
                                {uploadResult.success ? <CheckCircle2 size={24} className="text-emerald-600" /> : <AlertCircle size={24} className="text-red-600" />}
                            </div>
                            <div>
                                <h5 className="font-black mb-1">{uploadResult.success ? 'Processamento Bem-Sucedido!' : 'Atenção, ocoreu um erro'}</h5>
                                <p className="text-sm font-medium">{uploadResult.message}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna Regras de Negócio (Estilismo Streamlit) */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-[#001A72] to-[#00279c] rounded-[2rem] p-8 text-white shadow-xl shadow-[#001A72]/20 sticky top-28">
                        <h3 className="text-xl font-black mb-6">Como Funciona?</h3>

                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center font-black text-sm text-[#E87722]">1</div>
                                <div>
                                    <p className="font-bold text-sm mb-1">Identificação Semântica Automática</p>
                                    <p className="text-white/60 text-xs leading-relaxed">Não é preciso separar "O que é entrada" de "O que é saída". O robô deduz lendo o nome interno de cada planilha.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center font-black text-sm text-[#E87722]">2</div>
                                <div>
                                    <p className="font-bold text-sm mb-1">Mapeamento (Machine Learning Py)</p>
                                    <p className="text-white/60 text-xs leading-relaxed">Confronta documentações usando Fuzzy Matching (`analise_core.py`) e consolida divergências em milissegundos.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-8 h-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center font-black text-sm text-[#E87722]">3</div>
                                <div>
                                    <p className="font-bold text-sm mb-1">Deduplicação Inteligente (RLS)</p>
                                    <p className="text-white/60 text-xs leading-relaxed">Verifica linha por linha no Supabase se esse documento histórico já existe lá, impedindo ruídos e duplicatas de dados em sua conta.</p>
                                </div>
                            </li>
                        </ul>

                        <div className="mt-8 p-4 bg-black/20 rounded-2xl flex items-center gap-3">
                            <File size={24} className="text-[#E87722]" />
                            <p className="text-[11px] font-bold text-white/80">O processamento preserva nomes sensíveis de Hospitais seguindo a LGPD para uso no Dashboard.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
