import React, { useEffect, useState } from 'react';
import { FileText, Clock, Search, PawPrint, User, Stethoscope, Pencil, X, Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { MedicalRecord } from '../../types';
import toast from 'react-hot-toast';

export const MedicalRecords: React.FC = () => {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ diagnosis: '', symptoms: '', treatment: '', prescription: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/doctor/medical-records')
            .then(res => setRecords(res.data))
            .catch(() => toast.error('Failed to load medical records'))
            .finally(() => setLoading(false));
    }, []);

    const startEdit = (rec: MedicalRecord) => {
        setEditingId(rec.id);
        setEditForm({
            diagnosis: rec.diagnosis || '',
            symptoms: rec.symptoms || '',
            treatment: rec.treatment || '',
            prescription: rec.prescription || '',
            notes: rec.notes || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        if (!editForm.diagnosis.trim()) {
            toast.error('Diagnosis is required');
            return;
        }
        setSaving(true);
        try {
            const res = await api.put(`/doctor/medical-records/${editingId}`, {
                diagnosis: editForm.diagnosis,
                symptoms: editForm.symptoms || null,
                treatment: editForm.treatment || null,
                prescription: editForm.prescription || null,
                notes: editForm.notes || null,
            });
            setRecords(prev => prev.map(r => r.id === editingId ? res.data : r));
            setEditingId(null);
            toast.success('Record updated successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update record');
        } finally {
            setSaving(false);
        }
    };

    const filtered = records.filter(rec => {
        const term = searchTerm.toLowerCase();
        return (
            !term ||
            rec.diagnosis.toLowerCase().includes(term) ||
            (rec.pet_name && rec.pet_name.toLowerCase().includes(term)) ||
            (rec.owner_name && rec.owner_name.toLowerCase().includes(term)) ||
            (rec.doctor_name && rec.doctor_name.toLowerCase().includes(term))
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Medical Records</h2>
                <span className="text-sm text-slate-500">{records.length} total record{records.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Search */}
            <Card>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search by pet name, owner, diagnosis..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </Card>

            {/* Records List */}
            {filtered.length === 0 ? (
                <Card>
                    <p className="text-center text-slate-400 py-8">
                        {searchTerm ? 'No records match your search' : 'No medical records found'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(rec => (
                        <Card key={rec.id}>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-teal-50 text-primary flex-shrink-0">
                                    <FileText size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h4 className="font-heading font-semibold text-slate-800 text-base">
                                            {editingId === rec.id ? 'Editing Record' : rec.diagnosis}
                                        </h4>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                                <Clock size={12} />
                                                {rec.appointment_date || new Date(rec.created_at).toLocaleDateString()}
                                            </span>
                                            {editingId !== rec.id && (
                                                <button
                                                    onClick={() => startEdit(rec)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                                                    title="Edit record"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Context chips */}
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        {rec.pet_name && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                                                <PawPrint size={12} />
                                                {rec.pet_name}
                                                {rec.species && <span className="text-amber-500 font-normal">({rec.species})</span>}
                                            </span>
                                        )}
                                        {rec.owner_name && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                <User size={12} />
                                                {rec.owner_name}
                                            </span>
                                        )}
                                        {rec.doctor_name && (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700">
                                                <Stethoscope size={12} />
                                                {rec.doctor_name}
                                            </span>
                                        )}
                                    </div>

                                    {/* EDIT MODE */}
                                    {editingId === rec.id ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Diagnosis *</label>
                                                <textarea value={editForm.diagnosis} onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Symptoms</label>
                                                <textarea value={editForm.symptoms} onChange={e => setEditForm({ ...editForm, symptoms: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Treatment</label>
                                                <textarea value={editForm.treatment} onChange={e => setEditForm({ ...editForm, treatment: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescription</label>
                                                <textarea value={editForm.prescription} onChange={e => setEditForm({ ...editForm, prescription: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                                                <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <Button variant="outline" size="sm" onClick={cancelEdit}>
                                                    <X size={14} className="mr-1" /> Cancel
                                                </Button>
                                                <Button variant="primary" size="sm" onClick={saveEdit} isLoading={saving}>
                                                    <Save size={14} className="mr-1" /> Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* VIEW MODE */
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            {rec.symptoms && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Symptoms</p>
                                                    <p className="text-slate-700">{rec.symptoms}</p>
                                                </div>
                                            )}
                                            {rec.treatment && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Treatment</p>
                                                    <p className="text-slate-700">{rec.treatment}</p>
                                                </div>
                                            )}
                                            {rec.prescription && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prescription</p>
                                                    <p className="text-slate-700">{rec.prescription}</p>
                                                </div>
                                            )}
                                            {rec.notes && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                                                    <p className="text-slate-700">{rec.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
