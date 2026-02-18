import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Appointment } from '../../types';
import toast from 'react-hot-toast';

export const AppointmentScheduler: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        owner_id: '', pet_id: '', appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '09:00', type: 'scheduled' as 'walk-in' | 'scheduled', notes: ''
    });

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/receptionist/appointments', { params: { appointment_date: dateFilter } });
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const fetchToday = async () => {
        setLoading(true);
        try {
            const res = await api.get('/receptionist/appointments/today');
            setAppointments(res.data);
            setDateFilter(new Date().toISOString().split('T')[0]);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchToday(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/receptionist/appointments', {
                owner_id: parseInt(form.owner_id),
                pet_id: parseInt(form.pet_id),
                appointment_date: form.appointment_date,
                appointment_time: form.appointment_time,
                type: form.type,
                notes: form.notes || null,
            });
            toast.success('Appointment created');
            setShowModal(false);
            setForm({ owner_id: '', pet_id: '', appointment_date: new Date().toISOString().split('T')[0], appointment_time: '09:00', type: 'scheduled', notes: '' });
            fetchAppointments();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const cancelAppt = async (id: number) => {
        try {
            await api.patch(`/receptionist/appointments/${id}`, { status: 'cancelled' });
            toast.success('Appointment cancelled');
            fetchAppointments();
        } catch (err) {
            toast.error('Failed to cancel');
        }
    };

    const statusStyles: Record<string, string> = {
        scheduled: 'bg-blue-100 text-blue-700',
        completed: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Appointments</h2>
                <Button onClick={() => setShowModal(true)} variant="primary" size="sm"><Plus size={16} className="mr-1" /> New Appointment</Button>
            </div>

            <Card>
                <div className="flex items-center gap-4 flex-wrap">
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    <Button onClick={fetchAppointments} variant="outline" size="sm">Filter</Button>
                    <Button onClick={fetchToday} variant="ghost" size="sm">Today</Button>
                </div>
            </Card>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Time</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Date</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Pet ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Owner ID</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Type</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Notes</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(a => (
                                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-primary">{a.appointment_time}</td>
                                    <td className="p-4 text-slate-600">{a.appointment_date}</td>
                                    <td className="p-4 text-slate-700">{a.pet_id}</td>
                                    <td className="p-4 text-slate-700">{a.owner_id}</td>
                                    <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{a.type}</span></td>
                                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[a.status] || ''}`}>{a.status}</span></td>
                                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{a.notes || '-'}</td>
                                    <td className="p-4">
                                        {a.status === 'scheduled' && (
                                            <button onClick={() => cancelAppt(a.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Cancel"><X size={16} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {appointments.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No appointments for this date</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">New Appointment</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Owner ID</label>
                                    <input type="number" value={form.owner_id} onChange={e => setForm({ ...form, owner_id: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Pet ID</label>
                                    <input type="number" value={form.pet_id} onChange={e => setForm({ ...form, pet_id: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Date</label>
                                    <input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Time</label>
                                    <input type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                    <option value="scheduled">Scheduled</option>
                                    <option value="walk-in">Walk-in</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
