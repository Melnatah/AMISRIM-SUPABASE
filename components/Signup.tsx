
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface SignupProps {
  onBackToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    year: '1',
    hospital: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          year: formData.year,
          hospital: formData.hospital,
          role: 'resident', // Default role
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark p-6">
        <div className="bg-surface-dark border border-white/5 rounded-[2.5rem] p-12 text-center max-w-md shadow-2xl">
          <div className="size-20 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-4">Demande Envoyée !</h2>
          <p className="text-slate-400 text-sm mb-8">Votre demande d'accès au portail AMIS RIM TOGO est en cours de traitement par le bureau national. Vous recevrez un email de confirmation sous 48h.</p>
          <button
            onClick={onBackToLogin}
            className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
          >
            RETOUR À LA CONNEXION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark font-jakarta p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface-dark/80 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl p-8 md:p-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={onBackToLogin}
              className="size-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Demande d'adhésion</h1>
              <p className="text-text-secondary text-xs font-medium">Rejoignez la communauté AMIS RIM TOGO</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Prénom</label>
              <input
                required
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nom</label>
              <input
                required
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email académique</label>
              <input
                required
                type="email"
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
              <input
                required
                type="password"
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                placeholder="Minimum 6 caractères"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Année de Résidence</label>
              <select
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium appearance-none"
                value={formData.year}
                onChange={e => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="1">1ère Année</option>
                <option value="2">2ème Année</option>
                <option value="3">3ème Année</option>
                <option value="4">4ème Année</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hôpital d'attache</label>
              <input
                required
                className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm font-medium"
                value={formData.hospital}
                onChange={e => setFormData({ ...formData, hospital: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 mt-4">
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? 'ENVOI EN COURS...' : 'SOUMETTRE MA DEMANDE'}
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-slate-500 text-[10px] font-medium italic">
            En soumettant ce formulaire, vous acceptez que vos données soient traitées par le comité AMIS-RIM pour la validation de votre profil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
