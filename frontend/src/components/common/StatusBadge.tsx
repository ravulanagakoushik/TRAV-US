import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority' | 'risk';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const getBadgeStyle = () => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'completed':
      case 'low':
        return 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
      case 'active':
      case 'in_transit':
      case 'normal':
        return 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]';
      case 'pending':
      case 'high':
      case 'medium':
        return 'bg-[#FEF3D6] text-[#C67D0A] border-[#FFE082]';
      case 'urgent':
      case 'unavailable':
      case 'maintenance':
      case 'cancelled':
        return 'bg-[#FFEBEE] text-[#B71C1C] border-[#FFCDD2]';
      default:
        return 'bg-[#F3E8D7] text-[#5B3925] border-[#E2D1BC]';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};
