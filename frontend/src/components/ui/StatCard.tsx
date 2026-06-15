import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-brand-600', iconBg = 'bg-brand-50', trend }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`${iconBg} ${iconColor} p-3 rounded-xl`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}
