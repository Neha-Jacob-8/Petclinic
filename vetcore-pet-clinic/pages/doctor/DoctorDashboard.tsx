import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Stethoscope, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const DoctorDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/doctor/appointments/today');
                setAppointments(res.data);
            } catch (err) {
                toast.error('Failed to load today\'s appointments');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const scheduled = appointments.filter(a => a.status === 'scheduled');
    const completed = appointments.filter(a => a.status === 'completed');

    return (
        <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-teal-500"><Calendar className="text-white w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Today's Appointments</p>
                            <p className="text-2xl font-heading font-bold text-slate-800">{appointments.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-500"><Clock className="text-white w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Pending</p>
                            <p className="text-2xl font-heading font-bold text-slate-800">{scheduled.length}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500"><CheckCircle className="text-white w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Completed</p>
                            <p className="text-2xl font-heading font-bold text-slate-800">{completed.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Today's Appointments */}
            <div>
                <h3 className="text-lg font-heading font-semibold text-slate-800 mb-4">Today's Schedule</h3>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : appointments.length === 0 ? (
                    <Card><p className="text-center text-slate-400 py-8">No appointments scheduled for today 🎉</p></Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {appointments.map(appt => (
                            <Card key={appt.id} className={appt.status === 'completed' ? 'opacity-60' : ''}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : appt.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {appt.status}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 capitalize">{appt.type}</span>
                                        </div>
                                        <p className="text-sm text-slate-600"><span className="font-medium">Pet:</span> {appt.pet_name || `#${appt.pet_id}`}</p>
                                        <p className="text-sm text-slate-600"><span className="font-medium">Owner:</span> {appt.owner_name || `#${appt.owner_id}`}</p>
                                        <p className="text-sm text-slate-600"><span className="font-medium">Time:</span> {appt.appointment_time}</p>
                                        {appt.notes && <p className="text-sm text-slate-500 mt-1 italic">"{appt.notes}"</p>}
                                    </div>
                                    {appt.status === 'scheduled' && (
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" variant="primary" onClick={() => navigate(`/doctor/appointments/${appt.id}/record`)}>
                                                <Stethoscope size={14} className="mr-1" /> Record
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
