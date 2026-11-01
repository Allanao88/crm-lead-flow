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
    <div className="crm-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>

          <h2 className="crm-page-title mt-1">
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
          className="crm-primary-button"
        >
          {showForm ? 'Cancelar' : '+ Novo contato'}
        </button>
      </section>

      {showForm && (
        <section className="crm-panel p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">
            {editingContactId !== null ? 'Editar contato' : 'Cadastrar contato'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nome é obrigatório. Os demais campos são opcionais.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="crm-field-label">
              Nome completo *
              <input
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                maxLength={200}
                className="crm-field mt-1.5"
                placeholder="Nome do contato"
              />
            </label>

            <label className="crm-field-label">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                maxLength={254}
                className="crm-field mt-1.5"
                placeholder="nome@empresa.com"
              />
            </label>

            <label className="crm-field-label">
              Telefone
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                maxLength={40}
                className="crm-field mt-1.5"
                placeholder="(11) 99999-9999"
              />
            </label>

            <label className="crm-field-label">
              Empresa
              <input
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                maxLength={200}
                className="crm-field mt-1.5"
                placeholder="Nome da empresa"
              />
            </label>

            <label className="crm-field-label">
              Cargo
              <input
                value={form.job_title}
                onChange={(event) => setForm({ ...form, job_title: event.target.value })}
                maxLength={150}
                className="crm-field mt-1.5"
                placeholder="Ex.: Gerente de TI"
              />
            </label>

            <label className="crm-field-label">
              Origem do contato
              <input
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                maxLength={100}
                className="crm-field mt-1.5"
                placeholder="Ex.: Indicação, site, LinkedIn"
              />
            </label>

            <label className="crm-field-label sm:col-span-2 lg:col-span-3">
              Lead relacionado
              <select
                value={form.lead_id}
                onChange={(event) => setForm({ ...form, lead_id: event.target.value })}
                className="crm-field mt-1.5"
              >
                <option value="">Nenhum lead vinculado</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}{lead.company ? ` — ${lead.company}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="crm-field-label sm:col-span-2 lg:col-span-3">
              Observações
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                maxLength={5000}
                rows={3}
                className="crm-field mt-1.5 resize-y"
                placeholder="Informações relevantes sobre o contato"
              />
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="crm-primary-button"
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
                className="crm-secondary-button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="crm-panel">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end">
          <label className="crm-field-label block flex-1">
            Buscar contatos
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, empresa, e-mail, telefone ou cargo"
              className="crm-field mt-1.5 font-normal"
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
          <div className="crm-table-container">
            <table className="crm-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="px-5 py-4">Contato</th>
                  <th className="px-5 py-4">Empresa / cargo</th>
                  <th className="px-5 py-4">Lead relacionado</th>
                  <th className="px-5 py-4">Origem</th>
                  <th className="px-5 py-4 text-right">Cadastro</th>
                </tr>
              </thead>
              <tbody>
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
                          className="text-left font-semibold text-slate-800 hover:text-[var(--color-brand)] hover:underline"
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
