import { useMemo, useState, type FormEvent } from 'react'
import type { Lead } from '../leads/types'
import type { Contact, ContactForm } from './types'
import { emptyContactForm } from './types'

type ContactsPageProps = {
  contacts: Contact[]
  leads: Lead[]
  loading: boolean
  saving: boolean
  onSave: (
    form: ContactForm,
    editingContactId: number | null,
  ) => Promise<boolean>
  onError: (message: string) => void
  onNotice: (message: string) => void
}

export default function ContactsPage({
  contacts,
  leads,
  loading,
  saving,
  onSave,
  onError,
  onNotice,
}: ContactsPageProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyContactForm)

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase()

    return contacts.filter((contact) =>
      [
        contact.name,
        contact.company ?? '',
        contact.email ?? '',
        contact.phone ?? '',
        contact.job_title ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [contacts, search])

  function resetForm(clearMessages = true) {
    setForm(emptyContactForm)
    setEditingContactId(null)
    setShowForm(false)

    if (clearMessages) {
      onError('')
      onNotice('')
    }
  }

  function handleEdit(contact: Contact) {
    setForm({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      company: contact.company ?? '',
      job_title: contact.job_title ?? '',
      notes: contact.notes ?? '',
      source: contact.source ?? '',
      lead_id: contact.lead_id === null ? '' : String(contact.lead_id),
    })
    setEditingContactId(contact.id)
    setShowForm(true)
    onError('')
    onNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = await onSave(form, editingContactId)

    if (saved) {
      resetForm(false)
      setSearch('')
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">AKS - Tech / CRM</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Contatos
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie as pessoas relacionadas às suas oportunidades comerciais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm()
              return
            }

            setForm(emptyContactForm)
            setEditingContactId(null)
            setShowForm(true)
            onError('')
            onNotice('')
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showForm ? 'Cancelar' : '+ Novo contato'}
        </button>
      </section>

      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="font-bold text-slate-900">
            {editingContactId !== null ? 'Editar contato' : 'Cadastrar contato'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nome é obrigatório. Os demais campos são opcionais.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Nome completo *
              <input
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={200}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Nome do contato"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                maxLength={254}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="nome@empresa.com"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Telefone
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={40}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="(11) 99999-9999"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Empresa
              <input
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                maxLength={200}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Nome da empresa"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Cargo
              <input
                value={form.job_title}
                onChange={(event) => setForm({ ...form, job_title: event.target.value })}
                maxLength={150}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Ex.: Gerente de TI"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Origem do contato
              <input
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                maxLength={100}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Ex.: Indicação, site, LinkedIn"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
              Lead relacionado
              <select
                value={form.lead_id}
                onChange={(event) => setForm({ ...form, lead_id: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Nenhum lead vinculado</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}{lead.company ? ` — ${lead.company}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-3">
              Observações
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                maxLength={5000}
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                placeholder="Informações relevantes sobre o contato"
              />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? 'Salvando...'
                  : editingContactId !== null
                    ? 'Salvar alterações'
                    : 'Cadastrar contato'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => resetForm()}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs font-semibold text-slate-600">
            Buscar contatos
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, empresa, e-mail, telefone ou cargo"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <p className="text-sm text-slate-500">
            {filteredContacts.length} resultado(s)
          </p>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Carregando contatos...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Contato</th>
                  <th className="px-5 py-4">Empresa / cargo</th>
                  <th className="px-5 py-4">Lead relacionado</th>
                  <th className="px-5 py-4">Origem</th>
                  <th className="px-5 py-4 text-right">Cadastro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => {
                  const relatedLead = leads.find(
                    (lead) => lead.id === contact.lead_id,
                  )

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(contact)}
                          className="text-left font-semibold text-slate-800 hover:text-indigo-600 hover:underline"
                          title="Editar contato"
                        >
                          {contact.name}
                        </button>
                        <p className="mt-1 text-xs text-slate-500">
                          {contact.email || contact.phone || 'Sem contato informado'}
                        </p>
                        {contact.email && contact.phone && (
                          <p className="mt-1 text-xs text-slate-500">{contact.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{contact.company || '—'}</p>
                        {contact.job_title && (
                          <p className="mt-1 text-xs text-slate-500">{contact.job_title}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {relatedLead ? relatedLead.name : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {contact.source || '—'}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500">
                        {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}

                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      {contacts.length === 0
                        ? 'Nenhum contato cadastrado ainda.'
                        : 'Nenhum contato corresponde à busca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Exibindo {filteredContacts.length} de {contacts.length} contatos
        </div>
      </section>
    </div>
  )
}
