import type { InventoryMovement } from "./types";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const quantityFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 3,
});

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

type InventoryMovementsTableProps = {
  movements: InventoryMovement[];
  loading: boolean;
  saving: boolean;
  onReverse: (movement: InventoryMovement) => void;
};

export default function InventoryMovementsTable({
  movements,
  loading,
  saving,
  onReverse,
}: InventoryMovementsTableProps) {
  return (
    <div className="crm-table-container">
      <table className="crm-table min-w-[950px]">
        <thead>
          <tr>
            <th className="px-5 py-3 font-semibold">Data</th>
            <th className="px-5 py-3 font-semibold">Produto</th>
            <th className="px-5 py-3 font-semibold">Tipo</th>
            <th className="px-5 py-3 text-right font-semibold">Quantidade</th>
            <th className="px-5 py-3 text-right font-semibold">
              Custo unitário
            </th>
            <th className="px-5 py-3 text-right font-semibold">Custo total</th>
            <th className="px-5 py-3 font-semibold">Motivo</th>
            <th className="px-5 py-3 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                Carregando movimentações...
              </td>
            </tr>
          ) : movements.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                Nenhuma movimentação registrada.
              </td>
            </tr>
          ) : (
            movements.map((movement) => {
              const isReversal = movement.movement_type.startsWith("reversal_");
              const isEntry =
                movement.movement_type === "entry" ||
                movement.movement_type === "reversal_exit";
              const typeLabel = isReversal
                ? isEntry
                  ? "Estorno de saída"
                  : "Estorno de entrada"
                : movement.movement_type === "entry"
                  ? "Entrada"
                  : "Saída";

              return (
                <tr key={movement.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                    {dateFormat.format(new Date(movement.created_at))}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {movement.product?.name ??
                      `Produto #${movement.product_id}`}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isEntry
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {typeLabel}
                    </span>
                    {movement.lead_id !== null && (
                      <p className="mt-1 text-xs text-slate-500">
                        Lead #{movement.lead_id}
                      </p>
                    )}
                  </td>
                  <td
                    className={`px-5 py-4 text-right tabular-nums ${
                      movement.quantity_delta < 0
                        ? "text-rose-600"
                        : "text-emerald-700"
                    }`}
                  >
                    {movement.quantity_delta > 0 ? "+" : ""}
                    {quantityFormat.format(movement.quantity_delta)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {currency.format(movement.unit_cost)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                    {currency.format(movement.total_cost)}
                  </td>
                  <td className="max-w-xs px-5 py-4 text-slate-600">
                    <p className="truncate" title={movement.reason}>
                      {movement.reason || "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!isReversal && (
                      <button
                        type="button"
                        onClick={() => onReverse(movement)}
                        disabled={saving}
                        className="font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] disabled:opacity-50"
                      >
                        Estornar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
