import React, { useState, useEffect } from 'react';
// import { supabase } from '../services/supabase';

type AdminTab = 'users' | 'finance' | 'attendance' | 'broadcast' | 'system';

interface PendingUser {
  id: string;
  name: string;
  hospital: string;
  year: string;
  date: string;
}

interface ApprovedUser extends PendingUser {
  role: string;
}

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);

  // States
  const [pacsUrl, setPacsUrl] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState('5000');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [allContributions, setAllContributions] = useState<any[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);

  const fetchSettings = async () => {
    // Mock settings
    setPacsUrl("https://demo.pacs.com");
    setMaintenanceMode(false);
    setMonthlyFee('5000');
  };

  const fetchPendingUsers = async () => {
    // Mock pending users
    const data: any[] = [];
    setPendingUsers(data.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`,
      hospital: u.hospital || 'N/A',
      year: u.year ? `${u.year} année` : 'N/A',
      date: new Date(u.created_at).toLocaleDateString()
    })));
  };

  const fetchApprovedUsers = async () => {
    // Mock approved users
    const data: any[] = [];
    setApprovedUsers(data.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`,
      hospital: u.hospital || 'N/A',
      year: u.year ? `${u.year} année` : 'N/A',
      date: new Date(u.created_at).toLocaleDateString(),
      role: u.role || 'resident'
    })));
  };

  const fetchAllContributions = async () => {
    // Mock contributions
    setAllContributions([]);
  };

  const fetchPendingAttendance = async () => {
    // Mock attendance
    setPendingAttendance([]);
  };

  useEffect(() => {
    fetchSettings();
    fetchPendingUsers();
    fetchApprovedUsers();
    fetchAllContributions();
    fetchPendingAttendance();
    // Subscription removed
  }, []);

  const saveSetting = async (key: string, value: string) => {
    // Mock save
    await new Promise(r => setTimeout(r, 500));
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
    try {
      // Mock update
      await new Promise(r => setTimeout(r, 500));
      setPendingUsers(prev => prev.filter(u => u.id !== id));
      alert("Utilisateur approuvé avec succès (Simulation).");
    } catch (e) {
      alert("Erreur.");
    }
  };

  const handleRejectUser = async (id: string) => {
    if (!window.confirm("Rejeter ce compte ?")) return;
    try {
      // Mock update
      await new Promise(r => setTimeout(r, 500));
      setPendingUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) { }
  };

  const handlePromoteUser = async (id: string) => {
    if (!window.confirm("Promouvoir cet utilisateur Administrateur ?")) return;
    // Mock update
    setApprovedUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'admin' } : u));
    alert("Promotion réussie (Simulation) !");
  };

  const handleDemoteUser = async (id: string) => {
    if (!window.confirm("Rétrograder cet utilisateur en Résident ?")) return;
    // Mock update
    setApprovedUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'resident' } : u));
    alert("Rétrogradation réussie (Simulation) !");
  };

  const deleteContribution = async (id: string) => {
    if (!window.confirm("Annuler ce versement définitivement ?")) return;
    // Mock delete
    setAllContributions(prev => prev.filter(c => c.id !== id));
    alert("Versement annulé (Simulation).");
  };

  const handleAttendanceAction = async (id: string, status: 'confirmed' | 'rejected') => {
    // Mock update
    fetchPendingAttendance();
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    // Mock insert
    alert(`Message diffusé à tous les résidents (Simulation).`);
    setBroadcastMsg('');
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

        <div className="flex gap-1 bg-surface-dark p-1 rounded-2xl border border-surface-highlight overflow-x-auto hide-scrollbar shadow-2xl">
          <TabBtn label="Utilisateurs" icon="group" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabBtn label="Finances" icon="account_balance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <TabBtn label="Émargements" icon="how_to_reg" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          <TabBtn label="Diffusion" icon="campaign" active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
          <TabBtn label="Système" icon="settings_suggest" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
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
                        <button onClick={() => handleApproveUser(user.id)} className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">Approuver</button>
                        <button onClick={() => handleRejectUser(user.id)} className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all">Rejeter</button>
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

              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Utilisateurs Actifs
                  </h3>
                  <span className="px-4 py-1.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    {approvedUsers.length} Membre{approvedUsers.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedUsers.map(user => (
                    <div key={user.id} className="flex flex-col p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-primary/20 text-primary border border-primary/20'}`}>
                            {user.name.split(' ')[1]?.[0] || user.name[0]}
                          </div>
                          <div>
                            <p className="text-base font-black text-white flex items-center gap-2">
                              {user.name}
                              {user.role === 'admin' && <span className="material-symbols-outlined text-[14px] text-amber-500" title="Administrateur">verified_user</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.hospital} • {user.year}</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-400 uppercase">{user.role}</div>
                      </div>
                      <div className="flex gap-2 mt-2 pt-4 border-t border-white/5">
                        {user.role !== 'admin' ? (
                          <button onClick={() => handlePromoteUser(user.id)} className="flex-1 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-xl uppercase hover:bg-indigo-500 hover:text-white transition-all">Promouvoir Admin</button>
                        ) : (
                          <button onClick={() => handleDemoteUser(user.id)} className="flex-1 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-xl uppercase hover:bg-amber-500 hover:text-white transition-all">Rétrograder</button>
                        )}
                        <button onClick={() => handleRejectUser(user.id)} className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                    <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] text-indigo-300 font-medium leading-relaxed italic">Ce montant sera utilisé comme référence pour le calcul automatique des dettes et des balances dans le module Cotisation.</p>
                  </div>
                  <button onClick={handleSaveFinance} className="w-full py-4.5 bg-indigo-500 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-indigo-500/20">Enregistrer les tarifs</button>
                </div>
              </div>

              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">history</span>
                    Dernières Transactions
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2">Membre</th>
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2 text-right">Montant</th>
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allContributions.map(c => (
                        <tr key={c.id} className="group hover:bg-white/5">
                          <td className="py-4 px-2">
                            <p className="text-[10px] font-bold text-white truncate max-w-[100px]">{c.contributor_name}</p>
                            <p className="text-[7px] text-slate-500 uppercase">{c.month}</p>
                          </td>
                          <td className="py-4 px-2 text-right text-[10px] font-black text-emerald-500">{c.amount.toLocaleString()}</td>
                          <td className="py-4 px-2 text-right">
                            <button onClick={() => deleteContribution(c.id)} className="size-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all mx-auto mr-0"><span className="material-symbols-outlined text-xs">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">how_to_reg</span>
                  Émargements à Valider
                </h3>
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                  {pendingAttendance.length} En attente
                </span>
              </div>

              <div className="space-y-4">
                {pendingAttendance.length > 0 ? pendingAttendance.map(att => (
                  <div key={att.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all gap-6">
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">
                          {att.item_type === 'staff' ? 'groups' : att.item_type === 'epu' ? 'school' : att.item_type === 'diu' ? 'workspace_premium' : 'location_on'}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">{att.profiles.first_name} {att.profiles.last_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-primary text-[10px] font-black uppercase tracking-widest">{att.item_type}</span>
                          <span className="text-slate-500 text-[10px] font-bold uppercase">•</span>
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            {new Date(att.created_at).toLocaleDateString()} {new Date(att.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleAttendanceAction(att.id, 'confirmed')} className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-sm">done</span> Valider
                      </button>
                      <button onClick={() => handleAttendanceAction(att.id, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-sm">close</span> Rejeter
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                    <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">checklist</span>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aucun émargement en attente de validation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                  <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-4xl">campaign</span></div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Flash Info Global</h3>
                  <p className="text-slate-500 text-sm">Envoyez une notification instantanée qui apparaîtra sur le dashboard de tous les résidents connectés.</p>
                </div>
                <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Écrivez votre message d'urgence ou d'information ici..." className="w-full h-40 bg-black/30 border border-white/10 rounded-3xl p-6 text-white text-sm outline-none focus:border-amber-500 transition-all resize-none" />
                <button onClick={handleSendBroadcast} className="w-full py-5 bg-amber-500 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-amber-500/20 transition-all">Diffuser le message</button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl">
                  <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2"><span className="material-symbols-outlined text-primary">dataset</span>Passerelle PACS</h3>
                  <input type="text" value={pacsUrl} onChange={(e) => setPacsUrl(e.target.value)} placeholder="https://pacs.hopital.tg/viewer" className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none mb-6" />
                  <button onClick={handleSavePacs} className="w-full py-4.5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase">Mettre à jour le lien</button>
                </div>
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
              <div className={`border rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all ${maintenanceMode ? 'bg-red-500/10 border-red-500' : 'bg-surface-dark border-surface-highlight shadow-2xl'}`}>
                <div className="flex items-center gap-6">
                  <div className={`size-16 rounded-2xl flex items-center justify-center ${maintenanceMode ? 'bg-red-500 text-white shadow-lg' : 'bg-red-500/10 text-red-500'}`}><span className="material-symbols-outlined text-4xl">construction</span></div>
                  <div><h4 className="text-white font-black text-xl uppercase mb-1">Mode Maintenance Global</h4><p className="text-slate-500 text-sm">Bloquer l'accès au portail pour tous les utilisateurs non-administrateurs.</p></div>
                </div>
                <button onClick={toggleMaintenance} className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${maintenanceMode ? 'bg-red-500 text-white shadow-xl' : 'bg-white/5 text-red-500 border border-red-500/30'}`}>{maintenanceMode ? 'Désactiver' : 'Activer'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ label, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-2xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
    <span className="material-symbols-outlined text-lg">{icon}</span>{label}
  </button>
);

export default AdminSettings;
