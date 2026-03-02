import React, { useEffect, useState, useMemo } from 'react';
import { Plus, AlertTriangle, ArrowUpDown, Trash2, Clock, XCircle, Bell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { InventoryItem, InventoryLog, ExpiryAlertSummary } from '../../types';
import toast from 'react-hot-toast';

// ── Expiry helpers ──────────────────────────────────────────────────────────

const getDaysUntilExpiry = (expiry_date?: string): number | null => {
    if (!expiry_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiry_date);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

type ExpiryLevel = 'expired' | 'critical' | 'warning' | 'upcoming' | 'none';

const getExpiryLevel = (days: number | null): ExpiryLevel => {
    if (days === null) return 'none';
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    if (days <= 90) return 'upcoming';
    return 'none';
};

const rowBgMap: Record<ExpiryLevel, string> = {
    expired: 'bg-red-50/60',
    critical: 'bg-orange-50/50',
    warning: 'bg-amber-50/30',
    upcoming: 'bg-yellow-50/20',
    none: '',
};

// ── Sub-components ──────────────────────────────────────────────────────────

const ExpiryBadge: React.FC<{ expiry_date?: string }> = ({ expiry_date }) => {
    if (!expiry_date) return <span className="text-slate-400">—</span>;
    const days = getDaysUntilExpiry(expiry_date);
    const level = getExpiryLevel(days);

    const base = 'px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 w-fit';
    let badge: React.ReactNode = null;

    if (level === 'expired')
        badge = <span className={`${base} bg-red-200 text-red-700`}>EXPIRED {Math.abs(days!)}d ago</span>;
    else if (level === 'critical')
        badge = <span className={`${base} bg-orange-100 text-orange-700`}>⚠️ {days}d left</span>;
    else if (level === 'warning')
        badge = <span className={`${base} bg-amber-100 text-amber-700`}>{days}d left</span>;
    else if (level === 'upcoming')
        badge = <span className={`${base} bg-blue-100 text-blue-600`}>{days}d left</span>;

    return (
        <div className="flex flex-col">
            <span className="text-xs text-slate-600">{expiry_date}</span>
            {badge}
        </div>
    );
};

// ── Main Component ──────────────────────────────────────────────────────────

export const InventoryManagement: React.FC = () => {
    const [allItems, setAllItems] = useState<InventoryItem[]>([]);
    const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlertSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState<number | null>(null);
    const [showLogs, setShowLogs] = useState<number | null>(null);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', category: '', quantity: '0', unit: '', reorder_level: '10', expiry_date: '', cost_price: '' });
    const [stockForm, setStockForm] = useState({ change_qty: '', reason: '' });
    const [alertsToasted, setAlertsToasted] = useState(false);

    const fetchData = async () => {
        try {
            const [itemsRes, alertsRes] = await Promise.all([
                api.get('/inventory/items'),
                api.get('/inventory/expiry-alerts'),
            ]);
            setAllItems(itemsRes.data);
            setExpiryAlerts(alertsRes.data);
        } catch {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Toast notifications once on first successful load
    useEffect(() => {
        if (!expiryAlerts || alertsToasted) return;
        setAlertsToasted(true);
        if (expiryAlerts.expired.length > 0) {
            toast.error(`🚨 ${expiryAlerts.expired.length} item(s) have EXPIRED — immediate action required!`, { duration: 7000 });
        }
        if (expiryAlerts.critical.length > 0) {
            toast(`⚠️ ${expiryAlerts.critical.length} item(s) expiring within 7 days`, { icon: '🔴', duration: 6000 });
        }
        if (expiryAlerts.warning.length > 0 && expiryAlerts.expired.length === 0 && expiryAlerts.critical.length === 0) {
            toast(`${expiryAlerts.warning.length} item(s) expiring within 30 days`, { icon: '🟡', duration: 5000 });
        }
    }, [expiryAlerts]);

    // Client-side filtering (backend already sorts by expiry asc, nulls last)
    const displayedItems = useMemo(() => {
        if (!allItems.length) return [];
        switch (filter) {
            case 'medicine':
            case 'vaccine':
            case 'supply':
                return allItems.filter(i => i.category === filter);
            case 'low_stock':
                return allItems.filter(i => i.quantity <= i.reorder_level);
            case 'expiring': {
                const ids = new Set([
                    ...(expiryAlerts?.critical ?? []).map(i => i.id),
                    ...(expiryAlerts?.warning ?? []).map(i => i.id),
                    ...(expiryAlerts?.upcoming ?? []).map(i => i.id),
                ]);
                return allItems.filter(i => ids.has(i.id));
            }
            case 'expired': {
                const ids = new Set((expiryAlerts?.expired ?? []).map(i => i.id));
                return allItems.filter(i => ids.has(i.id));
            }
            default:
                return allItems;
        }
    }, [allItems, filter, expiryAlerts]);

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
            setAlertsToasted(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStockAdjust = async () => {
        if (!showStockModal) return;
        const qty = parseInt(stockForm.change_qty);
        if (!stockForm.change_qty || qty === 0 || isNaN(qty)) { toast.error('Change quantity cannot be zero'); return; }
        if (!stockForm.reason.trim()) { toast.error('Reason is required for stock changes'); return; }
        try {
            await api.post(`/inventory/items/${showStockModal}/stock`, { change_qty: qty, reason: stockForm.reason.trim() });
            toast.success('Stock adjusted');
            setShowStockModal(null);
            setStockForm({ change_qty: '', reason: '' });
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to adjust stock');
        }
    };

    const fetchLogs = async (itemId: number) => {
        try {
            const res = await api.get(`/inventory/items/${itemId}/logs`);
            setLogs(res.data);
            setShowLogs(itemId);
        } catch { toast.error('Failed to load logs'); }
    };

    const handleDelete = async (item: InventoryItem) => {
        if (!window.confirm(`Delete "${item.name}" and all its stock logs?`)) return;
        try {
            await api.delete(`/inventory/items/${item.id}`);
            toast.success(`"${item.name}" deleted`);
            setAlertsToasted(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to delete item');
        }
    };

    const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;

    const expiringSoonCount = (expiryAlerts?.critical.length ?? 0) + (expiryAlerts?.warning.length ?? 0) + (expiryAlerts?.upcoming.length ?? 0);
    const expiredCount = expiryAlerts?.expired.length ?? 0;

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'medicine', label: 'Medicines' },
        { key: 'vaccine', label: 'Vaccines' },
        { key: 'supply', label: 'Supplies' },
        { key: 'low_stock', label: '⚠️ Low Stock' },
        { key: 'expiring', label: '🕐 Expiring Soon', count: expiringSoonCount },
        { key: 'expired', label: '🚫 Expired', count: expiredCount },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Inventory Management</h2>
                <Button onClick={() => setShowAddModal(true)} variant="primary" size="sm">
                    <Plus size={16} className="mr-1" /> Add Item
                </Button>
            </div>

            {/* ── Alert Banners ── */}
            {expiryAlerts && expiryAlerts.expired.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
                    <XCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-red-800">🚨 {expiryAlerts.expired.length} item(s) have EXPIRED — remove or replace immediately</p>
                        <p className="text-xs text-red-600 mt-1">{expiryAlerts.expired.map(i => i.name).join(' · ')}</p>
                    </div>
                </div>
            )}

            {expiryAlerts && expiryAlerts.critical.length > 0 && (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-orange-600 mt-0.5 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-orange-800">⚠️ {expiryAlerts.critical.length} item(s) expiring within 7 days — critical</p>
                        <p className="text-xs text-orange-600 mt-1">{expiryAlerts.critical.map(i => `${i.name} (${i.days_until_expiry}d)`).join(' · ')}</p>
                    </div>
                </div>
            )}

            {expiryAlerts && expiryAlerts.warning.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 mt-0.5 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-amber-800">{expiryAlerts.warning.length} item(s) expiring within 30 days</p>
                        <p className="text-xs text-amber-700 mt-1">{expiryAlerts.warning.map(i => `${i.name} (${i.days_until_expiry}d)`).join(' · ')}</p>
                    </div>
                </div>
            )}

            {expiryAlerts && expiryAlerts.upcoming.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <Clock className="text-blue-500 mt-0.5 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-blue-800">{expiryAlerts.upcoming.length} item(s) expiring within 90 days — plan restocking</p>
                        <p className="text-xs text-blue-600 mt-1">{expiryAlerts.upcoming.map(i => `${i.name} (${i.days_until_expiry}d)`).join(' · ')}</p>
                    </div>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                            filter === f.key
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        {f.label}
                        {f.count !== undefined && f.count > 0 && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                filter === f.key
                                    ? 'bg-white/30 text-white'
                                    : f.key === 'expired'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-amber-100 text-amber-700'
                            }`}>{f.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Name</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Category</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Qty</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Unit</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Reorder</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Expiry</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedItems.map((item) => {
                                const days = getDaysUntilExpiry(item.expiry_date);
                                const level = getExpiryLevel(days);
                                const rowBg = level !== 'none' ? rowBgMap[level] : isLowStock(item) ? 'bg-red-50/30' : '';
                                return (
                                    <tr key={item.id} className={`border-b border-slate-50 hover:brightness-95 transition-all ${rowBg}`}>
                                        <td className="p-4 font-medium text-slate-800">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.name}
                                                {isLowStock(item) && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600">LOW</span>}
                                                {level === 'expired' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-700">EXPIRED</span>}
                                                {level === 'critical' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">CRITICAL</span>}
                                                {level === 'warning' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-600">EXPIRING</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{item.category || '—'}</span>
                                        </td>
                                        <td className={`p-4 font-semibold ${isLowStock(item) ? 'text-red-600' : 'text-slate-700'}`}>{item.quantity}</td>
                                        <td className="p-4 text-slate-600">{item.unit || '—'}</td>
                                        <td className="p-4 text-slate-600">{item.reorder_level}</td>
                                        <td className="p-4"><ExpiryBadge expiry_date={item.expiry_date} /></td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setShowStockModal(item.id); setStockForm({ change_qty: '', reason: '' }); }} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><ArrowUpDown size={14} /> Adjust</button>
                                                <button onClick={() => fetchLogs(item.id)} className="text-xs text-slate-500 font-semibold hover:underline">Logs</button>
                                                <button onClick={() => handleDelete(item)} className="text-xs text-red-400 hover:text-red-600 font-semibold hover:underline flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayedItems.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No items found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* ── Add Item Modal ── */}
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

            {/* ── Stock Adjust Modal ── */}
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

            {/* ── Logs Modal ── */}
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
