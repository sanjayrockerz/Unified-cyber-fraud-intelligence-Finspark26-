import React from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, Clock, XCircle, ArrowUpRight } from 'lucide-react';

export default function EnterpriseStatusBadge({ status, size = 'md' }) {
  const normStatus = String(status || '').toUpperCase();
  
  let label = status;
  let bg = 'bg-soc-panel/30 border-soc-border text-soc-muted';
  let Icon = null;
  let dotColor = null;

  switch (normStatus) {
    case 'CRITICAL':
      label = 'Critical';
      bg = 'bg-red-500/10 border-red-500/30 text-red-400';
      Icon = ShieldAlert;
      dotColor = 'bg-red-500';
      break;
    case 'HIGH':
      label = 'High';
      bg = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      Icon = AlertTriangle;
      dotColor = 'bg-orange-500';
      break;
    case 'MEDIUM':
      label = 'Medium';
      bg = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      Icon = AlertTriangle;
      dotColor = 'bg-yellow-500';
      break;
    case 'LOW':
      label = 'Low';
      bg = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      dotColor = 'bg-blue-500';
      break;
    case 'HEALTHY':
    case 'ONLINE':
      label = 'Healthy';
      bg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      Icon = ShieldCheck;
      dotColor = 'bg-emerald-500 animate-pulse';
      break;
    case 'OFFLINE':
      label = 'Offline';
      bg = 'bg-soc-dim/10 border-soc-dim/30 text-soc-dim';
      break;
    case 'INVESTIGATING':
    case 'IN_REVIEW':
      label = 'Investigating';
      bg = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      Icon = Clock;
      dotColor = 'bg-purple-500 animate-ping';
      break;
    case 'ESCALATED':
      label = 'Escalated';
      bg = 'bg-pink-500/10 border-pink-500/30 text-pink-400';
      Icon = ArrowUpRight;
      break;
    case 'RESOLVED':
    case 'ACTIVE_RESOLVED':
      label = 'Resolved';
      bg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400';
      Icon = ShieldCheck;
      break;
    case 'BLOCKED':
      label = 'Blocked';
      bg = 'bg-red-500/15 border-red-500/40 text-red-500';
      Icon = XCircle;
      break;
    case 'QUEUED':
    case 'ASSIGNED':
      label = normStatus.charAt(0) + normStatus.slice(1).toLowerCase();
      bg = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
      dotColor = 'bg-indigo-400';
      break;
    default:
      break;
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1 font-mono font-bold rounded border',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5 font-mono font-bold rounded border',
    md: 'px-2.5 py-1 text-xs gap-2 font-mono font-bold rounded-md border',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-mono font-extrabold rounded-lg border-2'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex items-center justify-center font-semibold leading-none shrink-0 ${bg} ${selectedSize}`}>
      {dotColor && (
        <span className="relative flex h-1.5 w-1.5 mr-0.5">
          {dotColor.includes('animate-') && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor.replace(' animate-pulse', '').replace(' animate-ping', '')}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor.split(' ')[0]}`} />
        </span>
      )}
      {Icon && <Icon className={size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
      <span>{label}</span>
    </span>
  );
}
