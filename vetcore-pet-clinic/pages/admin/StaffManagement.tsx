import React, { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Edit2, KeyRound } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { User, StaffCreateRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const StaffManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<StaffCreateRequest>({ name: '', username: '', email: '', password: '', role: 'doctor' });
    const [submitting, setSubmitting] = useState(false);

    // Edit profile state
    const [editingStaff, setEditingStaff] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ name: '', username: '', email: '' });

    // Reset password state
    const [resetStaffId, setResetStaffId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const fetchStaff = async () => {
        try {
            const res = await api.get('/admin/staff');
            setStaff(res.data.staff);
        } catch (err) {
            toast.error('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStaff(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/staff', form);
            toast.success('Staff member created');
            setShowModal(false);
            setForm({ name: '', username: '', email: '', password: '', role: 'doctor' });
            fetchStaff();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to create staff');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        if (currentUser && id === currentUser.id) {
            toast.error('You cannot deactivate your own account');
            return;
        }
        try {
            await api.patch(`/admin/staff/${id}`, { is_active: !currentStatus });
            toast.success(`Staff ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchStaff();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update status');
        }
    };

    const handleEditProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;
        setSubmitting(true);
        try {
            await api.patch(`/admin/staff/${editingStaff.id}/profile`, {
                name: editForm.name || undefined,
                username: editForm.username || undefined,
                email: editForm.email || undefined,
            });
            toast.success('Profile updated');
            setEditingStaff(null);
            fetchStaff();
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join('; ') : detail || 'Failed to update profile';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetStaffId) return;
        setSubmitting(true);
        try {
            await api.post(`/admin/staff/${resetStaffId}/reset-password`, {
                new_password: newPassword,
            });
            toast.success('Password reset successfully');
            setResetStaffId(null);
            setNewPassword('');
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail) ? detail.map((d: any) => d.msg).join('; ') : detail || 'Failed to reset password';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const roleBadge = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700',
            doctor: 'bg-blue-100 text-blue-700',
            receptionist: 'bg-teal-100 text-teal-700',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${colors[role] || 'bg-slate-100 text-slate-700'}`}>{role}</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Staff Management</h2>
                <Button onClick={() => setShowModal(true)} variant="primary" size="sm">
                    <Plus size={16} className="mr-1" /> Add Staff
                </Button>
            </div>

            <Card noPadding>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Name</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Username</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Email</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Role</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Status</th>
                                <th className="text-left p-4 text-sm font-semibold text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.map((s) => (
                                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{s.name}</td>
                                    <td className="p-4 text-slate-600">{s.username}</td>
                                    <td className="p-4 text-slate-500 text-sm">{(s as any).email || '-'}</td>
                                    <td className="p-4">{roleBadge(s.role)}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {s.role === 'admin' ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 italic mr-1">{currentUser && s.id === currentUser.id ? 'You' : 'Admin'}</span>
                                                <button onClick={() => { setResetStaffId(s.id); setNewPassword(''); }} className="text-slate-400 hover:text-amber-500 transition-colors" title="Change Password">
                                                    <KeyRound size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setEditingStaff(s); setEditForm({ name: s.name, username: s.username, email: (s as any).email || '' }); }} className="text-slate-400 hover:text-primary transition-colors" title="Edit Profile">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => { setResetStaffId(s.id); setNewPassword(''); }} className="text-slate-400 hover:text-amber-500 transition-colors" title="Reset Password">
                                                    <KeyRound size={16} />
                                                </button>
                                                <button onClick={() => toggleStatus(s.id, s.is_active!)} className="text-slate-500 hover:text-primary transition-colors" title={s.is_active ? 'Deactivate' : 'Activate'}>
                                                    {s.is_active ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No staff members found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </Card>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Add Staff Member</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Username</label>
                                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                <p className="mt-1 text-xs text-slate-400">Min 8 characters, 1 digit, 1 special character (!@#$%...)</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Role</label>
                                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                    <option value="doctor">Doctor</option>
                                    <option value="receptionist">Receptionist</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {editingStaff && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingStaff(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Edit Profile — {editingStaff.name}</h3>
                        <form onSubmit={handleEditProfile} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Username (login)</label>
                                <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingStaff(null)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Save Changes</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetStaffId && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResetStaffId(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Reset Password</h3>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">New Password</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                <p className="mt-1 text-xs text-slate-400">Min 8 characters, 1 digit, 1 special character (!@#$%...)</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setResetStaffId(null)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Reset Password</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
