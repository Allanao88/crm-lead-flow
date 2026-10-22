export type CrmSection = 'overview' | 'leads' | 'contacts' | 'companies' | 'inventory'

type SidebarProps = {
  leadsCount: number
  contactsCount?: number
  companiesCount?: number
  userEmail: string | undefined
  activeSection?: CrmSection
  onNavigate?: (section: CrmSection) => void
  onLogout: () => void
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" /><rect x="14" y="10" width="7" height="11" rx="1.5" /><rect x="3" y="13" width="7" height="8" rx="1.5" /></>,
    leads: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.2a4.5 4.5 0 0 1 3 4.3V20" /></>,
    contacts: <><rect x="3" y="5" width="18" height="15" rx="2.5" /><circle cx="9" cy="11" r="2.2" /><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" /></>,
    companies: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2M14 7h1M9 11h2M14 11h1M9 15h2M14 15h1M10 21v-3h4v3" /></>,
    inventory: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v4" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

export default function Sidebar({
  leadsCount,
  contactsCount = 0,
  companiesCount = 0,
  userEmail,
  activeSection = 'overview',
  onNavigate = () => {},
  onLogout,
}: SidebarProps) {
  const navigationItems: {
    id: CrmSection
    label: string
    count?: number
  }[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'leads', label: 'Leads', count: leadsCount },
    { id: 'contacts', label: 'Contatos', count: contactsCount },
    { id: 'companies', label: 'Empresas', count: companiesCount },
    { id: 'inventory', label: 'Estoque' },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-800/70 bg-[#111827] text-slate-300 lg:flex">
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/[0.08] px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-extrabold text-white shadow-lg shadow-indigo-950/30">
          L
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight text-white">LeadFlow</p>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400">
            CRM COMERCIAL
          </p>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto px-3 py-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          Workspace
        </p>

        {navigationItems.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-500/15 text-white'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
              }`}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-indigo-400" />
              )}
              <span className={isActive ? 'text-indigo-300' : 'text-slate-500 group-hover:text-slate-300'}>
                <NavIcon name={item.id} />
              </span>
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`min-w-6 rounded-md px-1.5 py-0.5 text-center text-[11px] tabular-nums ${
                    isActive
                      ? 'bg-indigo-400/15 font-semibold text-indigo-200'
                      : 'bg-white/[0.05] text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-white/[0.08] p-4">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-400/15 text-sm font-bold text-indigo-200">
            {(userEmail?.trim().charAt(0) || 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">AKS - Tech</p>
            <p className="mt-1 truncate text-[11px] text-slate-500" title={userEmail}>
              {userEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-xs font-medium text-slate-400 transition-colors hover:bg-red-400/10 hover:text-red-300"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
