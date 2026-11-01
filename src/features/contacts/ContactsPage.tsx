import { useMemo, useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
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
  const [nameTouched, setNameTouched] = useState(false)

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
    setNameTouched(false)
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
    setNameTouched(false)
    setShowForm(true)
    onError('')
    onNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameTouched(true)

    const saved = await onSave(form, editingContactId)

    if (saved) {
      resetForm(false)
      setSearch('')
    }
  }

  const nameError =
    nameTouched && !form.name.trim() ? 'Informe o nome do contato.' : undefined

  return (
    <div className="crm-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Gerencie as pessoas relacionadas às suas oportunidades comerciais.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setForm(emptyContactForm)
            setEditingContactId(null)
            setNameTouched(false)
            setShowForm(true)
            onError('')
            onNotice('')
          }}
        >
          + Novo contato
        </Button>
      </section>

      <GlassDialog
        open={showForm}
        variant="drawer"
        busy={saving}
        title={editingContactId !== null ? 'Editar contato' : 'Cadastrar contato'}
        description="Nome é obrigatório. Os demais campos são opcionais."
        onClose={() => resetForm()}
      >
        <form
          noValidate
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Nome completo *"
            error={nameError}
            className="sm:col-span-2"
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                data-autofocus
                required
                value={form.name}
                onBlur={() => setNameTouched(true)}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                maxLength={200}
                placeholder="Nome do contato"
              />
            )}
          </FormField>

          <FormField label="E-mail">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                maxLength={254}
                placeholder="nome@empresa.com"
              />
            )}
          </FormField>

          <FormField label="Telefone">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                maxLength={40}
                placeholder="(11) 99999-9999"
              />
            )}
          </FormField>

          <FormField label="Empresa">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.company}
                onChange={(event) =>
                  setForm({ ...form, company: event.target.value })
                }
                maxLength={200}
                placeholder="Nome da empresa"
              />
            )}
          </FormField>

          <FormField label="Cargo">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.job_title}
                onChange={(event) =>
                  setForm({ ...form, job_title: event.target.value })
                }
                maxLength={150}
                placeholder="Ex.: Gerente de TI"
              />
            )}
          </FormField>

          <FormField label="Origem do contato" className="sm:col-span-2">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.source}
                onChange={(event) =>
                  setForm({ ...form, source: event.target.value })
                }
                maxLength={100}
                placeholder="Ex.: Indicação, site, LinkedIn"
              />
            )}
          </FormField>

          <FormField label="Lead relacionado" className="sm:col-span-2">
            {(fieldProps) => (
              <select
                {...fieldProps}
                value={form.lead_id}
                onChange={(event) =>
                  setForm({ ...form, lead_id: event.target.value })
                }
              >
                <option value="">Nenhum lead vinculado</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                    {lead.company ? ` — ${lead.company}` : ''}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Observações" className="sm:col-span-2">
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                maxLength={5000}
                rows={3}
                className={`${fieldProps.className} resize-y`}
                placeholder="Informações relevantes sobre o contato"
              />
            )}
          </FormField>

          <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--glass-border)] pt-4 sm:col-span-2">
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => resetForm()}
            >
              Cancelar
            </Button>

            <Button type="submit" variant="primary" loading={saving}>
              {editingContactId !== null
                ? 'Salvar alterações'
                : 'Cadastrar contato'}
            </Button>
          </div>
        </form>
      </GlassDialog>

      <section className="crm-panel">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] p-5 sm:flex-row sm:items-end sm:p-6">
          <FormField label="Buscar contatos" className="flex-1">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, empresa, e-mail, telefone ou cargo"
              />
            )}
          </FormField>

          <p className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] tabular-nums">
            {filteredContacts.length} resultado(s)
          </p>
        </div>

        {loading ? (
          <p className="p-8 text-center text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Carregando contatos...
          </p>
        ) : (
          <div className="crm-table-container">
            <table className="crm-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Empresa / cargo</th>
                  <th>Lead relacionado</th>
                  <th>Origem</th>
                  <th className="text-right">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => {
                  const relatedLead = leads.find(
                    (lead) => lead.id === contact.lead_id,
                  )

                  return (
                    <tr key={contact.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleEdit(contact)}
                          className="min-h-6 text-left font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline"
                          title="Editar contato"
                        >
                          {contact.name}
                        </button>
                        <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                          {contact.email || contact.phone || 'Sem contato informado'}
                        </p>
                        {contact.email && contact.phone && (
                          <p className="mt-0.5 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                            {contact.phone}
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="text-[var(--color-text-primary)]">
                          {contact.company || '—'}
                        </p>
                        {contact.job_title && (
                          <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                            {contact.job_title}
                          </p>
                        )}
                      </td>
                      <td>
                        {relatedLead ? (
                          <span className="text-[var(--color-text-primary)]">
                            {relatedLead.name}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {contact.source ? (
                          <span className="crm-badge crm-badge--neutral">
                            {contact.source}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-right tabular-nums">
                        {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}

                {filteredContacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
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

        <div className="border-t border-[var(--glass-border)] px-5 py-4 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] sm:px-6 tabular-nums">
          Exibindo {filteredContacts.length} de {contacts.length} contatos
        </div>
      </section>
    </div>
  )
}
