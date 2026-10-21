export type Company = {
  id: number
  user_id: string
  name: string
  cnpj: string | null
  website: string | null
  email: string | null
  phone: string | null
  industry: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CompanyForm = {
  name: string
  cnpj: string
  website: string
  email: string
  phone: string
  industry: string
  address: string
  notes: string
}

export const emptyCompanyForm: CompanyForm = {
  name: '',
  cnpj: '',
  website: '',
  email: '',
  phone: '',
  industry: '',
  address: '',
  notes: '',
}
