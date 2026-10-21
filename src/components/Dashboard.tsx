import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import MetricCard from '../components/MetricCard'
import Sidebar from '../components/Sidebar'

type Stage = 'Novo lead' | 'Qualificação' | 'Proposta' | 'Negociação' | 'Ganho'

type Lead = {
  id: number
  name: string
  company: string | null
  email: string | null
  phone: string | null
  stage: Stage
  value: number
  created_at: string
  updated_at: string
}

type LeadForm = {
  name: string
  email: string
  phone: string
  company: string
  stage: Stage
  value: string
}

const stages: Stage[] = ['Novo lead', 'Qualificação', 'Proposta', 'Negociação', 'Ganho']

const emptyForm: LeadForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  stage: 'Novo lead',
  value: '0',
}

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value)

const stageStyles: Record<Stage, string> = {
  'Novo lead': 'bg-slate-100 text-slate-600',
  Qualificação: 'bg-blue-50 text-blue-700',
  Proposta: 'bg-violet-50 text-violet-700',
  Negociação: 'bg-amber-50 text-amber-700',
  Ganho: 'bg-emerald-50 text-emerald-700',
}

type DashboardProps = {
  session: Session
  onLogout: () => void
}

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('Todas')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<LeadForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    async function loadLeads() {
      setLoading(true)
      setError('')

      const { data, error: err } = await supabase
        .from('leads')
        .select('id, name, email, phone, company, stage, value, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (!active) return

      if (err) {
        setError(`Não foi possível carregar os leads: ${err.message}`)
      } else {
        setLeads((data ?? []) as Lead[])
      }

      setLoading(false)
    }

    void loadLeads()

    return () => {
      active = false
    }
  }, [])

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()

    return leads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.company ?? '',
        lead.email ?? '',
        lead.phone ?? '',
      ].join(' ').toLowerCase().includes(term)

      return matchesSearch && (stageFilter === 'Todas' || lead.stage === stageFilter)
    })
  }, [leads, search, stageFilter])

  const pipelineValue = leads
    .filter((lead) => lead.stage !== 'Ganho')
    .reduce((total, lead) => total + Number(lead.value), 0)

  const wonValue = leads
    .filter((lead) => lead.stage === 'Ganho')
    .reduce((total, lead) => total + Number(lead.value), 0)

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')

    const amount = Number(form.value.replace(',', '.'))

    if (!form.name.trim()) {
      setError('Informe o nome do contato.')
      return
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError('Informe um valor válido, igual ou maior que zero.')
      return
    }

    setSaving(true)

    const leadData = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      stage: form.stage,
      value: amount,
    }

    if (editingLeadId !== null) {
      const { data, error: err } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', editingLeadId)
        .select('id, name, email, phone, company, stage, value, created_at, updated_at')
        .single()

      setSaving(false)

      if (err) {
        setError(`Não foi possível atualizar o lead: ${err.message}`)
        return
      }

      setLeads((current) => current.map((lead) => (lead.id === editingLeadId ? (data as Lead) : lead)))
      setNotice('Lead atualizado com sucesso.')
    } else {
      const { data, error: err } = await supabase
        .from('leads')
        .insert(leadData)
        .select('id, name, email, phone, company, stage, value, created_at, updated_at')
        .single()

      setSaving(false)

      if (err) {
        setError(`Não foi possível cadastrar o lead: ${err.message}`)
        return
      }

      setLeads((current) => [data as Lead, ...current])
      setNotice('Lead cadastrado com sucesso.')
    }

    setForm(emptyForm)
    setEditingLeadId(null)
    setShowForm(false)
    setSearch('')
    setStageFilter('Todas')
  }

  function handleEditLead(lead: Lead) {
    setEditingLeadId(lead.id)
    setForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      company: lead.company ?? '',
      stage: lead.stage,
      value: String(lead.value),
    })
    setShowForm(true)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleStageChange(lead: Lead, stage: Stage) {
    if (lead.stage === stage) return

    setError('')
    setNotice('')

    const previousStage = lead.stage

    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, stage } : item)))

    const { error: err } = await supabase.from('leads').update({ stage }).eq('id', lead.id)

    if (err) {
      setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, stage: previousStage } : item)))
      setError(`Não foi possível atualizar a etapa: ${err.message}`)
    } else {
      setNotice('Etapa do lead atualizada.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <Sidebar leadsCount={leads.length} userEmail={session.user?.email} onLogout={onLogout} />

      <main id="dashboard" className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:px-8">
          <div>
            <p className="text-xs text-slate-500">AKS - Tech / CRM</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Leads</h1>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                setEditingLeadId(null)
                setForm(emptyForm)
              } else {
                setEditingLeadId(null)
                setForm(emptyForm)
                setShowForm(true)
              }
              setError('')
              setNotice('')
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? 'Cancelar' : '+ Novo lead'}
          </button>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {notice}
            </div>
          )}

          {showForm && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">
                {editingLeadId !== null ? 'Editar lead' : 'Cadastrar lead'}
              </h2>
              <form onSubmit={handleCreateLead} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Nome *
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  E-mail
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Telefone
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Empresa
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Etapa
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Valor potencial (R$)
                  <input inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                  <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? 'Salvando...' : editingLeadId !== null ? 'Salvar alterações' : 'Cadastrar lead'}
                  </button>
                  <button type="button" disabled={saving} onClick={() => { setShowForm(false); setEditingLeadId(null); setForm(emptyForm); setError(''); setNotice(''); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}

          <section>
            <p className="text-sm text-slate-500">Dados carregados do banco compartilhado.</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Resumo comercial</h2>
          </section>

          <section aria-label="Indicadores comerciais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total de leads" value={String(leads.length)} detail="Contatos cadastrados" />
            <MetricCard label="Pipeline aberto" value={currency(pipelineValue)} detail="Oportunidades em andamento" />
            <MetricCard label="Negócios ganhos" value={currency(wonValue)} detail={`${leads.filter((lead) => lead.stage === 'Ganho').length} convertida(s)`} />
            <MetricCard label="Em negociação" value={String(leads.filter((lead) => lead.stage === 'Negociação').length)} detail="Oportunidades em fase final" />
          </section>

          <section id="pipeline" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">Pipeline de vendas</h2>
            <p className="mt-1 text-sm text-slate-500">Selecione uma etapa para filtrar os leads.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {stages.map((stage) => {
                const items = leads.filter((lead) => lead.stage === stage)
                const total = items.reduce((sum, lead) => sum + Number(lead.value), 0)
                return (
                  <button key={stage} onClick={() => { setStageFilter(stage); document.getElementById('leads')?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-indigo-200">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stageStyles[stage]}`}>{stage}</span>
                    <p className="mt-4 text-2xl font-bold text-slate-900">{items.length}</p>
                    <p className="mt-1 text-sm text-slate-500">{currency(total)}</p>
                  </button>
                )
              })}
            </div>
          </section>

          <section id="leads" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-4 border-b border-slate-100 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-bold text-slate-900">Todos os leads</h2>
                  <p className="mt-1 text-sm text-slate-500">Consulte e acompanhe os contatos comerciais da AKS - Tech.</p>
                </div>
                <span className="text-sm text-slate-500">{filteredLeads.length} resultado(s)</span>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="block flex-1 text-xs font-semibold text-slate-600">
                  Buscar leads
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, empresa, e-mail ou telefone" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                </label>
                <label className="block lg:w-56 text-xs font-semibold text-slate-600">
                  Filtrar por etapa
                  <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                    <option value="Todas">Todas as etapas</option>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => { setSearch(''); setStageFilter('Todas'); }} disabled={!search && stageFilter === 'Todas'} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Limpar filtros
                </button>
                <button onClick={() => void onLogout()} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50 lg:hidden">
                  Sair
                </button>
              </div>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">Carregando leads...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Contato</th>
                      <th className="px-5 py-4">Empresa</th>
                      <th className="px-5 py-4">Etapa</th>
                      <th className="px-5 py-4 text-right">Valor</th>
                      <th className="px-5 py-4 text-right">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <button type="button" onClick={() => handleEditLead(lead)} className="text-left font-semibold text-slate-800 hover:text-indigo-600 hover:underline" title="Editar lead">{lead.name}</button>
                          <p className="mt-1 text-xs text-slate-500">{lead.email || lead.phone || 'Sem contato informado'}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{lead.company || '—'}</td>
                        <td className="px-5 py-4">
                          <select aria-label={`Etapa de ${lead.name}`} value={lead.stage} onChange={(e) => void handleStageChange(lead, e.target.value as Stage)} className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold ${stageStyles[lead.stage]}`}>
                            {stages.map((stage) => <option key={stage}>{stage}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">{currency(Number(lead.value))}</td>
                        <td className="px-5 py-4 text-right text-slate-500">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                    {!loading && filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-500">{leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead corresponde à busca.'}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
              Exibindo {filteredLeads.length} de {leads.length} leads
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-slate-400">
            LeadFlow CRM · AKS - Tech
          </footer>
        </div>
      </main>
    </div>
  )
}