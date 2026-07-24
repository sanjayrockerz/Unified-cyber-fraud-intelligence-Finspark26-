import React from 'react';

export default function PageHeader({ title, description, action = null, className = '' }) {
  return (
    <header className={`flex flex-col gap-3 border-b border-soc-border pb-5 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-soc-text sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-soc-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
