import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Company, CompanyForm } from './types'

const companyFields =
  'id, user_id, name, cnpj, website, email, phone, industry, address, notes, created_at, updated_at'

type UseCompaniesResult = {
  companies: Company[]
  loading: boolean
  saving: boolean
  saveCompany: (
    form: CompanyForm,
    editingCompanyId: number | null,
  ) => Promise<boolean>
}

export function useCompanies(
  session: Session | null,
  setError: Dispatch<SetStateAction<string>>,
  setNotice: Dispatch<SetStateAction<string>>,
): UseCompaniesResult {
  const [companyState, setCompanyState] = useState<{
    userId: string | null
    items: Company[]
  }>({ userId: null, items: [] })

  const userId = session?.user.id ?? null
  const companies =
    companyState.userId === userId ? companyState.items : []

  const setCompanies: Dispatch<SetStateAction<Company[]>> = useCallback(
    (action) => {
      setCompanyState((current) => {
        const currentItems =
          current.userId === userId ? current.items : []
        const items =
          typeof action === 'function'
            ? action(currentItems)
            : action

        return { userId, items }
      })
    },
    [userId],
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) {
      return
    }

    let active = true

    async function loadCompanies() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase
          .from('companies')
          .select(companyFields)
          .order('name', { ascending: true })

        if (!active) return

        if (error) {
          setError(`Não foi possível carregar as empresas: ${error.message}`)
        } else {
          setCompanies((data ?? []) as Company[])
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? `Não foi possível carregar as empresas: ${err.message}`
              : 'Não foi possível carregar as empresas.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCompanies()

    return () => {
      active = false
    }
  }, [session, setError, setCompanies])

  async function saveCompany(
    form: CompanyForm,
    editingCompanyId: number | null,
  ): Promise<boolean> {
    setError('')
    setNotice('')

    if (!form.name.trim()) {
      setError('Informe o nome da empresa.')
      return false
    }

    if (!session?.user.id) {
      setError('Sua sessão expirou. Entre novamente para salvar a empresa.')
      return false
    }

    setSaving(true)

    try {
      const companyData = {
        user_id: session.user.id,
        name: form.name.trim(),
        cnpj: form.cnpj.trim() || null,
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        industry: form.industry.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      }

      const query =
        editingCompanyId !== null
          ? supabase
              .from('companies')
              .update(companyData)
              .eq('id', editingCompanyId)
              .eq('user_id', session.user.id)
          : supabase.from('companies').insert(companyData)

      const { data, error } = await query
        .select(companyFields)
        .single()

      if (error) {
        setError(
          editingCompanyId !== null
            ? `Não foi possível atualizar a empresa: ${error.message}`
            : `Não foi possível cadastrar a empresa: ${error.message}`,
        )
        return false
      }

      const savedCompany = data as Company

      if (editingCompanyId !== null) {
        setCompanies((current) =>
          current.map((company) =>
            company.id === editingCompanyId ? savedCompany : company,
          ),
        )
        setNotice('Empresa atualizada com sucesso.')
      } else {
        setCompanies((current) =>
          [...current, savedCompany].sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR'),
          ),
        )
        setNotice('Empresa cadastrada com sucesso.')
      }

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível salvar a empresa: ${err.message}`
          : 'Não foi possível salvar a empresa.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    companies,
    loading: session ? loading : false,
    saving,
    saveCompany,
  }
}
