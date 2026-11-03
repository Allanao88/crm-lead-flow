import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import { TableRowsSkeleton } from '../../components/Skeleton'
import type { LeadOption } from '../leads/useLeadOptions'
import type { Contact, ContactForm } from './types'
import { emptyContactForm } from './types'

type ContactsPageProps = {
  contacts: Contact[]
  leadOptions: LeadOption[]
  loading: boolean
  saving: boolean
  onSave: (
    form: ContactForm,
    editingContactId: number | null,
  ) => Promise<boolean>
  onDelete: (contactId: number) => Promise<boolean>
  getLeadName?: (leadId: number) => Promise<string | null>
  onError: (message: string) => void
  onNotice: (message: string) => void
}

export default function ContactsPage({
  contacts,
  leadOptions,
  loading,
  saving,
  onSave,
  onDelete,
  getLeadName,
  onError,
  onNotice,
}: ContactsPageProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>(emptyContactForm)
  const [nameTouched, setNameTouched] = useState(false)
  const [customLeadNames, setCustomLeadNames] = useState<Record<number, string>>({})

  // Mapeia nomes de leads já presentes em leadOptions
  const leadOptionsMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const lead of leadOptions) {
      map.set(lead.id, lead.name)
    }
    return map
  }, [leadOptions])

  // Busca nomes de leads vinculados a contatos que não estão em leadOptions (ex.: leads arquivados)
  useEffect(() => {
    const missingLeadIds = contacts
      .map((c) => c.lead_id)
      .filter((id): id is number => id !== null && !leadOptionsMap.has(id) && !(id in customLeadNames))

    if (missingLeadIds.length === 0 || !getLeadName) return

    let isCurrent = true
    const uniqueIds = Array.from(new Set(missingLeadIds))

    void Promise.all(
      uniqueIds.map(async (id) => {
        const name = await getLeadName(id)
        return { id, name }
      }),
    ).then((results) => {
      if (!isCurrent) return
      setCustomLeadNames((prev) => {
        const next = { ...prev }
        let changed = false
        for (const { id, name } of results) {
          if (name && next[id] !== name) {
            next[id] = name
            changed = true
          }
        }
        return changed ? next : prev
      })
    })

    return () => {
      isCurrent = false
    }
  }, [contacts, leadOptionsMap, customLeadNames, getLeadName])

  // Quando abre a confirmação de exclusão, busca o nome do lead vinculado caso não esteja em cache
  useEffect(() => {
    if (!contactToDelete || contactToDelete.lead_id === null) {
      return
    }

    const leadId = contactToDelete.lead_id
    const cachedName = leadOptionsMap.get(leadId) || customLeadNames[leadId]

    if (cachedName) {
      return
    }

    if (getLeadName) {
      let isCurrent = true
      void getLeadName(leadId).then((name) => {
        if (isCurrent && name) {
          setCustomLeadNames((prev) => ({ ...prev, [leadId]: name }))
        }
      })
      return () => {
        isCurrent = false
      }
    }
  }, [contactToDelete, leadOptionsMap, customLeadNames, getLeadName])

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

  async function handleConfirmDelete() {
    if (!contactToDelete) return

    const deleted = await onDelete(contactToDelete.id)

    if (deleted && editingContactId === contactToDelete.id) {
      resetForm(false)
    }

    setContactToDelete(null)
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
            {(fieldProps) => {
              const currentLeadId = form.lead_id ? Number(form.lead_id) : null
              const isCurrentLeadArchivedOrExtra =
                currentLeadId !== null &&
                !leadOptionsMap.has(currentLeadId) &&
                Boolean(customLeadNames[currentLeadId])

              return (
                <select
                  {...fieldProps}
                  value={form.lead_id}
                  onChange={(event) =>
                    setForm({ ...form, lead_id: event.target.value })
                  }
                >
                  <option value="">Nenhum lead vinculado</option>
                  {isCurrentLeadArchivedOrExtra && (
                    <option key={currentLeadId} value={currentLeadId}>
                      {customLeadNames[currentLeadId]} (arquivado)
                    </option>
                  )}
                  {leadOptions.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.company ? ` — ${lead.company}` : ''}
                    </option>
                  ))}
                </select>
              )
            }}
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
        <div className="space-y-4 border-b border-[var(--glass-border)] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="crm-section-title">Todos os contatos</h2>
              <p className="mt-1 text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
                Consulte interlocutores, empresas e vínculos com oportunidades.
              </p>
            </div>
            <p className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] tabular-nums">
              {filteredContacts.length} resultado(s)
            </p>
          </div>

          <FormField label="Buscar contatos" className="sm:max-w-lg">
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
        </div>

        <div className="crm-table-container">
          <table className="crm-table min-w-[900px]">
            <thead>
              <tr>
                <th>Contato</th>
                <th>Empresa / cargo</th>
                <th>Lead relacionado</th>
                <th>Origem</th>
                <th className="text-right">Cadastro</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="crm-stagger-rows">
              {loading ? (
                <TableRowsSkeleton columns={6} rows={5} />
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    {contacts.length === 0 ? (
                      <EmptyState
                        icon="contacts"
                        title="Nenhum contato cadastrado"
                        description="Cadastre decisores e interlocutores para conectá-los às suas oportunidades comerciais."
                        actionLabel="+ Novo contato"
                        onAction={() => {
                          setForm(emptyContactForm)
                          setEditingContactId(null)
                          setNameTouched(false)
                          setShowForm(true)
                          onError('')
                          onNotice('')
                        }}
                      />
                    ) : (
                      <EmptyState
                        icon="search"
                        title="Nenhum contato encontrado"
                        description="Nenhum contato corresponde ao termo pesquisado."
                        actionLabel="Limpar busca"
                        actionVariant="secondary"
                        onAction={() => setSearch('')}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const relatedLeadName =
                    (contact.lead_id !== null
                      ? leadOptionsMap.get(contact.lead_id) || customLeadNames[contact.lead_id]
                      : null) || null

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
                        {relatedLeadName ? (
                          <span className="text-[var(--color-text-primary)]">
                            {relatedLeadName}
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
                      <td className="text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={saving}
                          title={`Excluir ${contact.name}`}
                          onClick={() => {
                            onError('')
                            onNotice('')
                            setContactToDelete(contact)
                          }}
                        >
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--glass-border)] px-5 py-4 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] sm:px-6 tabular-nums">
          Exibindo {filteredContacts.length} de {contacts.length} contatos
        </div>
      </section>

      <ConfirmDialog
        open={contactToDelete !== null}
        title="Excluir contato"
        message={
          !contactToDelete
            ? ''
            : contactToDelete.lead_id === null
              ? `Excluir ${contactToDelete.name}? Esta ação não pode ser desfeita.`
              : (() => {
                  const leadName =
                    leadOptionsMap.get(contactToDelete.lead_id) ||
                    customLeadNames[contactToDelete.lead_id]

                  return leadName
                    ? `Excluir ${contactToDelete.name}? Este contato está vinculado ao lead "${leadName}"; o lead não será alterado. Esta ação não pode ser desfeita.`
                    : `Excluir ${contactToDelete.name}? Este contato possui lead vinculado; o lead não será alterado. Esta ação não pode ser desfeita.`
                })()
        }
        confirmLabel="Excluir"
        confirmVariant="danger"
        busy={saving}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!saving) setContactToDelete(null)
        }}
      />

      <footer className="pb-2 text-center text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
        LeadFlow CRM · AKS - Tech
      </footer>
    </div>
  )
}
