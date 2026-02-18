import React, { useEffect, useState } from 'react';
import { Plus, Search, PawPrint } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/axios';
import { Owner, Pet } from '../../types';
import toast from 'react-hot-toast';

export const OwnerManagement: React.FC = () => {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOwnerModal, setShowOwnerModal] = useState(false);
    const [showPetModal, setShowPetModal] = useState<number | null>(null);
    const [expandedOwner, setExpandedOwner] = useState<number | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [petsLoading, setPetsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ownerForm, setOwnerForm] = useState({ name: '', phone: '', email: '', address: '' });
    const [petForm, setPetForm] = useState({ name: '', species: '', breed: '', age: '' });

    const fetchOwners = async () => {
        try {
            const res = await api.get('/receptionist/owners');
            setOwners(res.data);
        } catch (err) {
            toast.error('Failed to load owners');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOwners(); }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) { fetchOwners(); return; }
        setLoading(true);
        try {
            const res = await api.get('/receptionist/owners/search', { params: { q: searchQuery } });
            setOwners(res.data);
        } catch (err) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOwner = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/receptionist/owners', {
                name: ownerForm.name,
                phone: ownerForm.phone,
                email: ownerForm.email || null,
                address: ownerForm.address || null,
            });
            toast.success('Owner registered');
            setShowOwnerModal(false);
            setOwnerForm({ name: '', phone: '', email: '', address: '' });
            fetchOwners();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to register owner');
        } finally {
            setSubmitting(false);
        }
    };

    const fetchPets = async (ownerId: number) => {
        if (expandedOwner === ownerId) { setExpandedOwner(null); return; }
        setPetsLoading(true);
        setExpandedOwner(ownerId);
        try {
            const res = await api.get(`/receptionist/owners/${ownerId}/pets`);
            setPets(res.data);
        } catch (err) {
            toast.error('Failed to load pets');
        } finally {
            setPetsLoading(false);
        }
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showPetModal) return;
        setSubmitting(true);
        try {
            await api.post(`/receptionist/owners/${showPetModal}/pets`, {
                name: petForm.name,
                species: petForm.species,
                breed: petForm.breed || null,
                age: petForm.age ? parseInt(petForm.age) : null,
            });
            toast.success('Pet added');
            setShowPetModal(null);
            setPetForm({ name: '', species: '', breed: '', age: '' });
            if (expandedOwner) fetchPets(expandedOwner);
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to add pet');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-heading font-bold text-slate-800">Owners & Pets</h2>
                <Button onClick={() => setShowOwnerModal(true)} variant="primary" size="sm"><Plus size={16} className="mr-1" /> Register Owner</Button>
            </div>

            <Card>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by phone or email..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <Button onClick={handleSearch} variant="outline" size="sm">Search</Button>
                    {searchQuery && <Button onClick={() => { setSearchQuery(''); fetchOwners(); }} variant="ghost" size="sm">Clear</Button>}
                </div>
            </Card>

            {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : owners.length === 0 ? (
                <Card><p className="text-center text-slate-400 py-8">No owners found</p></Card>
            ) : (
                <div className="space-y-4">
                    {owners.map(owner => (
                        <Card key={owner.id}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-heading font-semibold text-slate-800">{owner.name}</h4>
                                    <p className="text-sm text-slate-500">📞 {owner.phone} {owner.email && `• ✉️ ${owner.email}`}</p>
                                    {owner.address && <p className="text-sm text-slate-400">📍 {owner.address}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => fetchPets(owner.id)}>
                                        <PawPrint size={14} className="mr-1" /> {expandedOwner === owner.id ? 'Hide Pets' : 'View Pets'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowPetModal(owner.id); setPetForm({ name: '', species: '', breed: '', age: '' }); }}>
                                        <Plus size={14} className="mr-1" /> Add Pet
                                    </Button>
                                </div>
                            </div>

                            {expandedOwner === owner.id && (
                                <div className="mt-4 border-t border-slate-100 pt-4">
                                    {petsLoading ? (
                                        <div className="flex justify-center py-4"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                                    ) : pets.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-2">No pets registered</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {pets.map(pet => (
                                                <div key={pet.id} className="border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-teal-50"><PawPrint size={16} className="text-primary" /></div>
                                                    <div>
                                                        <p className="font-medium text-sm text-slate-800">{pet.name}</p>
                                                        <p className="text-xs text-slate-500">{pet.species}{pet.breed ? ` • ${pet.breed}` : ''}{pet.age ? ` • ${pet.age}y` : ''}</p>
                                                        <p className="text-[10px] text-slate-400">ID: {pet.id}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Register Owner Modal */}
            {showOwnerModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowOwnerModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Register Owner</h3>
                        <form onSubmit={handleCreateOwner} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input value={ownerForm.name} onChange={e => setOwnerForm({ ...ownerForm, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Phone</label>
                                <input value={ownerForm.phone} onChange={e => setOwnerForm({ ...ownerForm, phone: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Email (optional)</label>
                                <input type="email" value={ownerForm.email} onChange={e => setOwnerForm({ ...ownerForm, email: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Address (optional)</label>
                                <input value={ownerForm.address} onChange={e => setOwnerForm({ ...ownerForm, address: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowOwnerModal(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Register</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Pet Modal */}
            {showPetModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPetModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-heading font-bold text-slate-800 mb-6">Add Pet (Owner #{showPetModal})</h3>
                        <form onSubmit={handleAddPet} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Pet Name</label>
                                <input value={petForm.name} onChange={e => setPetForm({ ...petForm, name: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Species</label>
                                <select value={petForm.species} onChange={e => setPetForm({ ...petForm, species: e.target.value })} required className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                                    <option value="">Select species</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="bird">Bird</option>
                                    <option value="rabbit">Rabbit</option>
                                    <option value="hamster">Hamster</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Breed (optional)</label>
                                    <input value={petForm.breed} onChange={e => setPetForm({ ...petForm, breed: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Age (years)</label>
                                    <input type="number" value={petForm.age} onChange={e => setPetForm({ ...petForm, age: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPetModal(null)}>Cancel</Button>
                                <Button type="submit" variant="primary" className="flex-1" isLoading={submitting}>Add Pet</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
