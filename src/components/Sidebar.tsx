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
    icon: string
    count: number
  }[] = [
    {
      id: 'overview',
      label: 'Visão geral',
      icon: '▦',
      count: leadsCount,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: '♙',
      count: leadsCount,
    },
    {
      id: 'contacts',
      label: 'Contatos',
      icon: '♧',
      count: contactsCount,
    },
    {
      id: 'companies',
      label: 'Empresas',
      icon: '▤',
      count: companiesCount,
    },
    {
      id: 'inventory',
      label: 'Estoque',
      icon: '▦',
      count: 0,
    },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          L
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">LeadFlow</p>
          <p className="text-xs text-slate-500">CRM comercial</p>
        </div>
      </div>

      <nav className="space-y-1 px-4 py-6">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          CRM
        </p>

        {navigationItems.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm ${
                isActive
                  ? 'bg-indigo-50 font-semibold text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>
                {item.icon} &nbsp; {item.label}
              </span>
              <span
                className={`ml-2 rounded-md px-2 py-0.5 text-xs ${
                  isActive ? 'bg-white' : 'bg-slate-100'
                }`}
              >
                {item.count}
              </span>
            </button>
          )
        })}

      </nav>

      <div className="mt-auto border-t border-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-800">AKS - Tech</p>
        <p className="mt-1 break-all text-xs text-slate-500">{userEmail}</p>
        <button
          onClick={onLogout}
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
