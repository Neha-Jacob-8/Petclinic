import React, { useEffect, useState } from 'react';
import { CheckCircle, Stethoscope, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const TodayAppointments: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetch = async () => {
        try {
            const res = await api.get('/doctor/appointments/today');
            setAppointments(res.data);
        } catch (err) {
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const markComplete = async (id: number) => {
        try {
            await api.patch(`/doctor/appointments/${id}/complete`);
            toast.success('Appointment marked as completed');
            fetch();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to complete');
        }
    };

    const statusStyles: Record<string, string> = {
        scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
        completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        cancelled: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">Today's Appointments</h2>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : appointments.length === 0 ? (
                <Card><p className="text-center text-slate-400 py-8">No appointments today</p></Card>
            ) : (
                <div className="space-y-4">
                    {appointments.map(appt => (
                        <Card key={appt.id}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-primary">{appt.appointment_time}</p>
                                    </div>
                                    <div className="border-l border-slate-200 pl-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[appt.status] || ''}`}>{appt.status}</span>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{appt.type}</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{appt.pet_name || `Pet #${appt.pet_id}`} • {appt.owner_name || `Owner #${appt.owner_id}`}</p>
                                        {appt.notes && <p className="text-sm text-slate-500 mt-1">📝 {appt.notes}</p>}
                                    </div>
                                </div>
                                {appt.status === 'scheduled' && (
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="primary" onClick={() => navigate(`/doctor/appointments/${appt.id}/record`)}>
                                            <Stethoscope size={14} className="mr-1" /> Add Record
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => markComplete(appt.id)}>
                                            <CheckCircle size={14} className="mr-1" /> Complete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
