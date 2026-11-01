import { useMemo, useState, type FormEvent } from 'react'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import FormField from '../../components/FormField'
import GlassDialog from '../../components/GlassDialog'
import { TableRowsSkeleton } from '../../components/Skeleton'
import type { Company, CompanyForm } from './types'
import { emptyCompanyForm } from './types'

type CompaniesPageProps = {
  companies: Company[]
  loading: boolean
  saving: boolean
  onSave: (
    form: CompanyForm,
    editingCompanyId: number | null,
  ) => Promise<boolean>
  onError: (message: string) => void
  onNotice: (message: string) => void
}

export default function CompaniesPage({
  companies,
  loading,
  saving,
  onSave,
  onError,
  onNotice,
}: CompaniesPageProps) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null)
  const [form, setForm] = useState<CompanyForm>(emptyCompanyForm)
  const [nameTouched, setNameTouched] = useState(false)

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase()

    return companies.filter((company) =>
      [
        company.name,
        company.cnpj ?? '',
        company.email ?? '',
        company.phone ?? '',
        company.industry ?? '',
        company.website ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [companies, search])

  function resetForm(clearMessages = true) {
    setForm(emptyCompanyForm)
    setEditingCompanyId(null)
    setNameTouched(false)
    setShowForm(false)

    if (clearMessages) {
      onError('')
      onNotice('')
    }
  }

  function handleEdit(company: Company) {
    setForm({
      name: company.name,
      cnpj: company.cnpj ?? '',
      website: company.website ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      industry: company.industry ?? '',
      address: company.address ?? '',
      notes: company.notes ?? '',
    })
    setEditingCompanyId(company.id)
    setNameTouched(false)
    setShowForm(true)
    onError('')
    onNotice('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameTouched(true)

    const saved = await onSave(form, editingCompanyId)

    if (saved) {
      resetForm(false)
      setSearch('')
    }
  }

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const nameError =
    nameTouched && !form.name.trim() ? 'Informe o nome da empresa.' : undefined

  return (
    <div className="crm-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[length:var(--text-sm)] text-[var(--color-text-secondary)]">
            Organize as empresas e mantenha os dados das suas contas comerciais.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setForm(emptyCompanyForm)
            setEditingCompanyId(null)
            setNameTouched(false)
            setShowForm(true)
            onError('')
            onNotice('')
          }}
        >
          + Nova empresa
        </Button>
      </section>

      <GlassDialog
        open={showForm}
        variant="drawer"
        busy={saving}
        title={editingCompanyId !== null ? 'Editar empresa' : 'Cadastrar empresa'}
        description="Nome é obrigatório. Os demais campos são opcionais."
        onClose={() => resetForm()}
      >
        <form
          noValidate
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField
            label="Nome da empresa *"
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
                onChange={(event) => updateField('name', event.target.value)}
                maxLength={200}
                placeholder="Razão social ou nome fantasia"
              />
            )}
          </FormField>

          <FormField label="CNPJ">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.cnpj}
                onChange={(event) => updateField('cnpj', event.target.value)}
                maxLength={18}
                placeholder="00.000.000/0000-00"
              />
            )}
          </FormField>

          <FormField label="Setor de atuação">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                maxLength={150}
                placeholder="Ex.: Tecnologia"
              />
            )}
          </FormField>

          <FormField label="E-mail corporativo">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                maxLength={254}
                placeholder="contato@empresa.com.br"
              />
            )}
          </FormField>

          <FormField label="Telefone">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                maxLength={40}
                placeholder="(11) 3333-4444"
              />
            )}
          </FormField>

          <FormField label="Website" className="sm:col-span-2">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="url"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
                maxLength={500}
                placeholder="https://empresa.com.br"
              />
            )}
          </FormField>

          <FormField label="Endereço" className="sm:col-span-2">
            {(fieldProps) => (
              <input
                {...fieldProps}
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                maxLength={500}
                placeholder="Rua, número, cidade, estado e CEP"
              />
            )}
          </FormField>

          <FormField label="Observações" className="sm:col-span-2">
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                maxLength={5000}
                rows={3}
                className={`${fieldProps.className} resize-y`}
                placeholder="Informações relevantes sobre a empresa"
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
              {editingCompanyId !== null
                ? 'Salvar alterações'
                : 'Cadastrar empresa'}
            </Button>
          </div>
        </form>
      </GlassDialog>

      <section className="crm-panel">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--glass-border)] p-5 sm:flex-row sm:items-end sm:p-6">
          <FormField label="Buscar empresas" className="flex-1">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nome, CNPJ, e-mail, telefone ou setor"
              />
            )}
          </FormField>

          <p className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-muted)] tabular-nums">
            {filteredCompanies.length} resultado(s)
          </p>
        </div>

        <div className="crm-table-container">
          <table className="crm-table min-w-[900px]">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Setor</th>
                <th>Contato</th>
                <th>CNPJ</th>
                <th className="text-right">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton columns={5} rows={5} />
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    {companies.length === 0 ? (
                      <EmptyState
                        icon="companies"
                        title="Nenhuma empresa cadastrada"
                        description="Centralize CNPJ, setor e canais corporativos das contas atendidas pela equipe."
                        actionLabel="+ Nova empresa"
                        onAction={() => {
                          setForm(emptyCompanyForm)
                          setEditingCompanyId(null)
                          setNameTouched(false)
                          setShowForm(true)
                          onError('')
                          onNotice('')
                        }}
                      />
                    ) : (
                      <EmptyState
                        icon="search"
                        title="Nenhuma empresa encontrada"
                        description="Nenhuma empresa corresponde ao termo pesquisado."
                        actionLabel="Limpar busca"
                        actionVariant="secondary"
                        onAction={() => setSearch('')}
                      />
                    )}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleEdit(company)}
                        className="min-h-6 text-left font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] hover:text-[var(--color-brand)] hover:underline"
                        title="Editar empresa"
                      >
                        {company.name}
                      </button>
                      {company.website && (
                        <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                          {company.website}
                        </p>
                      )}
                    </td>
                    <td>
                      {company.industry ? (
                        <span className="crm-badge crm-badge--neutral">
                          {company.industry}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <p className="text-[var(--color-text-primary)]">
                        {company.email || '—'}
                      </p>
                      {company.phone && (
                        <p className="mt-1 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">
                          {company.phone}
                        </p>
                      )}
                    </td>
                    <td className="tabular-nums">
                      {company.cnpj || '—'}
                    </td>
                    <td className="text-right tabular-nums">
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--glass-border)] px-5 py-4 text-[length:var(--text-xs)] text-[var(--color-text-secondary)] sm:px-6 tabular-nums">
          Exibindo {filteredCompanies.length} de {companies.length} empresas
        </div>
      </section>
    </div>
  )
}
