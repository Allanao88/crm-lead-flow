import type { InventoryProduct } from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const quantityFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

type InventoryProductsTableProps = {
  products: InventoryProduct[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (product: InventoryProduct) => void;
};

export default function InventoryProductsTable({
  products,
  loading,
  search,
  onSearchChange,
  onEdit,
}: InventoryProductsTableProps) {
  return (
    <>
      <div className="border-b border-slate-100 p-4 sm:px-6">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="crm-field sm:max-w-md"
          placeholder="Buscar por produto, SKU ou descrição..."
        />
      </div>

      <div className="crm-table-container">
        <table className="crm-table min-w-[850px]">
          <thead>
            <tr>
              <th className="px-5 py-3 font-semibold">Produto</th>
              <th className="px-5 py-3 font-semibold">SKU</th>
              <th className="px-5 py-3 text-right font-semibold">Saldo</th>
              <th className="px-5 py-3 text-right font-semibold">
                Custo médio
              </th>
              <th className="px-5 py-3 text-right font-semibold">
                Valor em estoque
              </th>
              <th className="px-5 py-3 font-semibold">Situação</th>
              <th className="px-5 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  Carregando estoque...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  {search
                    ? "Nenhum produto corresponde à busca."
                    : "Nenhum produto cadastrado. Comece adicionando um produto."}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">
                      {product.name}
                    </p>
                    {product.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {product.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {product.sku || "—"}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-900">
                    {quantityFormat.format(product.quantity_on_hand)}{" "}
                    {product.unit}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {currency.format(product.average_cost)}
                  </td>
                  <td className="px-5 py-4 text-right font-medium tabular-nums text-slate-900">
                    {currency.format(
                      product.quantity_on_hand * product.average_cost,
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        !product.is_active
                          ? "bg-slate-100 text-slate-500"
                          : product.quantity_on_hand <= 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {!product.is_active
                        ? "Inativo"
                        : product.quantity_on_hand <= 0
                          ? "Sem estoque"
                          : "Disponível"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)]"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
