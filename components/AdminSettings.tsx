
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

type AdminTab = 'users' | 'finance' | 'system' | 'broadcast';

interface PendingUser {
  id: string;
  name: string;
  hospital: string;
  year: string;
  date: string; // We'll map created_at to this
}

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);

  // États (from DB now)
  const [pacsUrl, setPacsUrl] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState('5000');

  // États locaux
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Fetch Settings & Pending Users
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        data.forEach(setting => {
          if (setting.key === 'pacs_url') setPacsUrl(setting.value);
          if (setting.key === 'maintenance_mode') setMaintenanceMode(setting.value === 'true');
          if (setting.key === 'monthly_fee') setMonthlyFee(setting.value);
        });
      }
    };

    const fetchPendingUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending');

      if (data) {
        setPendingUsers(data.map(u => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`,
          hospital: u.hospital || 'N/A',
          year: u.year ? `${u.year} année` : 'N/A',
          date: new Date(u.created_at).toLocaleDateString()
        })));
      }
    };

    fetchSettings();
    fetchPendingUsers();
  }, [activeTab]); // Refetch when tab changes to be fresh

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('settings').upsert({ key, value });
  };

  const handleSavePacs = async () => {
    await saveSetting('pacs_url', pacsUrl);
    alert("Serveur PACS configuré !");
  };

  const toggleMaintenance = async () => {
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    await saveSetting('maintenance_mode', String(newState));
  };

  const handleSaveFinance = async () => {
    await saveSetting('monthly_fee', monthlyFee);
    alert("Paramètres financiers mis à jour !");
  };

  const handleApproveUser = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      alert("Utilisateur approuvé avec succès.");
    } else {
      alert("Erreur lors de l'approbation.");
    }
  };

  const handleRejectUser = async (id: string) => {
    if (!window.confirm("Rejeter ce compte ?")) return;
    const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
    if (!error) {
      setPendingUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;

    const { error } = await supabase.from('messages').insert({
      content: broadcastMsg,
      type: 'alert', // Broadcasts show as alerts
      priority: 'urgent',
      author: 'Admin',
      subject: 'Flash Info Global'
    });

    if (!error) {
      alert(`Message diffusé à tous les résidents.`);
      setBroadcastMsg('');
    } else {
      alert("Erreur lors de l'envoi.");
    }
  };

  const systemStatus = [
    { label: 'PACS Gateway', status: pacsUrl ? 'Configuré' : 'Non défini', color: pacsUrl ? 'text-emerald-500' : 'text-amber-500' },
    { label: 'Base de données', status: 'Synchronisée', color: 'text-emerald-500' },
    { label: 'Maintenance', status: maintenanceMode ? 'Actif' : 'Inactif', color: maintenanceMode ? 'text-red-500' : 'text-slate-500' },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta">
      <div className="max-w-[1200px] mx-auto space-y-10">

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">security</span>
            <span>Privilèges Administrateur</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configuration Système</h2>
        </div>

        {/* Navigation des Onglets */}
        <div className="flex gap-1 bg-surface-dark p-1 rounded-2xl border border-surface-highlight overflow-x-auto hide-scrollbar shadow-2xl">
          <TabBtn label="Utilisateurs" icon="group" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabBtn label="Finances" icon="account_balance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <TabBtn label="Diffusion" icon="campaign" active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
          <TabBtn label="Système" icon="settings_suggest" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">

          {/* TAB: UTILISATEURS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">person_add</span>
                    Demandes en attente
                  </h3>
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    {pendingUsers.length} Nouveau{pendingUsers.length > 1 ? 'x' : ''}
                  </span>
                </div>

                <div className="space-y-4">
                  {pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all gap-6">
                      <div className="flex items-center gap-5">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-black text-xl">
                          {user.name.split(' ')[1]?.[0] || user.name[0]}
                        </div>
                        <div>
                          <p className="text-lg font-black text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.hospital} • {user.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-16 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                      <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">verified_user</span>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aucune demande d'adhésion en attente.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">payments</span>
                  Paramètres des Cotisations
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Montant Mensuel (FCFA)</label>
                    <input
                      type="number"
                      value={monthlyFee}
                      onChange={e => setMonthlyFee(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] text-indigo-300 font-medium leading-relaxed italic">
                      Ce montant sera utilisé comme référence pour le calcul automatique des dettes et des balances dans le module Cotisation.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveFinance}
                    className="w-full py-4.5 bg-indigo-500 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-indigo-500/20"
                  >
                    Enregistrer les tarifs
                  </button>
                </div>
              </div>

              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-center text-center">
                <span className="material-symbols-outlined text-5xl text-slate-800 mb-4">account_balance</span>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Configuration bancaire & rapports fiscaux bientôt disponibles.</p>
              </div>
            </div>
          )}

          {/* TAB: BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                  <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">campaign</span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Flash Info Global</h3>
                  <p className="text-slate-500 text-sm">Envoyez une notification instantanée qui apparaîtra sur le dashboard de tous les résidents connectés.</p>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="Écrivez votre message d'urgence ou d'information ici..."
                    className="w-full h-40 bg-black/30 border border-white/10 rounded-3xl p-6 text-white text-sm outline-none focus:border-amber-500 transition-all resize-none"
                  />
                  <button
                    onClick={handleSendBroadcast}
                    className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
                  >
                    Diffuser le message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SYSTEM */}
          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CONFIGURATION PACS */}
                <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">dataset</span>
                    Passerelle PACS
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Endpoint URL du Visualiseur</label>
                      <input
                        type="text"
                        value={pacsUrl}
                        onChange={(e) => setPacsUrl(e.target.value)}
                        placeholder="https://pacs.hopital.tg/viewer"
                        className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <button onClick={handleSavePacs} className="w-full py-4.5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-primary/20">Mettre à jour le lien</button>
                  </div>
                </div>

                {/* MONITORING */}
                <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">État des Services</h3>
                  {systemStatus.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                      <span className={`text-[10px] font-black uppercase ${s.color}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* MAINTENANCE */}
              <div className={`border rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all ${maintenanceMode ? 'bg-red-500/10 border-red-500' : 'bg-surface-dark border-surface-highlight shadow-2xl'}`}>
                <div className="flex items-center gap-6">
                  <div className={`size-16 rounded-2xl flex items-center justify-center transition-all ${maintenanceMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-red-500/10 text-red-500'}`}>
                    <span className="material-symbols-outlined text-4xl">construction</span>
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xl uppercase tracking-tight mb-1">Mode Maintenance Global</h4>
                    <p className="text-slate-500 text-sm">Bloquer l'accès au portail pour tous les utilisateurs non-administrateurs.</p>
                  </div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${maintenanceMode ? 'bg-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-white/5 text-red-500 border border-red-500/30 hover:bg-red-500/10'}`}
                >
                  {maintenanceMode ? 'Désactiver la maintenance' : 'Activer la maintenance'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ label, icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-4.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
  >
    <span className="material-symbols-outlined text-lg">{icon}</span>
    {label}
  </button>
);

export default AdminSettings;
