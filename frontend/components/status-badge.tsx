import React from 'react';

type BadgeType = 'success' | 'warning' | 'danger' | 'info';

interface StatusBadgeProps {
  label: string;
  type: BadgeType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type }) => {
  const styles = {
    success: 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20',
    warning: 'bg-[#BA7517]/10 text-[#BA7517] border-[#BA7517]/20',
    danger: 'bg-[#A32D2D]/10 text-[#A32D2D] border-[#A32D2D]/20',
    info: 'bg-[#185FA5]/10 text-[#185FA5] border-[#185FA5]/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${styles[type]} transition-colors duration-150`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {label}
    </span>
  );
};
