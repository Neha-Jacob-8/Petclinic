import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Invoice } from '../../types';
import toast from 'react-hot-toast';

export const PaymentProcessing: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [payingId, setPayingId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');

    const fetchPending = async () => {
        try {
            const res = await api.get('/billing/invoices');
            setInvoices(res.data.filter((inv: Invoice) => inv.payment_status === 'pending'));
        } catch (err) {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const markPaid = async (id: number) => {
        try {
            await api.patch(`/billing/invoices/${id}/pay`, { payment_method: paymentMethod });
            toast.success('Invoice marked as paid');
            setPayingId(null);
            fetchPending();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to process payment');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">Pending Payments</h2>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : invoices.length === 0 ? (
                <Card><p className="text-center text-slate-400 py-8">All payments are up to date! ✅</p></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invoices.map(inv => (
                        <Card key={inv.id}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-heading font-semibold text-slate-800">Invoice #{inv.id}</h4>
                                    <p className="text-sm text-slate-500">Owner #{inv.owner_id} • Appt #{inv.appointment_id}</p>
                                    <p className="text-sm text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">₹{Number(inv.final_amount).toLocaleString()}</p>
                                    {Number(inv.discount_pct) > 0 && <p className="text-xs text-slate-400 line-through">₹{Number(inv.total_amount).toLocaleString()}</p>}
                                    {Number(inv.discount_pct) > 0 && <p className="text-xs text-emerald-600">{Number(inv.discount_pct)}% discount</p>}
                                </div>
                            </div>

                            {payingId === inv.id ? (
                                <div className="space-y-3 border-t border-slate-100 pt-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Payment Method</label>
                                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="upi">UPI</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setPayingId(null)}>Cancel</Button>
                                        <Button variant="primary" className="flex-1" onClick={() => markPaid(inv.id)}>
                                            <CreditCard size={14} className="mr-1" /> Confirm
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="primary" className="w-full" onClick={() => { setPayingId(inv.id); setPaymentMethod('cash'); }}>
                                    <CreditCard size={14} className="mr-1" /> Process Payment
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
