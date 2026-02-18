import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { NotificationLog, NotificationSendRequest } from '../../types';
import toast from 'react-hot-toast';

export const NotificationLogs: React.FC = () => {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOwnerId, setFilterOwnerId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<NotificationSendRequest>({ owner_id: 0, channel: 'sms', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchLogs = async () => {
        try {
            const params: any = {};
            if (filterOwnerId) params.owner_id = parseInt(filterOwnerId);
            const res = await api.get('/notifications/logs', { params });
            setLogs(res.data);
        } catch (err) {
            toast.error('Failed to load notification logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/notifications/send', form);
            toast.success('Notification sent');
            setShowModal(false);
            setForm({ owner_id: 0, channel: 'sms', message: '' });
            fetchLogs();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to send notification');
        } finally {
            setSubmitting(false);
        }
    };

    const channelBadge = (channel: string) => {
        const colors: Record<string, string> = {
            sms: 'bg-blue-100 text-blue-700',
            whatsapp: 'bg-emerald-100 text-emerald-700',
            email: 'bg-purple-100 text-purple-700',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[channel] || 'bg-slate-100 text-slate-600'}`}>{channel}</span>;
    };

    const statusBadge = (status: string) => {
        const color = status === 'sent' ? 'bg-emerald-100 text-emerald-700' : status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>{status}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Notification Logs</h2>
                <Button onClick={() => setShowModal(true)} variant="primary" size="sm"><Send size={16} className="mr-1" /> Send Notification</Button>
            </div>

            <Card>
                <div className="flex items-center gap-4">
                    <input value={filterOwnerId} onChange={e => setFilterOwnerId(e.target.value)} placeholder="Filter by Owner ID" className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 w-48" />
                    <Button onClick={fetchLogs} variant="outline" size="sm">Filter</Button>
                </div>
            </Card>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Owner ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Channel</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Message</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Sent At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{log.owner_id}</td>
                                    <td className="p-4">{channelBadge(log.channel)}</td>
                                    <td className="p-4 text-sm text-slate-600 max-w-xs truncate">{log.message}</td>
                                    <td className="p-4">{statusBadge(log.status)}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(log.sent_at).toLocaleString()}</td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No notifications sent yet 🔔</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Send Notification</h3>
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Owner ID</label>
                                <input type="number" value={form.owner_id || ''} onChange={e => setForm({ ...form, owner_id: parseInt(e.target.value) || 0 })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Channel</label>
                                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                    <option value="sms">SMS</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Appointment ID (optional)</label>
                                <input type="number" value={form.appointment_id || ''} onChange={e => setForm({ ...form, appointment_id: parseInt(e.target.value) || undefined })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Message</label>
                                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={3} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Send</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
