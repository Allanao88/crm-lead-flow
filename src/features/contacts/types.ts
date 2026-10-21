export type Contact = {
  id: number
  name: string
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null
  notes: string | null
  source: string | null
  lead_id: number | null
  created_at: string
  updated_at: string
}

export type ContactForm = {
  name: string
  email: string
  phone: string
  company: string
  job_title: string
  notes: string
  source: string
  lead_id: string
}

export const emptyContactForm: ContactForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  job_title: '',
  notes: '',
  source: '',
  lead_id: '',
}
