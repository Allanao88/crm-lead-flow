
import { useMemo, useState, type FormEvent } from 'react'
import MetricCard from './components/MetricCard'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'

import type { Lead, LeadForm, Stage } from './features/leads/types'
import { currency, emptyForm, stageStyles, stages } from './features/leads/constants'
import { useLeads } from './features/leads/useLeads'
import { useAuth } from './features/auth/useAuth'

function App() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('Todas')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<LeadForm>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)

  const {
    session,
    authReady,
    authSaving,
    authMode,
    authEmail,
    authPassword,
    setAuthEmail,
    setAuthPassword,
    setAuthMode,
    handleAuth,
    handleLogout,
  } = useAuth(setError, setNotice)

  const { leads, loading, saving, saveLead, handleStageChange } = useLeads(
    session,
    setError,
    setNotice,
  )



  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()

    return leads.filter((lead) => {
      const matchesSearch = [
        lead.name,
        lead.company ?? '',
        lead.email ?? '',
        lead.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)

      return (
        matchesSearch &&
        (stageFilter === 'Todas' || lead.stage === stageFilter)
      )
    })
  }, [leads, search, stageFilter])

  const openLeads = leads.filter((lead) => lead.stage !== 'Ganho')
  const wonLeads = leads.filter((lead) => lead.stage === 'Ganho')

  const pipelineSetup = openLeads.reduce(
    (total, lead) => total + Number(lead.setup_value),
    0,
  )
  const pipelineMrr = openLeads.reduce(
    (total, lead) => total + Number(lead.mrr_value),
    0,
  )
  const wonSetup = wonLeads.reduce(
    (total, lead) => total + Number(lead.setup_value),
    0,
  )
  const wonMrr = wonLeads.reduce(
    (total, lead) => total + Number(lead.mrr_value),
    0,
  )

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = await saveLead(form, editingLeadId)

    if (!saved) return

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
      setup_value: String(lead.setup_value),
      mrr_value: String(lead.mrr_value),
    })
    setShowForm(true)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] text-slate-600">
        Verificando sessão...
      </div>
    )
  }

  if (!session) {
    return (
      <AuthScreen
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        error={error}
        notice={notice}
        saving={authSaving}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuth}
        onToggleMode={() => {
          setAuthMode((mode) => mode === 'login' ? 'signup' : 'login')
          setError('')
          setNotice('')
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      <Sidebar
        leadsCount={leads.length}
        userEmail={session.user.email}
        onLogout={handleLogout}
      />

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
                  SETUP — desenvolvimento (R$)
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.setup_value} onChange={(e) => setForm({ ...form, setup_value: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  MRR — mensalidade (R$/mês)
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.mrr_value} onChange={(e) => setForm({ ...form, mrr_value: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving
                      ? 'Salvando...'
                      : editingLeadId !== null
                        ? 'Salvar alterações'
                        : 'Cadastrar lead'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setShowForm(false)
                      setEditingLeadId(null)
                      setForm(emptyForm)
                      setError('')
                      setNotice('')
                    }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
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

          <section aria-label="Indicadores comerciais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Total de leads" value={String(leads.length)} detail="Contatos cadastrados" />
            <MetricCard label="SETUP potencial" value={currency(pipelineSetup)} detail="Implantação dos negócios em aberto" />
            <MetricCard label="MRR potencial" value={currency(pipelineMrr)} detail="Recorrência mensal dos negócios em aberto" />
            <MetricCard label="SETUP ganho" value={currency(wonSetup)} detail="Implantação dos negócios ganhos" />
            <MetricCard label="MRR contratado" value={currency(wonMrr)} detail="Receita mensal dos negócios ganhos" />
            <MetricCard label="Em negociação" value={String(leads.filter((lead) => lead.stage === 'Negociação').length)} detail="Oportunidades em fase final" />
          </section>

          <section id="pipeline" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-900">Pipeline de vendas</h2>
            <p className="mt-1 text-sm text-slate-500">Selecione uma etapa para filtrar os leads.</p>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {stages.map((stage) => {
                const items = leads.filter((lead) => lead.stage === stage)
                const setupTotal = items.reduce(
                  (sum, lead) => sum + Number(lead.setup_value),
                  0,
                )
                const mrrTotal = items.reduce(
                  (sum, lead) => sum + Number(lead.mrr_value),
                  0,
                )

                return (
                  <button
                    key={stage}
                    onClick={() => {
                      setStageFilter(stage)
                      document.getElementById('leads')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-indigo-200"
                  >
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stageStyles[stage]}`}>{stage}</span>
                    <p className="mt-4 text-2xl font-bold text-slate-900">{items.length}</p>
                    <p className="mt-2 text-sm text-slate-600">SETUP: {currency(setupTotal)}</p>
                    <p className="mt-1 text-sm text-slate-600">MRR: {currency(mrrTotal)}/mês</p>
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
                  <p className="mt-1 text-sm text-slate-500">
                    Consulte e acompanhe os contatos comerciais da AKS - Tech.
                  </p>
                </div>
                <span className="text-sm text-slate-500">
                  {filteredLeads.length} resultado(s)
                </span>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <label className="block flex-1 text-xs font-semibold text-slate-600">
                  Buscar leads
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nome, empresa, e-mail ou telefone"
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="block lg:w-56 text-xs font-semibold text-slate-600">
                  Filtrar por etapa
                  <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Todas">Todas as etapas</option>
                    {stages.map((stage) => <option key={stage}>{stage}</option>)}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setStageFilter('Todas')
                  }}
                  disabled={!search && stageFilter === 'Todas'}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Limpar filtros
                </button>

                <button
                  onClick={() => void handleLogout()}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50 lg:hidden"
                >
                  Sair
                </button>
              </div>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">Carregando leads...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Contato</th>
                      <th className="px-5 py-4">Empresa</th>
                      <th className="px-5 py-4">Etapa</th>
                      <th className="px-5 py-4 text-right">SETUP</th>
                      <th className="px-5 py-4 text-right">MRR/mês</th>
                      <th className="px-5 py-4 text-right">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleEditLead(lead)}
                            className="text-left font-semibold text-slate-800 hover:text-indigo-600 hover:underline"
                            title="Editar lead"
                          >
                            {lead.name}
                          </button>
                          <p className="mt-1 text-xs text-slate-500">{lead.email || lead.phone || 'Sem contato informado'}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{lead.company || '—'}</td>
                        <td className="px-5 py-4">
                          <select
                            aria-label={`Etapa de ${lead.name}`}
                            value={lead.stage}
                            onChange={(e) => void handleStageChange(lead, e.target.value as Stage)}
                            className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-semibold ${stageStyles[lead.stage]}`}
                          >
                            {stages.map((stage) => <option key={stage}>{stage}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">{currency(Number(lead.setup_value))}</td>
                        <td className="px-5 py-4 text-right font-semibold text-emerald-700">{currency(Number(lead.mrr_value))}</td>
                        <td className="px-5 py-4 text-right text-slate-500">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                          {leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhum lead corresponde à busca.'}
                        </td>
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


export default App
