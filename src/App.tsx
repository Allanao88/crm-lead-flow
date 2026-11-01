import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { flushSync } from 'react-dom'

import AuthScreen from './components/AuthScreen'
import FeedbackMessages from './components/FeedbackMessages'
import { getSectionTitle } from './components/getSectionTitle'
import Sidebar, { type CrmSection } from './components/Sidebar'
import MobileNavigation from './components/MobileNavigation'
import { ModulePageSkeleton, Skeleton } from './components/Skeleton'

import { useAuth } from './features/auth/useAuth'
import { useCompanies } from './features/companies/useCompanies'
import { useContacts } from './features/contacts/useContacts'
import { useInventory } from './features/inventory/useInventory'
import { useLeadProducts } from './features/leads/useLeadProducts'
import { useLeadForm } from './features/leads/useLeadForm'
import type { Lead, Stage } from './features/leads/types'
import { useLeads } from './features/leads/useLeads'
import { useLeadFilters } from './features/leads/useLeadFilters'
import { useTheme } from './hooks/useTheme'

const CompaniesPage = lazy(() => import('./features/companies/CompaniesPage'))
const ContactsPage = lazy(() => import('./features/contacts/ContactsPage'))
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'))
const LeadsPage = lazy(() => import('./features/leads/LeadsPage'))
const OverviewPage = lazy(() => import('./features/overview/OverviewPage'))

