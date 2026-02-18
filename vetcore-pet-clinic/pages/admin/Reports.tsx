import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { InventoryItem } from '../../types';
import toast from 'react-hot-toast';

type Tab = 'revenue' | 'services' | 'appointments' | 'inventory';

export const Reports: React.FC = () => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [tab, setTab] = useState<Tab>('revenue');
    const [start, setStart] = useState(thirtyAgo);
    const [end, setEnd] = useState(today);
    const [loading, setLoading] = useState(false);

    // Revenue
    const [revenueData, setRevenueData] = useState<{ date: string; amount: number }[]>([]);
    const [revenueTotal, setRevenueTotal] = useState(0);

    // Services
    const [servicesData, setServicesData] = useState<{ service_name: string; count: number; revenue: number }[]>([]);

    // Appointments
    const [apptData, setApptData] = useState<{ total: number; completed: number; cancelled: number; walk_in: number; scheduled: number } | null>(null);

    // Inventory
    const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
    const [nearExpiry, setNearExpiry] = useState<InventoryItem[]>([]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            if (tab === 'revenue') {
                const res = await api.get(`/reports/revenue?start=${start}&end=${end}`);
                setRevenueData(res.data.data);
                setRevenueTotal(res.data.total);
            } else if (tab === 'services') {
                const res = await api.get(`/reports/services?start=${start}&end=${end}`);
                setServicesData(res.data);
            } else if (tab === 'appointments') {
                const res = await api.get(`/reports/appointments?start=${start}&end=${end}`);
                setApptData(res.data);
            } else if (tab === 'inventory') {
                const res = await api.get('/reports/inventory');
                setLowStock(res.data.low_stock);
                setNearExpiry(res.data.near_expiry);
            }
        } catch (err) {
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { fetchReport(); }, [tab]);

    const tabs: { key: Tab; label: string }[] = [
        { key: 'revenue', label: '💰 Revenue' },
        { key: 'services', label: '🏥 Services' },
        { key: 'appointments', label: '📅 Appointments' },
        { key: 'inventory', label: '📦 Inventory' },
    ];

    const PIE_COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">Reports & Analytics</h2>

            {/* Date range */}
            {tab !== 'inventory' && (
                <Card>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-600">From</label>
                            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-600">To</label>
                            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <Button onClick={fetchReport} variant="primary" size="sm">Generate</Button>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <>
                    {/* Revenue Tab */}
                    {tab === 'revenue' && (
                        <div className="space-y-6">
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-slate-500">Total Revenue</p>
                                    <p className="text-4xl font-heading font-bold text-slate-800">₹{revenueTotal.toLocaleString()}</p>
                                </div>
                            </Card>
                            <Card className="h-80">
                                {revenueData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={revenueData}>
                                            <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} /><stop offset="95%" stopColor="#0D9488" stopOpacity={0} /></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#rg)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <div className="flex items-center justify-center h-full text-slate-400">No revenue data for this period</div>}
                            </Card>
                        </div>
                    )}

                    {/* Services Tab */}
                    {tab === 'services' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card noPadding>
                                <table className="w-full">
                                    <thead><tr className="border-b border-slate-100">
                                        <th className="text-left p-4 text-sm font-semibold text-slate-500">Service</th>
                                        <th className="text-left p-4 text-sm font-semibold text-slate-500">Count</th>
                                        <th className="text-left p-4 text-sm font-semibold text-slate-500">Revenue (₹)</th>
                                    </tr></thead>
                                    <tbody>
                                        {servicesData.map((s, i) => (
                                            <tr key={i} className="border-b border-slate-50"><td className="p-4 font-medium">{s.service_name}</td><td className="p-4">{s.count}</td><td className="p-4">₹{Number(s.revenue).toLocaleString()}</td></tr>
                                        ))}
                                        {servicesData.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">No data</td></tr>}
                                    </tbody>
                                </table>
                            </Card>
                            <Card className="h-80">
                                {servicesData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={servicesData} layout="vertical" margin={{ left: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="service_name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: '#475569', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                            <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <div className="flex items-center justify-center h-full text-slate-400">No data</div>}
                            </Card>
                        </div>
                    )}

                    {/* Appointments Tab */}
                    {tab === 'appointments' && apptData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Total', value: apptData.total, color: 'text-slate-800' },
                                        { label: 'Completed', value: apptData.completed, color: 'text-emerald-600' },
                                        { label: 'Cancelled', value: apptData.cancelled, color: 'text-red-600' },
                                        { label: 'Walk-in', value: apptData.walk_in, color: 'text-amber-600' },
                                        { label: 'Scheduled', value: apptData.scheduled, color: 'text-blue-600' },
                                    ].map(s => (
                                        <div key={s.label} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">{s.label}</span>
                                            <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Completed', value: apptData.completed },
                                                { name: 'Scheduled', value: apptData.scheduled },
                                                { name: 'Cancelled', value: apptData.cancelled },
                                            ]}
                                            cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value"
                                        >
                                            {PIE_COLORS.slice(0, 3).map((c, i) => <Cell key={i} fill={c} />)}
                                        </Pie>
                                        <Tooltip /><Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </div>
                    )}

                    {/* Inventory Tab */}
                    {tab === 'inventory' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <h3 className="text-lg font-heading font-semibold text-slate-800 mb-4">⚠️ Low Stock ({lowStock.length})</h3>
                                {lowStock.length === 0 ? <p className="text-slate-400">All stock levels healthy ✅</p> : (
                                    <div className="space-y-2">{lowStock.map(i => (
                                        <div key={i.id} className="flex justify-between items-center border border-slate-100 rounded-xl p-3">
                                            <span className="font-medium text-slate-700">{i.name}</span>
                                            <span className="text-sm font-bold text-red-600">{i.quantity} / {i.reorder_level}</span>
                                        </div>
                                    ))}</div>
                                )}
                            </Card>
                            <Card>
                                <h3 className="text-lg font-heading font-semibold text-slate-800 mb-4">📅 Near Expiry ({nearExpiry.length})</h3>
                                {nearExpiry.length === 0 ? <p className="text-slate-400">No items expiring soon ✅</p> : (
                                    <div className="space-y-2">{nearExpiry.map(i => (
                                        <div key={i.id} className="flex justify-between items-center border border-slate-100 rounded-xl p-3">
                                            <span className="font-medium text-slate-700">{i.name}</span>
                                            <span className="text-sm font-bold text-amber-600">{i.expiry_date}</span>
                                        </div>
                                    ))}</div>
                                )}
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
