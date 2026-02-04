
import React from 'react';

type StatusType = 'ANSWERED' | 'MISSED' | 'BUSY' | 'IVR_ONLY' | 'IVR_COMPLAINT' | 'TICKET';

interface StatusBadgeProps {
  status: string;
  type?: 'call' | 'ticket';
}

export default function StatusBadge({ status, type = 'call' }: StatusBadgeProps) {
  const getStyles = (s: string) => {
    switch (s) {
      case 'MISSED':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'ANSWERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IVR_COMPLAINT':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'TICKET':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
