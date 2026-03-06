'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'

interface MultiSelectProps {
    options: string[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
}

export function MultiSelect({ options, selected, onChange, placeholder = "Selecione..." }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearch('')
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const openDropdown = useCallback(() => {
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item) => item !== option))
        } else {
            onChange([...selected, option])
        }
        setSearch('')
        inputRef.current?.focus()
    }

    const removeTag = (e: React.MouseEvent, option: string) => {
        e.stopPropagation()
        onChange(selected.filter((item) => item !== option))
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
        setSearch('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && search === '' && selected.length > 0) {
            onChange(selected.slice(0, -1))
        }
        if (e.key === 'Escape') {
            setIsOpen(false)
            setSearch('')
        }
    }

    const filtered = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                className="flex min-h-[40px] items-center flex-wrap gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm ring-offset-white cursor-text shadow-sm hover:border-[#001A72]/30 focus-within:ring-2 focus-within:ring-[#001A72]/20 focus-within:border-[#001A72]/30 transition-colors"
                onClick={openDropdown}
            >
                {selected.map(item => (
                    <span
                        key={item}
                        className="inline-flex items-center gap-1 bg-[#001A72]/10 text-[#001A72] pl-2.5 pr-1 py-1 rounded-lg text-xs font-bold max-w-[160px] group animate-in fade-in zoom-in-95 duration-150"
                    >
                        <span className="truncate">{item}</span>
                        <button
                            onClick={(e) => removeTag(e, item)}
                            className="p-0.5 rounded hover:bg-[#001A72]/20 text-[#001A72]/60 hover:text-red-500 transition-colors"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    </span>
                ))}

                <div className="flex-1 min-w-[80px] flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setIsOpen(true) }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 placeholder:font-medium py-0.5"
                    />
                </div>

                <div className="flex items-center gap-1 text-slate-400 shrink-0 ml-1">
                    {selected.length > 0 && (
                        <div onClick={handleClear} className="hover:bg-slate-100 p-1 rounded-md transition-colors text-slate-400 hover:text-red-500 cursor-pointer">
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#001A72]' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-100 bg-white p-1 text-slate-700 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-2">
                    {search && (
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 mb-1 text-xs text-slate-400 font-medium">
                            <Search size={12} />
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para &quot;{search}&quot;
                        </div>
                    )}
                    {filtered.length === 0 ? (
                        <div className="p-3 text-center text-sm text-slate-400 font-medium">Nenhum resultado encontrado.</div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {filtered.map((option) => {
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
                                        <HighlightMatch text={option} query={search} />
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

function HighlightMatch({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
        <>
            {text.slice(0, idx)}
            <span className="bg-yellow-200/60 text-[#001A72] rounded px-0.5">{text.slice(idx, idx + query.length)}</span>
            {text.slice(idx + query.length)}
        </>
    )
}
