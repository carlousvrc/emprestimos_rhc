'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

interface MultiSelectProps {
    options: string[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = "Selecione..." }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item) => item !== option))
        } else {
            onChange([...selected, option])
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
    }

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className="flex min-h-[40px] items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 cursor-pointer shadow-sm hover:border-[#001A72]/30 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1 items-center flex-1 pr-2 truncate">
                    {selected.length === 0 && <span className="text-slate-400 font-medium">{placeholder}</span>}
                    {selected.length === 1 && <span className="text-[#001A72] font-bold truncate max-w-[200px]">{selected[0]}</span>}
                    {selected.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="bg-[#001A72]/10 text-[#001A72] px-2 py-0.5 rounded-md font-bold text-xs">{selected.length} selecionados</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                    {selected.length > 0 && (
                        <div onClick={handleClear} className="hover:bg-slate-100 p-1 rounded-md transition-colors text-slate-400 hover:text-red-500">
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#001A72]' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 text-slate-700 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2">
                    {options.length === 0 ? (
                        <div className="p-3 text-center text-sm text-slate-400 font-medium">Nenhuma opção.</div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {options.map((option) => {
                                const isSelected = selected.includes(option)
                                return (
                                    <div
                                        key={option}
                                        className={`relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-slate-50 ${isSelected ? 'bg-slate-50 font-bold text-[#001A72]' : 'font-medium text-slate-600'}`}
                                        onClick={() => toggleOption(option)}
                                    >
                                        {isSelected && (
                                            <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center text-[#E87722]">
                                                <Check size={16} strokeWidth={3} />
                                            </span>
                                        )}
                                        {option}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
