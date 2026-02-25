'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, User, Shield, Building, Loader2 } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser } from '@/app/actions/user'

import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default function UsuariosPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Modal States
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'unidade',
        unit: ''
    })

    const loadUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error: any) {
            console.error("Failed to load users", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const openCreate = () => {
        setFormData({ email: '', name: '', password: '', role: 'unidade', unit: '' })
        setEditingId(null)
        setErrorMsg('')
        setShowModal(true)
    }

    const openEdit = (u: any) => {
        setFormData({
            email: u.email,
            name: u.name,
            password: '', // Empty password means don't change
            role: u.role,
            unit: u.unit || ''
        })
        setEditingId(u.id)
        setErrorMsg('')
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja apagar esse usuário permanentemente?")) return;
        setIsSubmitting(true)
        const res = await deleteUser(id)
        if (res.error) alert(res.error)
        else await loadUsers()
        setIsSubmitting(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')
        setIsSubmitting(true)

        // Formata Email baseado no Nome se Administrador digitar apenas um username simples como no sistema original
        let finalEmail = formData.email;
        if (!finalEmail.includes('@')) {
            finalEmail = `${finalEmail.trim().toLowerCase()}@hospitalcasa.com.br`;
        }

        const payload = { ...formData, email: finalEmail }

        let res;
        if (editingId) {
            res = await updateUser(editingId, payload)
        } else {
            res = await createUser(payload)
        }

        if (res.error) {
            setErrorMsg(res.error)
        } else {
            setShowModal(false)
            await loadUsers()
        }
        setIsSubmitting(false)
    }

    return (
        <div className="flex flex-col gap-8 pb-20 font-sans w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-10">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#001A72] tracking-tight">Gerenciamento de Usuários</h1>
                    <p className="text-slate-500 font-medium">Controle os níveis de acesso e a visibilidade de unidades operacionais por usuário.</p>
                </div>
                <Button onClick={openCreate} className="bg-[#E87722] hover:bg-[#d16615] text-white font-bold py-5 px-6 rounded-xl flex shadow-lg hover:shadow-orange-500/20 transition-all gap-2">
                    <Plus size={18} /> Novo Usuário
                </Button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-[#001A72]" size={32} />
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Contas...</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-extrabold text-slate-400 py-5 px-8 text-xs uppercase tracking-widest">Usuário (Membro)</TableHead>
                                <TableHead className="font-extrabold text-slate-400 py-5 px-6 text-xs uppercase tracking-widest">Perfil (Role)</TableHead>
                                <TableHead className="font-extrabold text-slate-400 py-5 px-6 text-xs uppercase tracking-widest">Unidade Restrita</TableHead>
                                <TableHead className="font-extrabold text-slate-400 py-5 px-8 text-xs uppercase tracking-widest text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} className="border-b border-slate-50 hover:bg-[#F8FAFC]">
                                    <TableCell className="py-5 px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#001A72] text-sm">{u.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        {u.role === 'admin' && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#001A72]/10 text-[#001A72] text-xs font-black uppercase tracking-widest"><ShieldCheck size={14} /> Admin</div>}
                                        {u.role === 'gestao' && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest"><Shield size={14} /> Gestão</div>}
                                        {u.role === 'unidade' && <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest"><Building size={14} /> Unidade</div>}
                                    </TableCell>
                                    <TableCell className="py-5 px-6">
                                        {u.unit ? (
                                            <span className="font-bold text-slate-600">{u.unit}</span>
                                        ) : (
                                            <span className="text-sm font-bold text-slate-400 italic">Vê Todas (Acesso Global)</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-5 px-8 text-right space-x-2">
                                        <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 font-bold">Nenhum usuário extra criado no sistema.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Modal de Criação / Edição */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-6 border-b border-slate-100">
                            <h3 className="text-xl font-black text-[#001A72]">
                                {editingId ? 'Editar Controles do Usuário' : 'Matricular Novo Usuário'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Defina se esse login tem acesso global (Admin/Gestão) ou se ele será restrito a um hospital.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold border border-red-200 rounded-xl flex gap-2"><ShieldAlert size={18} /> {errorMsg}</div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Nome do Profissional</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#001A72]/20 font-medium text-slate-700" placeholder="Ex: Maria Gestão RHC" />
                                </div>

                                <div className="space-y-1.5 gap-2">
                                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Login (Username/E-Mail)</label>
                                    <input required disabled={!!editingId} type="text" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#001A72]/20 font-medium text-slate-700 disabled:opacity-50" placeholder="Ex: h_portugal" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Senha de Acesso</label>
                                    <input required={!editingId} type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#001A72]/20 font-medium text-slate-700" placeholder={editingId ? '****** (Vazio = Manter Original)' : 'Digite a Senha...'} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-2 block">Nível de Permissão</label>
                                    <div className="flex items-center gap-3">
                                        {['admin', 'gestao', 'unidade'].map(r => (
                                            <button key={r} type="button" onClick={() => setFormData({ ...formData, role: r, unit: r !== 'unidade' ? '' : formData.unit })} className={`px-4 py-2 rounded-lg text-sm font-bold border ${formData.role === r ? 'bg-[#001A72]/10 border-[#001A72] text-[#001A72]' : 'bg-white border-slate-200 text-slate-500'}`}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formData.role === 'unidade' && (
                                    <div className="space-y-1.5 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                        <label className="text-xs font-bold text-orange-800 tracking-wider uppercase">Vincular Unidade (Hospital)</label>
                                        <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full bg-white border border-orange-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#E87722]/40 font-bold text-slate-700" placeholder="HOSPITAL CASA DE PORTUGAL" />
                                        <span className="text-[11px] text-orange-600 font-medium mt-1 inline-block">Mantenha a grafia idêntica à coluna 'Origem/Destino' do sistema (Ex: HOSPITAL CASA RIO LARANJEIRAS).</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4">
                                <Button type="button" onClick={() => setShowModal(false)} variant="outline" className="font-bold border-slate-200 text-slate-600">Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-[#001A72] hover:bg-[#00279c] font-bold px-8">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
