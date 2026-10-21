type SidebarProps = {
  leadsCount: number;
  userEmail: string | undefined;
  onLogout: () => void;
}

export default function Sidebar({ leadsCount, userEmail, onLogout }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Cabeçalho / Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          L
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">LeadFlow</p>
          <p className="text-xs text-slate-500">CRM comercial</p>
        </div>
      </div>

      {/* Menu de Navegação */}
      <nav className="space-y-1 px-4 py-6">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          CRM
        </p>
        <a href="#leads" className="block rounded-lg bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700">
          ♙ &nbsp; Leads <span className="ml-1 rounded-md bg-white px-2 py-0.5 text-xs">{leadsCount}</span>
        </a>
        <a href="#pipeline" className="block rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
          ▥ &nbsp; Pipeline
        </a>
        <a href="#dashboard" className="block rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
          ▦ &nbsp; Visão geral
        </a>
      </nav>

      {/* Rodapé / Informações do Usuário */}
      <div className="mt-auto border-t border-slate-100 p-4">
        <p className="text-sm font-semibold text-slate-800">AKS - Tech</p>
        <p className="mt-1 break-all text-xs text-slate-500">{userEmail}</p>
        <button
          onClick={onLogout}
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  );
}