function App() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState<CrmSection>('overview')
  const [isScrolled, setIsScrolled] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const {
    session,
    authReady,
    authSaving,
    authMode,
    authEmail,
    authPassword,
    setAuthEmail,
    setAuthPassword,
    setAuthMode,
    handleAuth,
    handleLogout,
  } = useAuth(setError, setNotice)

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', theme === 'light' ? '#edf3ee' : '#0f1311')
    }
  }, [theme])

  useEffect(() => {
    if (!authReady) {
      document.title = 'LeadFlow CRM | AKS - Tech'
      return
    }

    if (!session) {
      document.title = `${
        authMode === 'login' ? 'Entrar' : 'Criar conta'
      } · LeadFlow CRM | AKS - Tech`
      return
    }

    document.title = `${getSectionTitle(activeSection)} · LeadFlow CRM | AKS - Tech`
  }, [authReady, session, authMode, activeSection])

  const {
    leads,
    totalCount: leadsTotalCount,
    page: leadsPage,
    totalPages: leadsTotalPages,
    setPage: setLeadsPage,
    loading,
    saving,
    saveLead,
    handleStageChange,
  } = useLeads(
    session,
    setError,
    setNotice,
  )

  const {
    search,
    setSearch,
    stageFilter,
    setStageFilter,
    filteredLeads,
    resetFilters,
  } = useLeadFilters(leads)

  const {
    contacts,
    loading: contactsLoading,
    saving: contactSaving,
    saveContact,
  } = useContacts(session, setError, setNotice)

  const {
    companies,
    loading: companiesLoading,
    saving: companySaving,
    saveCompany,
  } = useCompanies(session, setError, setNotice)

  const {
    products: inventoryProducts,
    movements: inventoryMovements,
    loading: inventoryLoading,
    saving: inventorySaving,
    reload: reloadInventory,
    saveProduct,
    registerMovement,
    reverseMovement,
  } = useInventory(session?.user.id ?? null, setError, setNotice)

  const {
    form, setForm, showForm, editingLeadId,
    resetForm, startNewLead, cancelForm,
    handleCreateLead: saveLeadForm,
    handleEditLead: editLeadForm,
  } = useLeadForm({ saveLead, setError, setNotice, setSearch, setStageFilter })

  const {
    items: leadProductItems,
    setItems: setLeadProductItems,
    setProductQuantity,
    loading: leadProductsLoading,
    loadError: leadProductsError,
  } = useLeadProducts(editingLeadId)

  async function handleLogoutAndReset() {
    setActiveSection('overview')
    resetForm()
    setLeadProductItems([])
    resetFilters()
    await handleLogout()
  }

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    const saved = await saveLeadForm(
      event, leadProductItems, leadProductsLoading, leadProductsError,
    )
    if (saved) {
      setLeadProductItems([])
      await reloadInventory()
    }
  }

  async function handleLeadStageChange(lead: Lead, stage: Stage) {
    if (lead.stage === stage) return
    await handleStageChange(lead, stage)
    await reloadInventory()
  }

  function handleEditLead(lead: Lead) {
    setLeadProductItems([])
    editLeadForm(lead)
  }

  function handleNavigateSection(section: CrmSection) {
    if (section === activeSection) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const applyNavigation = () => {
      setActiveSection(section)
      setError('')
      setNotice('')
      if (section !== 'leads') {
        resetForm()
        setLeadProductItems([])
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const docWithVT = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<void>
      }
    }

    if (
      !prefersReducedMotion &&
      typeof docWithVT.startViewTransition === 'function'
    ) {
      document.documentElement.classList.add('crm-vt-active')
      const transition = docWithVT.startViewTransition(() => {
        flushSync(applyNavigation)
      })
      void transition.finished.finally(() => {
        document.documentElement.classList.remove('crm-vt-active')
      })
      return
    }

    applyNavigation()
  }

  if (!authReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="crm-app-canvas flex min-h-screen items-center justify-center p-6"
      >
        <span className="sr-only">Verificando sessão...</span>
        <div className="glass flex w-full max-w-sm flex-col items-center rounded-[var(--radius-xl)] p-8 text-center">
          <img
            src="/brand/lead-flow-icon.svg"
            alt=""
            aria-hidden="true"
            className="h-11 w-11"
          />
          <Skeleton className="mt-5 h-5 w-40" />
          <Skeleton className="mt-2.5 h-3.5 w-56" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <AuthScreen
        authMode={authMode}
        authEmail={authEmail}
        authPassword={authPassword}
        error={error}
        notice={notice}
        saving={authSaving}
        theme={theme}
        onToggleTheme={toggleTheme}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuth}
        onToggleMode={() => {
          setAuthMode((mode) => mode === 'login' ? 'signup' : 'login')
          setError('')
          setNotice('')
        }}
      />
    )
  }

  const isAnySaving =
    saving || contactSaving || companySaving || inventorySaving

  return (
    <div className="crm-app-canvas min-h-screen text-[var(--color-text-primary)]">
      <FeedbackMessages
        error={showForm ? '' : error}
        notice={notice}
        onDismissError={() => setError('')}
        onDismissNotice={() => setNotice('')}
      />

      <Sidebar
        leadsCount={leadsTotalCount}
        contactsCount={contacts.length}
        companiesCount={companies.length}
        userEmail={session.user.email}
        activeSection={activeSection}
        onNavigate={handleNavigateSection}
        onLogout={handleLogoutAndReset}
      />

      <main
        id="dashboard"
        className="min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:ml-64 lg:pb-0"
      >
        <header
          className={`crm-topbar sticky top-0 z-20 ${
            isScrolled ? 'crm-topbar--scrolled' : ''
          }`}
        >
          {isAnySaving && (
            <div
              role="progressbar"
              aria-label="Salvando alterações"
              className="crm-top-progress"
            />
          )}
          <div className="crm-topbar-inner">
            <div className="flex min-w-0 items-center gap-[var(--space-3)]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] lg:hidden">
                <img
                  src="/brand/lead-flow-icon.svg"
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6"
                />
              </span>
              <h1 className="truncate text-[length:var(--text-lg)] font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)] sm:text-[length:var(--text-xl)]">
                {getSectionTitle(activeSection)}
              </h1>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-[var(--space-2)] sm:gap-[var(--space-3)]">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
                title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
                className="crm-secondary-button px-3"
              >
                {theme === 'dark' ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                </span>
              </button>

              {activeSection === 'leads' && (
                <button
                  type="button"
                  onClick={() => {
                    setLeadProductItems([])
                    if (showForm) {
                      cancelForm()
                    } else {
                      startNewLead()
                    }
                    setError('')
                    setNotice('')
                  }}
                  className="crm-primary-button shrink-0"
                >
                  {showForm ? 'Cancelar' : '+ Novo lead'}
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleLogoutAndReset()}
                aria-label="Sair da conta"
                title="Sair da conta"
                className="crm-secondary-button px-3 lg:hidden"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17l5-5-5-5M15 12H3" />
                  <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <Suspense fallback={<ModulePageSkeleton />}>
          <div key={activeSection} className="crm-page-transition">
            {activeSection === 'contacts' ? (
              <ContactsPage
                contacts={contacts}
                leads={leads}
                loading={contactsLoading}
                saving={contactSaving}
                onSave={saveContact}
                onError={setError}
                onNotice={setNotice}
              />
            ) : activeSection === 'companies' ? (
              <CompaniesPage
                companies={companies}
                loading={companiesLoading}
                saving={companySaving}
                onSave={saveCompany}
                onError={setError}
                onNotice={setNotice}
              />
            ) : activeSection === 'inventory' ? (
              <InventoryPage
                products={inventoryProducts}
                movements={inventoryMovements}
                loading={inventoryLoading}
                saving={inventorySaving}
                onSaveProduct={saveProduct}
                onRegisterMovement={registerMovement}
                onReverseMovement={reverseMovement}
                onError={setError}
                onNotice={setNotice}
              />
            ) : activeSection === 'overview' ? (
              <OverviewPage
                leads={leads}
                contactsCount={contacts.length}
                companiesCount={companies.length}
                loading={loading || contactsLoading || companiesLoading}
                onOpenLeads={() => handleNavigateSection('leads')}
              />
            ) : (
              <LeadsPage
                leads={leads}
                filteredLeads={filteredLeads}
                totalCount={leadsTotalCount}
                page={leadsPage}
                totalPages={leadsTotalPages}
                loading={loading}
                saving={saving}
                search={search}
                stageFilter={stageFilter}
                form={form}
                showForm={showForm}
                editingLeadId={editingLeadId}
                products={inventoryProducts}
                productItems={leadProductItems}
                productsLoading={leadProductsLoading}
                productsError={leadProductsError}
                error={error}
                onSearchChange={setSearch}
                onStageFilterChange={setStageFilter}
                onFormChange={setForm}
                onSubmit={handleCreateLead}
                onCreateLead={() => {
                  setLeadProductItems([])
                  startNewLead()
                  setError('')
                  setNotice('')
                }}
                onCancelForm={() => {
                  setLeadProductItems([])
                  cancelForm()
                }}
                onQuantityChange={setProductQuantity}
                onEditLead={handleEditLead}
                onStageChange={handleLeadStageChange}
                onClearFilters={resetFilters}
                onPageChange={setLeadsPage}
                onSelectStage={(stage) => {
                  setStageFilter((current) =>
                    current === stage ? 'Todas' : stage,
                  )
                  const prefersReducedMotion = window.matchMedia(
                    '(prefers-reduced-motion: reduce)',
                  ).matches
                  document.getElementById('leads')?.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                  })
                }}
              />
            )}
          </div>
        </Suspense>
      </main>

      <MobileNavigation
        activeSection={activeSection}
        onNavigate={handleNavigateSection}
      />
    </div>
  )
}

export default App
