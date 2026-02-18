import React, { useEffect, useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Service } from '../../types';
import toast from 'react-hot-toast';

export const ServicesManagement: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [form, setForm] = useState({ name: '', category: '', price: '' });
    const [editForm, setEditForm] = useState({ name: '', category: '', price: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchServices = async () => {
        try {
            const res = await api.get('/billing/services');
            setServices(res.data);
        } catch (err) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchServices(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/billing/services', { name: form.name, category: form.category || null, price: parseFloat(form.price) });
            toast.success('Service created');
            setShowModal(false);
            setForm({ name: '', category: '', price: '' });
            fetchServices();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create service');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService) return;
        setSubmitting(true);
        try {
            await api.patch(`/billing/services/${editingService.id}`, {
                name: editForm.name || undefined,
                category: editForm.category || undefined,
                price: editForm.price ? parseFloat(editForm.price) : undefined,
            });
            toast.success('Service updated');
            setEditingService(null);
            fetchServices();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update service');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (id: number, currentActive: boolean) => {
        try {
            await api.patch(`/billing/services/${id}`, { is_active: !currentActive });
            toast.success(`Service ${!currentActive ? 'activated' : 'deactivated'}`);
            fetchServices();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Services Management</h2>
                <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
                    <Plus size={16} className="mr-1" /> Add Service
                </Button>
            </div>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Name</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Category</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Price (₹)</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{s.name}</td>
                                    <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{s.category || '-'}</span></td>
                                    <td className="p-4"><span className="font-medium text-slate-700">₹{Number(s.price).toLocaleString()}</span></td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setEditingService(s); setEditForm({ name: s.name, category: s.category || '', price: String(s.price) }); }} className="text-slate-400 hover:text-primary transition-colors" title="Edit Service">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => toggleActive(s.id, s.is_active)} className="text-slate-400 hover:text-primary transition-colors">
                                                {s.is_active ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No services found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Add Service Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Add Service</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Service Name</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. consultation, surgery" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Price (₹)</label>
                                <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Service Modal */}
            {editingService && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingService(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Edit Service</h3>
                        <form onSubmit={handleEditService} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Service Name</label>
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} placeholder="e.g. consultation, surgery" className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Price (₹)</label>
                                <input type="number" step="0.01" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingService(null)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
