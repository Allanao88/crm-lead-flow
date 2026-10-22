
import { lazy, Suspense, useState, type FormEvent } from 'react'

import AuthScreen from './components/AuthScreen'
import FeedbackMessages from './components/FeedbackMessages'
import { getSectionTitle } from './components/getSectionTitle'
import Sidebar, { type CrmSection } from './components/Sidebar'

import { useAuth } from './features/auth/useAuth'
import { useCompanies } from './features/companies/useCompanies'
import { useContacts } from './features/contacts/useContacts'
import { useInventory } from './features/inventory/useInventory'
import { useLeadProducts } from './features/leads/useLeadProducts'
import LeadsPage from './features/leads/LeadsPage'
import { useLeadForm } from './features/leads/useLeadForm'
import type { Lead } from './features/leads/types'
import { useLeads } from './features/leads/useLeads'
import { useLeadFilters } from './features/leads/useLeadFilters'

const CompaniesPage = lazy(() => import('./features/companies/CompaniesPage'))
const ContactsPage = lazy(() => import('./features/contacts/ContactsPage'))
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'))
const OverviewPage = lazy(() => import('./features/overview/OverviewPage'))

function App() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState<CrmSection>('overview')

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
    saveProduct,
    registerMovement,
    reverseMovement,
  } = useInventory(setError, setNotice)

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
    if (saved) setLeadProductItems([])
  }

  function handleEditLead(lead: Lead) {
    setLeadProductItems([])
    editLeadForm(lead)
  }


  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] text-slate-600">
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        leadsCount={leads.length}
        contactsCount={contacts.length}
        companiesCount={companies.length}
        userEmail={session.user.email}
        activeSection={activeSection}
        onNavigate={(section) => {
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

      <main id="dashboard" className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_1px_3px_rgb(15_23_42/3%)] backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-xs text-slate-500">AKS - Tech / CRM</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
{getSectionTitle(activeSection)}
            </h1>
          </div>
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
        </header>

        <Suspense
          fallback={
            <div className="p-8 text-center text-sm text-slate-500">
              Carregando módulo...
            </div>
          }
        >
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
            onStageChange={handleStageChange}
            onClearFilters={resetFilters}
            onLogout={() => void handleLogoutAndReset()}
            onSelectStage={(stage) => {
              setStageFilter(stage)
              document.getElementById('leads')?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        )}
        </Suspense>
      </main>
    </div>
  )
}


export default App
