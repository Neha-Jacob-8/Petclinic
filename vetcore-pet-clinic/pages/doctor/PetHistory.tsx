import React, { useState } from 'react';
import { Search, FileText, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { MedicalRecord } from '../../types';
import toast from 'react-hot-toast';

export const PetHistory: React.FC = () => {
    const [petId, setPetId] = useState('');
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const search = async () => {
        if (!petId.trim()) {
            toast.error('Please enter a Pet ID');
            return;
        }
        setLoading(true);
        setSearched(true);
        try {
            const res = await api.get(`/doctor/pets/${petId}/history`);
            setRecords(res.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                toast.error('Pet not found');
                setRecords([]);
            } else {
                toast.error('Failed to load history');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-heading font-bold text-slate-800">Pet Medical History</h2>

            <Card>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input value={petId} onChange={e => setPetId(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Enter Pet ID" className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                    </div>
                    <Button onClick={search} variant="primary" size="sm" isLoading={loading}>
                        <Search size={16} className="mr-1" /> Search
                    </Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : searched && records.length === 0 ? (
                <Card><p className="text-center text-slate-400 py-8">No medical records found for this pet</p></Card>
            ) : records.length > 0 ? (
                <div className="space-y-4">
                    {/* Summary header */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{records.length}</span> record{records.length !== 1 ? 's' : ''} for Pet #{petId}
                        </p>
                    </div>

                    {records.map(rec => (
                        <Card key={rec.id}>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-xl bg-teal-50 text-primary"><FileText size={20} /></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-heading font-semibold text-slate-800">{rec.diagnosis}</h4>
                                        <span className="flex items-center gap-1 text-xs text-slate-400"><Clock size={12} /> {new Date(rec.created_at).toLocaleDateString()}</span>
                                    </div>
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
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
