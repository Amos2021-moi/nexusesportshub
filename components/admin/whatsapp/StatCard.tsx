"use client";

export default function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 shadow-xl backdrop-blur-xl transition-all duration-150 hover:border-white/[0.15]">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-r ${color} opacity-15 blur-3xl`} />
      <div className="relative">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg ring-1 ring-white/20`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tracking-tight text-white">{value}</p>
          <div className="mt-1 flex items-center justify-between border-t border-white/[0.05] pt-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
            {subtitle && <span className="text-[9px] font-medium text-gray-500">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
