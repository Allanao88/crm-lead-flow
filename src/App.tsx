
import { lazy, Suspense, useState, type FormEvent } from 'react'

import AuthScreen from './components/AuthScreen'
import FeedbackMessages from './components/FeedbackMessages'
import { getSectionTitle } from './components/getSectionTitle'
import Sidebar, { type CrmSection } from './components/Sidebar'
import MobileNavigation from './components/MobileNavigation'

import { useAuth } from './features/auth/useAuth'
import { useCompanies } from './features/companies/useCompanies'
import { useContacts } from './features/contacts/useContacts'
import { useInventory } from './features/inventory/useInventory'
import { useLeadProducts } from './features/leads/useLeadProducts'
import LeadsPage from './features/leads/LeadsPage'
import { useLeadForm } from './features/leads/useLeadForm'
import type { Lead, Stage } from './features/leads/types'
import { useLeads } from './features/leads/useLeads'
import { useLeadFilters } from './features/leads/useLeadFilters'
import { useTheme } from './hooks/useTheme'

const CompaniesPage = lazy(() => import('./features/companies/CompaniesPage'))
const ContactsPage = lazy(() => import('./features/contacts/ContactsPage'))
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'))
const OverviewPage = lazy(() => import('./features/overview/OverviewPage'))

function App() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState<CrmSection>('overview')
  const { theme, toggleTheme } = useTheme()

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

  const { leads, loading, saving, saveLead, handleStageChange } = useLeads(
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


  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
        Verificando sessão...
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

  return (
    <div className="min-h-screen bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]">
      <Sidebar
        leadsCount={leads.length}
        contactsCount={contacts.length}
        companiesCount={companies.length}
        userEmail={session.user.email}
        activeSection={activeSection}
        onNavigate={(section: CrmSection) => {
          setActiveSection(section)
          setError('')
          setNotice('')
          if (section !== 'leads') {
            resetForm()
            setLeadProductItems([])
          }
        }}
        onLogout={handleLogoutAndReset}
      />

      <main id="dashboard" className="min-w-0 pb-24 lg:ml-64 lg:pb-0">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-8">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            {getSectionTitle(activeSection)}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
            >
              <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
              <span className="hidden sm:inline">{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
            </button>
            {activeSection === 'leads' && <button
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
          </button>}
          </div>
        </header>

        <Suspense
          fallback={
            <div className="p-8 text-center text-sm text-slate-500">
              Carregando módulo...
            </div>
          }
        >
        <div key={activeSection} className="crm-page-transition">
        {activeSection === 'contacts' ? (
          <>
            <FeedbackMessages error={error} notice={notice} />
            <ContactsPage
              contacts={contacts}
              leads={leads}
              loading={contactsLoading}
              saving={contactSaving}
              onSave={saveContact}
              onError={setError}
              onNotice={setNotice}
            />
          </>
        ) : activeSection === 'companies' ? (
          <>
            <FeedbackMessages error={error} notice={notice} />
            <CompaniesPage
              companies={companies}
              loading={companiesLoading}
              saving={companySaving}
              onSave={saveCompany}
              onError={setError}
              onNotice={setNotice}
            />
          </>
        ) : activeSection === 'inventory' ? (
          <>
            <FeedbackMessages error={error} notice={notice} />
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
          </>
        ) : activeSection === 'overview' ? (
          <>
            <FeedbackMessages error={error} notice={notice} />
            <OverviewPage
              leads={leads}
              contactsCount={contacts.length}
              companiesCount={companies.length}
              loading={loading || contactsLoading || companiesLoading}
              onOpenLeads={() => setActiveSection('leads')}
            />
          </>
        ) : (
          <LeadsPage
            leads={leads}
            filteredLeads={filteredLeads}
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
            notice={notice}
            onSearchChange={setSearch}
            onStageFilterChange={setStageFilter}
            onFormChange={setForm}
            onSubmit={handleCreateLead}
            onCancelForm={() => {
              setLeadProductItems([])
              cancelForm()
            }}
            onQuantityChange={setProductQuantity}
            onEditLead={handleEditLead}
            onStageChange={handleLeadStageChange}
            onClearFilters={resetFilters}
            onLogout={() => void handleLogoutAndReset()}
            onSelectStage={(stage) => {
              setStageFilter(stage)
              document.getElementById('leads')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        )}
        </div>
        </Suspense>
      </main>
      <MobileNavigation
        activeSection={activeSection}
        onNavigate={(section: CrmSection) => {
          setActiveSection(section)
          setError('')
          setNotice('')
          if (section !== 'leads') {
            resetForm()
            setLeadProductItems([])
          }
          window.scrollTo({ top: 0, behavior: 'auto' })
        }}
      />
    </div>
  )
}


export default App
