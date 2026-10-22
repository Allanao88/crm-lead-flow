import type { CrmSection } from './Sidebar'

type MobileNavigationProps = {
  activeSection: CrmSection
  onNavigate: (section: CrmSection) => void
}

const navigationItems: { id: CrmSection; label: string }[] = [
  { id: 'overview', label: 'Início' },
  { id: 'leads', label: 'Leads' },
  { id: 'contacts', label: 'Contatos' },
  { id: 'companies', label: 'Empresas' },
  { id: 'inventory', label: 'Estoque' },
]

const icons: Record<CrmSection, React.ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" /><rect x="14" y="10" width="7" height="11" rx="1.5" /><rect x="3" y="13" width="7" height="8" rx="1.5" /></>,
  leads: <><circle cx="9" cy="8" r="3.5" /><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3a4.5 4.5 0 0 1 4.5 4.5V20M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.2a4.5 4.5 0 0 1 3 4.3V20" /></>,
  contacts: <><rect x="3" y="5" width="18" height="15" rx="2.5" /><circle cx="9" cy="11" r="2.2" /><path d="M5.5 17a3.5 3.5 0 0 1 7 0M15 10h3M15 14h3" /></>,
  companies: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 7h2M14 7h1M9 11h2M14 11h1M9 15h2M14 15h1M10 21v-3h4v3" /></>,
  inventory: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5M12 13v4" /></>,
}

export default function MobileNavigation({
  activeSection,
  onNavigate,
}: MobileNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] lg:hidden"
    >
      <div className="grid grid-cols-5">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--color-brand)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {icons[item.id]}
              </svg>
              <span className="leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[var(--color-brand)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
