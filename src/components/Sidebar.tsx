import type { ReactNode } from 'react'

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

const navIconPaths: Record<CrmSection, ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.75" />
      <rect x="13.5" y="3" width="7.5" height="4.5" rx="1.5" />
      <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="1.75" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.75" />
    </>
  ),
  leads: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.2a4.5 4.5 0 0 1 3 4.3V20" />
    </>
  ),
  contacts: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2.5" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" />
    </>
  ),
  companies: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7h2M14 7h1M9 11h2M14 11h1M9 15h2M14 15h1M10 21v-3h4v3" />
    </>
  ),
  inventory: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v4" />
    </>
  ),
}

export function NavIcon({ name, size = 20 }: { name: CrmSection; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {navIconPaths[name]}
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
    <aside className="crm-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col lg:flex">
      <div className="flex min-h-[4.5rem] shrink-0 items-center gap-[var(--space-3)] border-b border-[var(--glass-border)] px-[var(--space-6)]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] shadow-[var(--shadow-xs)]">
          <img
            src="/brand/lead-flow-icon.svg"
            alt=""
            aria-hidden="true"
            className="h-7 w-7 shrink-0"
          />
        </span>
        <div className="min-w-0">
          <p className="text-[length:var(--text-md)] font-[var(--font-weight-bold)] tracking-[var(--tracking-tight)] text-[var(--color-text-primary)]">
            LeadFlow
          </p>
          <p className="mt-0.5 text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-text-muted)]">
            CRM Comercial
          </p>
        </div>
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex-1 space-y-1.5 overflow-y-auto px-[var(--space-3)] py-[var(--space-6)]"
      >
        <p className="mb-[var(--space-2)] px-[var(--space-4)] text-[length:var(--text-2xs)] font-[var(--font-weight-bold)] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
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
              className={`crm-nav-pill group ${isActive ? 'crm-nav-pill--active' : ''}`}
            >
              <span
                className={
                  isActive
                    ? 'text-current'
                    : 'text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-brand)]'
                }
              >
                <NavIcon name={item.id} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={`min-w-6 rounded-full px-2 py-0.5 text-center text-[length:var(--text-2xs)] font-[var(--font-weight-semibold)] tabular-nums ${
                    isActive
                      ? 'bg-black/15 text-current'
                      : 'border border-[var(--glass-border)] bg-[var(--glass-bg-subtle)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-[var(--glass-border)] p-[var(--space-4)]">
        <div className="glass-subtle mb-[var(--space-3)] flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] p-[var(--space-3)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-brand-border)] bg-[var(--color-brand-soft)] text-[length:var(--text-sm)] font-[var(--font-weight-bold)] text-[var(--color-brand)]">
            {(userEmail?.trim().charAt(0) || 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[length:var(--text-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
              AKS - Tech
            </p>
            <p
              className="mt-0.5 truncate text-[length:var(--text-2xs)] text-[var(--color-text-muted)]"
              title={userEmail}
            >
              {userEmail}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[var(--target-primary)] w-full items-center gap-[var(--space-3)] rounded-full px-[var(--space-4)] text-left text-[length:var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-negative-text)]"
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
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
