import React, { useEffect, useState } from 'react';
import { Plus, AlertTriangle, Package as PackageIcon, ArrowUpDown, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { InventoryItem, InventoryLog } from '../../types';
import toast from 'react-hot-toast';

export const InventoryManagement: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [expiring, setExpiring] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState<number | null>(null);
    const [showLogs, setShowLogs] = useState<number | null>(null);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', category: '', quantity: '0', unit: '', reorder_level: '10', expiry_date: '', cost_price: '' });
    const [stockForm, setStockForm] = useState({ change_qty: '', reason: '' });

    const fetchItems = async () => {
        try {
            const params: any = {};
            if (filter === 'low_stock') params.low_stock = true;
            if (['medicine', 'vaccine', 'supply'].includes(filter)) params.category = filter;
            const [itemsRes, expiringRes] = await Promise.all([
                api.get('/inventory/items', { params }),
                api.get('/inventory/expiring?days=30'),
            ]);
            setItems(itemsRes.data);
            setExpiring(expiringRes.data);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, [filter]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/inventory/items', {
                name: addForm.name,
                category: addForm.category || null,
                quantity: parseInt(addForm.quantity),
                unit: addForm.unit || null,
                reorder_level: parseInt(addForm.reorder_level),
                expiry_date: addForm.expiry_date || null,
                cost_price: addForm.cost_price ? parseFloat(addForm.cost_price) : null,
            });
            toast.success('Item added');
            setShowAddModal(false);
            setAddForm({ name: '', category: '', quantity: '0', unit: '', reorder_level: '10', expiry_date: '', cost_price: '' });
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStockAdjust = async () => {
        if (!showStockModal) return;
        const qty = parseInt(stockForm.change_qty);
        if (!stockForm.change_qty || qty === 0 || isNaN(qty)) {
            toast.error('Change quantity cannot be zero');
            return;
        }
        if (!stockForm.reason.trim()) {
            toast.error('Reason is required for stock changes');
            return;
        }
        try {
            await api.post(`/inventory/items/${showStockModal}/stock`, {
                change_qty: qty,
                reason: stockForm.reason.trim(),
            });
            toast.success('Stock adjusted');
            setShowStockModal(null);
            setStockForm({ change_qty: '', reason: '' });
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to adjust stock');
        }
    };

    const fetchLogs = async (itemId: number) => {
        try {
            const res = await api.get(`/inventory/items/${itemId}/logs`);
            setLogs(res.data);
            setShowLogs(itemId);
        } catch (err) {
            toast.error('Failed to load logs');
        }
    };

    const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
    const isExpiringSoon = (item: InventoryItem) => expiring.some(e => e.id === item.id);

    const handleDelete = async (item: InventoryItem) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${item.name}"? This will also remove all stock logs for this item.`)) return;
        try {
            await api.delete(`/inventory/items/${item.id}`);
            toast.success(`"${item.name}" deleted`);
            fetchItems();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete item');
        }
    };

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'medicine', label: 'Medicines' },
        { key: 'vaccine', label: 'Vaccines' },
        { key: 'supply', label: 'Supplies' },
        { key: 'low_stock', label: '⚠️ Low Stock' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Inventory Management</h2>
                <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm"><Plus size={16} className="mr-1" /> Add Item</Button>
            </div>

            {expiring.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <span className="text-sm text-amber-800 font-medium">{expiring.length} item(s) expiring within 30 days</span>
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                        {f.label}
                    </button>
                ))}
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
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Qty</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Unit</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Reorder Level</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Expiry</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${isLowStock(item) ? 'bg-red-50/30' : ''}`}>
                                    <td className="p-4 font-medium text-slate-800">
                                        <div className="flex items-center gap-2">
                                            {item.name}
                                            {isLowStock(item) && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">LOW</span>}
                                            {isExpiringSoon(item) && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-600">EXPIRING</span>}
                                        </div>
                                    </td>
                                    <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{item.category || '-'}</span></td>
                                    <td className={`p-4 font-semibold ${isLowStock(item) ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</td>
                                    <td className="p-4 text-slate-600">{item.unit || '-'}</td>
                                    <td className="p-4 text-slate-600">{item.reorder_level}</td>
                                    <td className="p-4 text-slate-600">{item.expiry_date || '-'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => { setShowStockModal(item.id); setStockForm({ change_qty: '', reason: '' }); }} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><ArrowUpDown size={14} /> Adjust</button>
                                            <button onClick={() => fetchLogs(item.id)} className="text-xs text-slate-500 font-semibold hover:underline">Logs</button>
                                            <button onClick={() => handleDelete(item)} className="text-xs text-red-400 hover:text-red-600 font-semibold hover:underline flex items-center gap-1" title="Delete Item"><Trash2 size={14} /> Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No items found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Add Inventory Item</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Name</label>
                                <input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <select value={addForm.category} onChange={e => setAddForm({ ...addForm, category: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                        <option value="">Select</option>
                                        <option value="medicine">Medicine</option>
                                        <option value="vaccine">Vaccine</option>
                                        <option value="supply">Supply</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Unit</label>
                                    <input value={addForm.unit} onChange={e => setAddForm({ ...addForm, unit: e.target.value })} placeholder="tablets, vials..." className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                                    <input type="number" value={addForm.quantity} onChange={e => setAddForm({ ...addForm, quantity: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Reorder Level</label>
                                    <input type="number" value={addForm.reorder_level} onChange={e => setAddForm({ ...addForm, reorder_level: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                                    <input type="date" value={addForm.expiry_date} onChange={e => setAddForm({ ...addForm, expiry_date: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Cost Price (₹)</label>
                                    <input type="number" step="0.01" value={addForm.cost_price} onChange={e => setAddForm({ ...addForm, cost_price: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Add Item</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjust Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowStockModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-4">Adjust Stock</h3>
                        <p className="text-sm text-slate-500 mb-4">Positive number to add stock, negative to remove.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Change Quantity</label>
                                <input type="number" value={stockForm.change_qty} onChange={e => setStockForm({ ...stockForm, change_qty: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="+10 or -5" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Reason <span className="text-red-400">*</span></label>
                                <input value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Restocked, used, expired..." />
                                <p className="mt-1 text-xs text-slate-400">Required — explain why stock is being changed</p>
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowStockModal(null)}>Cancel</Button>
                                <Button variant="primary" className="flex-1" onClick={handleStockAdjust} disabled={!stockForm.change_qty || !stockForm.reason.trim()}>Adjust</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogs(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-4">Stock Change History</h3>
                        {logs.length === 0 ? (
                            <p className="text-slate-400 text-center py-6">No stock changes recorded</p>
                        ) : (
                            <div className="space-y-3">
                                {logs.map(log => (
                                    <div key={log.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <span className={`font-bold text-sm ${log.change_qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {log.change_qty > 0 ? '+' : ''}{log.change_qty}
                                            </span>
                                            {log.reason && <span className="text-sm text-slate-500 ml-2">— {log.reason}</span>}
                                        </div>
                                        <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" className="w-full mt-4" onClick={() => setShowLogs(null)}>Close</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
