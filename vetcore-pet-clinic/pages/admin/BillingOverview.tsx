import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/axios';
import { Invoice } from '../../types';
import toast from 'react-hot-toast';

export const BillingOverview: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOwnerId, setFilterOwnerId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterOwnerId) params.owner_id = parseInt(filterOwnerId);
            if (filterDate) params.date = filterDate;
            const res = await api.get('/billing/invoices', { params });
            setInvoices(res.data);
        } catch (err) {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const statusBadge = (status: string) => {
        const color = status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">All Invoices</h2>

            <Card>
                <div className="flex items-center gap-4 flex-wrap">
                    <input value={filterOwnerId} onChange={e => setFilterOwnerId(e.target.value)} placeholder="Owner ID" className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-36" />
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    <button onClick={fetchInvoices} className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-light transition-colors">Search</button>
                </div>
            </Card>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Owner ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Appt ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Total (₹)</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Discount</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Final (₹)</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Method</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">#{inv.id}</td>
                                    <td className="p-4 text-slate-600">{inv.owner_id}</td>
                                    <td className="p-4 text-slate-600">{inv.appointment_id}</td>
                                    <td className="p-4 text-slate-700">₹{Number(inv.total_amount).toLocaleString()}</td>
                                    <td className="p-4 text-slate-600">{Number(inv.discount_pct)}%</td>
                                    <td className="p-4 font-semibold text-slate-800">₹{Number(inv.final_amount).toLocaleString()}</td>
                                    <td className="p-4">{statusBadge(inv.payment_status)}</td>
                                    <td className="p-4 text-slate-600 capitalize">{inv.payment_method || '-'}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr><td colSpan={9} className="p-8 text-center text-slate-400">No invoices found 💰</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
};
