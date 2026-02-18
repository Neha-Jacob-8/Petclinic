import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Appointment } from '../../types';
import { Calendar, Clock, PawPrint, User } from 'lucide-react';
import toast from 'react-hot-toast';

export const MedicalRecordForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [form, setForm] = useState({
        diagnosis: '',
        symptoms: '',
        treatment: '',
        prescription: '',
        notes: '',
    });

    useEffect(() => {
        if (id) {
            api.get(`/doctor/appointments/${id}`)
                .then(res => setAppointment(res.data))
                .catch(() => { }); // silently fail — form still works with just "Appointment #id"
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.diagnosis.trim()) {
            toast.error('Diagnosis is required');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/doctor/appointments/${id}/medical-record`, {
                diagnosis: form.diagnosis,
                symptoms: form.symptoms || null,
                treatment: form.treatment || null,
                prescription: form.prescription || null,
                notes: form.notes || null,
            });
            toast.success('Medical record saved');
            navigate('/doctor/appointments');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to save record');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-heading font-bold text-slate-800">Create Medical Record</h2>
                <p className="text-sm text-slate-500 mt-1">Appointment #{id}</p>
            </div>

            {/* Appointment Context Card */}
            {appointment && (
                <Card>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <PawPrint size={16} className="text-primary" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Pet</p>
                                <p className="text-sm font-semibold text-slate-700">{appointment.pet_name || `#${appointment.pet_id}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Owner</p>
                                <p className="text-sm font-semibold text-slate-700">{appointment.owner_name || `#${appointment.owner_id}`}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Date</p>
                                <p className="text-sm font-semibold text-slate-700">{appointment.appointment_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Time</p>
                                <p className="text-sm font-semibold text-slate-700">{appointment.appointment_time}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Diagnosis *</label>
                        <textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} required rows={3} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Primary diagnosis..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Symptoms</label>
                        <textarea value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Observed symptoms..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Treatment</label>
                        <textarea value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Treatment administered..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Prescription</label>
                        <textarea value={form.prescription} onChange={e => setForm({ ...form, prescription: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Medications prescribed..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700">Additional Notes</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Follow-up instructions, etc..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Save Record</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
