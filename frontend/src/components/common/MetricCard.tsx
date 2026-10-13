import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  trend,
}) => {
  return (
    <div className="group relative bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm hover:shadow-warm-xl hover:-translate-y-1.5 hover:scale-[1.02] hover:border-[#A66B38] transition-all duration-300 ease-out cursor-default overflow-hidden">
      {/* Top subtle glowing accent bar on hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#A66B38] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#7A624E] tracking-wider uppercase group-hover:text-[#5B3925] transition-colors duration-200">
          {title}
        </span>
        {/* Icon box with color change + icon zoom & rotate */}
        <div className="p-2.5 bg-[#F3E8D7] group-hover:bg-[#5B3925] rounded-xl text-[#5B3925] group-hover:text-[#FFF9F0] shadow-sm transition-all duration-300">
          <Icon className="w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-extrabold text-[#382719] group-hover:text-[#5B3925] transition-colors duration-200">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-[#7A624E]">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-[#7A624E]">{subtitle}</span>}
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-full transition-all duration-200 group-hover:scale-105 shadow-sm ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 group-hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border border-amber-200/60 group-hover:bg-amber-100'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
