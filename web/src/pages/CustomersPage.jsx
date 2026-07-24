import React, { useState } from 'react';
import { Search, ShieldCheck, Users } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import Drawer from '../components/common/Drawer';
import PageHeader from '../components/common/PageHeader';
import StatStrip from '../components/common/StatStrip';

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

function CustomerDetail({ customer }) {
  if (!customer) return null;
  const profile = customer.behavior_profile || {};
  return <div className="space-y-5"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-soc-muted">Customer profile</p><h3 className="mt-2 text-lg font-semibold text-soc-text">{customer.name || customer.full_name || customer.customer_id}</h3><p className="mt-1 font-mono text-xs text-soc-muted">{customer.customer_id}</p></div><dl className="grid gap-4 sm:grid-cols-2">{[['City', customer.city], ['Primary account', customer.primary_account], ['Annual salary', customer.annual_salary ? currency.format(Number(customer.annual_salary)) : undefined], ['Preferred login hours', profile.preferred_login_hours?.join(', ')]].map(([label, value]) => <div key={label} className="border-b border-soc-border pb-3"><dt className="text-[11px] font-medium uppercase tracking-[0.12em] text-soc-muted">{label}</dt><dd className="mt-1 font-mono text-xs text-soc-text">{value ?? '—'}</dd></div>)}</dl></div>;
}

export default function CustomersPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const columns = [
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'name', label: 'Name', render: (value, row) => value || row.full_name || '—' },
    { key: 'city', label: 'City' },
    { key: 'primary_account', label: 'Primary account' },
    { key: 'annual_salary', label: 'Annual salary', render: (value) => value ? currency.format(Number(value)) : '—' },
  ];

  return <div className="mx-auto flex max-w-[1600px] flex-col gap-6 pb-8"><PageHeader title="Customers" description="Search customer profiles and inspect the behavioral context behind fraud decisions." /><StatStrip items={[{ label: 'Customer records', value: result?.total ?? '—', detail: 'Available through the paginated customer index', tone: 'primary', icon: Users }, { label: 'Drill-down mode', value: 'Ready', detail: 'Select a row for behavioral context', tone: 'success', icon: ShieldCheck }]} /><section><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-soc-text">Customer index</h2><p className="mt-1 text-xs text-soc-muted">One page of records is held in the browser at a time.</p></div><label className="relative block"><span className="sr-only">Search customers</span><Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-soc-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" className="h-9 border border-soc-border bg-soc-bg py-2 pl-9 pr-3 text-xs text-soc-text placeholder:text-soc-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc-primary" /></label></div><DataTable endpoint="/customers" columns={columns} query={query} onRowClick={setSelectedCustomer} onResult={setResult} emptyLabel="No customer records match this search." /></section><Drawer isOpen={Boolean(selectedCustomer)} onClose={() => setSelectedCustomer(null)} title="Customer context"><CustomerDetail customer={selectedCustomer} /></Drawer></div>;
}
