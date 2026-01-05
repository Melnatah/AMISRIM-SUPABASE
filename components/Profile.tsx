
import React, { useState, useEffect } from 'react';
import { profiles } from '../services/api';
import { Profile } from '../types';

interface ProfileProps {
    user: { id: string; name: string; role: 'admin' | 'resident' };
}

const ProfileComponent: React.FC<ProfileProps> = ({ user }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        year: '',
        hospital: ''
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La photo ne doit pas dépasser 5MB' });
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Seules les images sont autorisées' });
            return;
        }

        setUploadingAvatar(true);
        setMessage(null);

        try {
            const updatedProfile = await profiles.uploadAvatar(file);
            setProfile(updatedProfile);

            // Update localStorage
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                userData.profile = { ...userData.profile, avatar: updatedProfile.avatar };
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(userData));
                }
            }

            setMessage({ type: 'success', text: 'Photo de profil mise à jour !' });
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            console.error('Error uploading avatar:', err);
            setMessage({ type: 'error', text: 'Erreur lors de l\'upload : ' + err.message });
        } finally {
            setUploadingAvatar(false);
        }
    };

    // MOCKED DATA - Supabase Removed


    const fetchProfile = async () => {
        try {
            const fetchedProfile = await profiles.getMe();
            setProfile({
                id: fetchedProfile.id,
                first_name: fetchedProfile.first_name || '',
                last_name: fetchedProfile.last_name || '',
                email: fetchedProfile.email || '',
                phone: fetchedProfile.phone || '',
                year: fetchedProfile.year || '',
                hospital: fetchedProfile.hospital || '',
                status: fetchedProfile.status || 'pending',
                created_at: fetchedProfile.created_at || new Date().toISOString()
            });
            setFormData({
                first_name: fetchedProfile.first_name || '',
                last_name: fetchedProfile.last_name || '',
                email: fetchedProfile.email || '',
                phone: fetchedProfile.phone || '',
                hospital: fetchedProfile.hospital || '',
                year: fetchedProfile.year || ''
            });
        } catch (error: any) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Erreur lors du chargement du profil : ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await profiles.updateMe(formData);

            // Update localStorage/sessionStorage with new name
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (userStr) {
                const userData = JSON.parse(userStr);
                userData.profile = {
                    ...userData.profile,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    year: formData.year,
                    hospital: formData.hospital
                };

                // Update in the same storage location
                if (localStorage.getItem('user')) {
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    sessionStorage.setItem('user', JSON.stringify(userData));
                }
            }

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès ! Rechargez la page pour voir les changements.' });
            fetchProfile(); // Re-fetch profile to update UI with latest data

            // Reload page after 1.5 seconds to refresh all components
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour : ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mon Profil</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Gérez vos informations personnelles et professionnelles</p>
                    </div>
                    {/* Avatar Upload */}
                    <div className="relative group">
                        <input
                            type="file"
                            id="avatar-upload"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                        />
                        <label
                            htmlFor="avatar-upload"
                            className="cursor-pointer block relative"
                        >
                            {profile?.avatar ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL || 'https://api-amisrim.jadeoffice.cloud'}${profile.avatar}`}
                                    alt="Avatar"
                                    className="size-20 rounded-2xl object-cover border-2 border-primary/20 group-hover:border-primary transition-all"
                                />
                            ) : (
                                <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 group-hover:border-primary transition-all">
                                    <span className="material-symbols-outlined text-4xl filled">person</span>
                                </div>
                            )}
                            {/* Upload overlay */}
                            <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {uploadingAvatar ? (
                                    <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                )}
                            </div>
                        </label>
                        <p className="text-[8px] text-slate-500 text-center mt-2 font-bold uppercase tracking-widest">Cliquez pour modifier</p>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                        <p className="text-sm font-bold uppercase tracking-wide">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Prénom */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                                <input
                                    type="text"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="Votre prénom"
                                />
                            </div>
                        </div>

                        {/* Nom */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">badge</span>
                                <input
                                    type="text"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="Votre nom"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="votre@email.com"
                                />
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Numéro de téléphone</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">phone</span>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="+228 00 00 00 00"
                                />
                            </div>
                        </div>

                        {/* Année de résidence */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Année de résidence</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">event</span>
                                <select
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                                >
                                    <option value="">Sélectionner une année</option>
                                    <option value="1">1ère année</option>
                                    <option value="2">2ème année</option>
                                    <option value="3">3ème année</option>
                                    <option value="4">4ème année</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>

                        {/* Hôpital / Site actuel */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Hôpital d'affectation</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">domain</span>
                                <input
                                    type="text"
                                    value={formData.hospital}
                                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                                    className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="Ex: CHU Campus"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto px-8 py-3 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">save</span>
                                    Sauvegarder les modifications
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                    <div className="flex gap-4">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                            <span className="material-symbols-outlined filled">security</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Sécurité du compte</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Vos informations sont utilisées pour personnaliser votre expérience sur AMIS RIM TOGO.
                                Pour modifier votre mot de passe ou vos paramètres de connexion, veuillez contacter l'administrateur.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileComponent;
