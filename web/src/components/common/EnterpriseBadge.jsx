import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function EnterpriseBadge({ action, score, size = 'md' }) {
  let bg = 'bg-soc-success/10 border-soc-success/30 text-soc-success';
  let Icon = ShieldCheck;
  let label = 'ALLOW';

  if (action === 'BLOCK' || (score && score >= 75)) {
    bg = 'bg-soc-danger/15 border-soc-danger/40 text-soc-danger animate-pulse';
    Icon = ShieldAlert;
    label = 'BLOCK';
  } else if (action === 'CHALLENGE' || (score && score >= 50)) {
    bg = 'bg-soc-warning/15 border-soc-warning/40 text-soc-warning';
    Icon = AlertTriangle;
    label = 'CHALLENGE';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-mono font-bold border rounded',
    md: 'px-3 py-1 text-xs font-mono font-extrabold border rounded-md gap-1.5',
    lg: 'px-4 py-2 text-sm font-mono font-black border-2 rounded-lg gap-2 tracking-wider'
  };

  return (
    <span className={`inline-flex items-center justify-center ${bg} ${sizeClasses[size]}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 font-normal ml-1">({Math.round(score)})</span>
      )}
    </span>
  );
}

