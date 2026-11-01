import { useMemo, useState, type FormEvent } from 'react'
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
    setShowForm(true)
    onError('')
    onNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const saved = await onSave(form, editingCompanyId)

    if (saved) {
      resetForm(false)
      setSearch('')
    }
  }

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="crm-page">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>

          <h2 className="crm-page-title mt-1">
            Empresas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Organize as empresas e mantenha os dados das suas contas comerciais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm()
              return
            }

            setForm(emptyCompanyForm)
            setEditingCompanyId(null)
            setShowForm(true)
            onError('')
            onNotice('')
          }}
          className="crm-primary-button"
        >
          {showForm ? 'Cancelar' : '+ Nova empresa'}
        </button>
      </section>

      {showForm && (
        <section className="crm-panel p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">
            {editingCompanyId !== null ? 'Editar empresa' : 'Cadastrar empresa'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nome é obrigatório. Os demais campos são opcionais.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <label className="crm-field-label">
              Nome da empresa *
              <input
                required
                autoFocus
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                maxLength={200}
                className="crm-field mt-1.5"
                placeholder="Razão social ou nome fantasia"
              />
            </label>

            <label className="crm-field-label">
              CNPJ
              <input
                value={form.cnpj}
                onChange={(event) => updateField('cnpj', event.target.value)}
                maxLength={18}
                className="crm-field mt-1.5"
                placeholder="00.000.000/0000-00"
              />
            </label>

            <label className="crm-field-label">
              Setor de atuação
              <input
                value={form.industry}
                onChange={(event) => updateField('industry', event.target.value)}
                maxLength={150}
                className="crm-field mt-1.5"
                placeholder="Ex.: Tecnologia"
              />
            </label>

            <label className="crm-field-label">
              E-mail corporativo
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                maxLength={254}
                className="crm-field mt-1.5"
                placeholder="contato@empresa.com.br"
              />
            </label>

            <label className="crm-field-label">
              Telefone
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                maxLength={40}
                className="crm-field mt-1.5"
                placeholder="(11) 3333-4444"
              />
            </label>

            <label className="crm-field-label">
              Website
              <input
                type="url"
                value={form.website}
                onChange={(event) => updateField('website', event.target.value)}
                maxLength={500}
                className="crm-field mt-1.5"
                placeholder="https://empresa.com.br"
              />
            </label>

            <label className="crm-field-label sm:col-span-2 lg:col-span-3">
              Endereço
              <input
                value={form.address}
                onChange={(event) => updateField('address', event.target.value)}
                maxLength={500}
                className="crm-field mt-1.5"
                placeholder="Rua, número, cidade, estado e CEP"
              />
            </label>

            <label className="crm-field-label sm:col-span-2 lg:col-span-3">
              Observações
              <textarea
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                maxLength={5000}
                rows={3}
                className="crm-field mt-1.5 resize-y"
                placeholder="Informações relevantes sobre a empresa"
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
                  : editingCompanyId !== null
                    ? 'Salvar alterações'
                    : 'Cadastrar empresa'}
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
            Buscar empresas
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, CNPJ, e-mail, telefone ou setor"
              className="crm-field mt-1.5 font-normal"
            />
          </label>

          <p className="text-sm text-slate-500">
            {filteredCompanies.length} resultado(s)
          </p>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Carregando empresas...
          </p>
        ) : (
          <div className="crm-table-container">
            <table className="crm-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="px-5 py-4">Empresa</th>
                  <th className="px-5 py-4">Setor</th>
                  <th className="px-5 py-4">Contato</th>
                  <th className="px-5 py-4">CNPJ</th>
                  <th className="px-5 py-4 text-right">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(company)}
                        className="text-left font-semibold text-slate-800 hover:text-[var(--color-brand)] hover:underline"
                        title="Editar empresa"
                      >
                        {company.name}
                      </button>
                      {company.website && (
                        <p className="mt-1 text-xs text-slate-500">
                          {company.website}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {company.industry || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{company.email || '—'}</p>
                      {company.phone && (
                        <p className="mt-1 text-xs text-slate-500">
                          {company.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {company.cnpj || '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500">
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}

                {filteredCompanies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      {companies.length === 0
                        ? 'Nenhuma empresa cadastrada ainda.'
                        : 'Nenhuma empresa corresponde à busca.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Exibindo {filteredCompanies.length} de {companies.length} empresas
        </div>
      </section>
    </div>
  )
}
