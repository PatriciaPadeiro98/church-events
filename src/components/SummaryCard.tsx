import { AlertTriangle } from 'lucide-react';

type SummaryCardProps = {
  label: string;
  value: string;
  warning?: boolean;
};

export const SummaryCard = ({
  label,
  value,
  warning = false,
}: SummaryCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
        </div>

        {warning && (
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle size={22} />
          </div>
        )}
      </div>
    </div>
  );
};