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
    <div className="bg-[#FFF9F0] border border-[#E2D1BC] rounded-xl p-5 shadow-warm hover:shadow-warm-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#7A624E] tracking-wider uppercase">
          {title}
        </span>
        <div className="p-2.5 bg-[#F3E8D7] rounded-lg text-[#5B3925]">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-2xl lg:text-3xl font-extrabold text-[#382719]">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-[#7A624E]">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        {subtitle && <span className="text-[#7A624E]">{subtitle}</span>}
        {trend && (
          <span
            className={`font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
