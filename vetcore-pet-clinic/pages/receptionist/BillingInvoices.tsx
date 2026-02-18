import React, { useEffect, useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Invoice, Service, InvoiceItemInput } from '../../types';
import toast from 'react-hot-toast';

export const BillingInvoices: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<Invoice | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ appointment_id: '', owner_id: '', discount_pct: '0' });
    const [lineItems, setLineItems] = useState<InvoiceItemInput[]>([{ service_id: 0, quantity: 1 }]);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/billing/invoices');
            setInvoices(res.data);
        } catch (err) {
            toast.error('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/billing/services');
            setServices(res.data.filter((s: Service) => s.is_active));
        } catch (err) {
            console.error('Failed to load services');
        }
    };

    useEffect(() => { fetchInvoices(); fetchServices(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = lineItems.filter(i => i.service_id > 0);
        if (validItems.length === 0) { toast.error('Add at least one service'); return; }
        setSubmitting(true);
        try {
            await api.post('/billing/invoices', {
                appointment_id: parseInt(form.appointment_id),
                owner_id: parseInt(form.owner_id),
                items: validItems,
                discount_pct: parseFloat(form.discount_pct) || 0,
            });
            toast.success('Invoice created');
            setShowCreateModal(false);
            setForm({ appointment_id: '', owner_id: '', discount_pct: '0' });
            setLineItems([{ service_id: 0, quantity: 1 }]);
            fetchInvoices();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const fetchInvoiceDetail = async (id: number) => {
        try {
            const res = await api.get(`/billing/invoices/${id}`);
            setShowDetailModal(res.data);
        } catch (err) {
            toast.error('Failed to load invoice detail');
        }
    };

    const addLineItem = () => setLineItems([...lineItems, { service_id: 0, quantity: 1 }]);
    const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
    const updateLineItem = (i: number, field: keyof InvoiceItemInput, val: number) => {
        const updated = [...lineItems];
        updated[i] = { ...updated[i], [field]: val };
        setLineItems(updated);
    };

    const statusBadge = (s: string) => {
        const color = s === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>{s}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Billing & Invoices</h2>
                <Button onClick={() => setShowCreateModal(true)} variant="primary" size="sm"><Plus size={16} className="mr-1" /> Create Invoice</Button>
            </div>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Invoice #</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Owner</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Total (₹)</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Final (₹)</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Date</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">#{inv.id}</td>
                                    <td className="p-4 text-slate-600">{inv.owner_id}</td>
                                    <td className="p-4 text-slate-700">₹{Number(inv.total_amount).toLocaleString()}</td>
                                    <td className="p-4 font-semibold text-slate-800">₹{Number(inv.final_amount).toLocaleString()}</td>
                                    <td className="p-4">{statusBadge(inv.payment_status)}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <button onClick={() => fetchInvoiceDetail(inv.id)} className="text-primary hover:text-primary-light transition-colors"><Eye size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No invoices yet</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Create Invoice Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Create Invoice</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Appointment ID</label>
                                    <input type="number" value={form.appointment_id} onChange={e => setForm({ ...form, appointment_id: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Owner ID</label>
                                    <input type="number" value={form.owner_id} onChange={e => setForm({ ...form, owner_id: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Discount %</label>
                                <input type="number" min="0" max="100" value={form.discount_pct} onChange={e => setForm({ ...form, discount_pct: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-slate-700">Line Items</label>
                                    <button type="button" onClick={addLineItem} className="text-xs text-primary font-semibold hover:underline">+ Add Item</button>
                                </div>
                                <div className="space-y-3">
                                    {lineItems.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl">
                                            <select value={item.service_id} onChange={e => updateLineItem(i, 'service_id', parseInt(e.target.value))} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
                                                <option value={0}>Select service</option>
                                                {services.map(s => <option key={s.id} value={s.id}>{s.name} — ₹{Number(s.price)}</option>)}
                                            </select>
                                            <input type="number" min="1" value={item.quantity} onChange={e => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)} className="w-16 border border-slate-200 rounded-lg px-2 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-primary/20" />
                                            {lineItems.length > 1 && (
                                                <button type="button" onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Create Invoice</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-4">Invoice #{showDetailModal.id}</h3>
                        <div className="space-y-3 text-sm mb-4">
                            <div className="flex justify-between"><span className="text-slate-500">Owner ID:</span><span className="font-medium">{showDetailModal.owner_id}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Appointment ID:</span><span className="font-medium">{showDetailModal.appointment_id}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Status:</span>{statusBadge(showDetailModal.payment_status)}</div>
                            <div className="flex justify-between"><span className="text-slate-500">Payment Method:</span><span className="font-medium capitalize">{showDetailModal.payment_method || '-'}</span></div>
                            <hr />
                            {showDetailModal.items?.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>Service #{item.service_id} × {item.quantity}</span>
                                    <span className="font-medium">₹{Number(item.line_total).toLocaleString()}</span>
                                </div>
                            ))}
                            <hr />
                            <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span>₹{Number(showDetailModal.total_amount).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Discount:</span><span>{Number(showDetailModal.discount_pct)}%</span></div>
                            <div className="flex justify-between text-lg font-bold"><span>Final Amount:</span><span className="text-primary">₹{Number(showDetailModal.final_amount).toLocaleString()}</span></div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setShowDetailModal(null)}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
