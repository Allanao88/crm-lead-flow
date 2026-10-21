import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Contact, ContactForm } from './types'

const contactFields =
  'id, name, email, phone, company, job_title, notes, source, lead_id, created_at, updated_at'

type UseContactsResult = {
  contacts: Contact[]
  loading: boolean
  saving: boolean
  saveContact: (
    form: ContactForm,
    editingContactId: number | null,
  ) => Promise<boolean>
}

export function useContacts(
  session: Session | null,
  setError: Dispatch<SetStateAction<string>>,
  setNotice: Dispatch<SetStateAction<string>>,
): UseContactsResult {
  const [contactState, setContactState] = useState<{
    userId: string | null
    items: Contact[]
  }>({ userId: null, items: [] })

  const contacts =
    contactState.userId === (session?.user.id ?? null)
      ? contactState.items
      : []

  const setContacts: Dispatch<SetStateAction<Contact[]>> = useCallback(
    (action) => {
      const userId = session?.user.id ?? null

      setContactState((current) => {
        const currentItems =
          current.userId === userId ? current.items : []

        const items =
          typeof action === 'function'
            ? action(currentItems)
            : action

        return { userId, items }
      })
    },
    [session?.user.id],
  )

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) return

    let active = true

    async function loadContacts() {
      setLoading(true)
      setError('')

      try {
        const { data, error } = await supabase
          .from('contacts')
          .select(contactFields)
          .order('created_at', { ascending: false })

        if (!active) return

        if (error) {
          setError(`Não foi possível carregar os contatos: ${error.message}`)
        } else {
          setContacts((data ?? []) as Contact[])
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? `Não foi possível carregar os contatos: ${err.message}`
              : 'Não foi possível carregar os contatos.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadContacts()

    return () => {
      active = false
    }
  }, [session, setError, setContacts])

  async function saveContact(
    form: ContactForm,
    editingContactId: number | null,
  ): Promise<boolean> {
    setError('')
    setNotice('')

    if (!form.name.trim()) {
      setError('Informe o nome do contato.')
      return false
    }

    const leadId = form.lead_id.trim()
      ? Number(form.lead_id)
      : null

    if (
      leadId !== null &&
      (!Number.isSafeInteger(leadId) || leadId <= 0)
    ) {
      setError('Selecione um lead válido.')
      return false
    }

    setSaving(true)

    try {
      const contactData = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        job_title: form.job_title.trim() || null,
        notes: form.notes.trim() || null,
        source: form.source.trim() || null,
        lead_id: leadId,
      }

      const query =
        editingContactId !== null
          ? supabase
              .from('contacts')
              .update(contactData)
              .eq('id', editingContactId)
          : supabase
              .from('contacts')
              .insert(contactData)

      const { data, error } = await query
        .select(contactFields)
        .single()

      if (error) {
        setError(
          editingContactId !== null
            ? `Não foi possível atualizar o contato: ${error.message}`
            : `Não foi possível cadastrar o contato: ${error.message}`,
        )
        return false
      }

      if (editingContactId !== null) {
        setContacts((current) =>
          current.map((contact) =>
            contact.id === editingContactId
              ? (data as Contact)
              : contact,
          ),
        )
        setNotice('Contato atualizado com sucesso.')
      } else {
        setContacts((current) => [data as Contact, ...current])
        setNotice('Contato cadastrado com sucesso.')
      }

      return true
    } catch (err) {
      setError(
        err instanceof Error
          ? `Não foi possível salvar o contato: ${err.message}`
          : 'Não foi possível salvar o contato.',
      )
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    contacts,
    loading: session ? loading : false,
    saving,
    saveContact,
  }
}
