import { NavIcon, type CrmSection } from './Sidebar'

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

export default function MobileNavigation({
  activeSection,
  onNavigate,
}: MobileNavigationProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="crm-mobile-nav fixed inset-x-0 bottom-0 z-30 lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1.5 py-1">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 py-1.5 text-[length:var(--text-2xs)] focus-visible:outline-offset-[-2px] ${
                isActive
                  ? 'font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]'
                  : 'font-[var(--font-weight-medium)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? 'bg-[var(--color-brand)] text-[var(--color-brand-text)] shadow-[var(--shadow-xs)]'
                    : 'text-current group-hover:bg-[var(--color-brand-soft)]'
                }`}
              >
                <NavIcon name={item.id} size={18} />
              </span>
              <span className="max-w-full truncate leading-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
