import React, { useEffect, useState } from 'react';
import { Calendar, Users, PawPrint, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const ReceptionistDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/receptionist/appointments/today');
                setAppointments(res.data);
            } catch (err) {
                toast.error('Failed to load today\'s appointments');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const quickActions = [
        { label: 'Register Owner', icon: Users, path: '/receptionist/owners', color: 'bg-blue-500' },
        { label: 'New Appointment', icon: Calendar, path: '/receptionist/appointments', color: 'bg-teal-500' },
        { label: 'Create Invoice', icon: PawPrint, path: '/receptionist/billing', color: 'bg-amber-500' },
    ];

    return (
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map(action => (
                    <Card key={action.label} className="cursor-pointer hover:scale-105 transition-transform duration-200" >
                        <button onClick={() => navigate(action.path)} className="w-full text-left">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${action.color}`}><action.icon className="text-white w-6 h-6" /></div>
                                    <span className="font-heading font-semibold text-slate-800">{action.label}</span>
                                </div>
                                <ArrowRight size={18} className="text-slate-400" />
                            </div>
                        </button>
                    </Card>
                ))}
            </div>

            {/* Today's Appointments */}
            <div>
                <h3 className="text-lg font-heading font-semibold text-slate-800 mb-4">Today's Appointments ({appointments.length})</h3>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : appointments.length === 0 ? (
                    <Card><p className="text-center text-slate-400 py-8">No appointments today</p></Card>
                ) : (
                    <Card noPadding>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left p-4 text-sm font-semibold text-slate-500">Time</th>
                                    <th className="text-left p-4 text-sm font-semibold text-slate-500">Pet ID</th>
                                    <th className="text-left p-4 text-sm font-semibold text-slate-500">Owner ID</th>
                                    <th className="text-left p-4 text-sm font-semibold text-slate-500">Type</th>
                                    <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-medium text-primary">{a.appointment_time}</td>
                                        <td className="p-4 text-slate-700">{a.pet_id}</td>
                                        <td className="p-4 text-slate-700">{a.owner_id}</td>
                                        <td className="p-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{a.type}</span></td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>
        </div>
    );
};
