
import React, { useState, useEffect } from 'react';
import { Contribution, Profile } from '../types';
import { contributions as contributionsAPI, profiles } from '../services/api';

interface CotisationProps {
  user: { id: string, name: string, role: 'admin' | 'resident' };
}

const Cotisation: React.FC<CotisationProps> = ({ user }) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    contributorName: '',
    profileId: '',
    contributorType: 'Resident' as 'Resident' | 'Partenaire',
    amount: '',
    month: 'Février',
    reason: 'Mensualité'
  });
  const [loading, setLoading] = useState(true);

  const fetchContributions = async () => {
    try {
      const data = await contributionsAPI.getAll();
      setContributions(data || []);
    } catch (e) {
      console.error("Error fetching contributions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
    const fetchUsers = async () => {
      if (user.role === 'admin') {
        const data = await profiles.getAll();
        setUsersList(data || []);
      }
    };
    fetchUsers();
  }, [user.role]);

  const totalFund = contributions.reduce((acc, curr) => acc + curr.amount, 0);
  const monthTotal = contributions
    .filter(c => c.month === 'Février') // In a real app, this should be dynamic current month
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const partnerCount = new Set(contributions.filter(c => c.contributorType === 'Partenaire').map(c => c.contributorName)).size;

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contributorName || !formData.amount) return;

    try {
      await contributionsAPI.create({
        contributorName: formData.contributorName,
        profileId: formData.profileId || undefined,
        contributorType: formData.contributorType,
        amount: Number(formData.amount),
        month: formData.month,
        reason: formData.reason
      });

      fetchContributions();
      setIsModalOpen(false);
      setFormData({ contributorName: '', profileId: '', contributorType: 'Resident', amount: '', month: 'Février', reason: 'Mensualité' });
    } catch (e) {
      console.error("Error adding contribution", e);
      alert("Erreur lors de l'ajout");
    }
  };

  const deleteContribution = async (id: string) => {
    if (window.confirm("Supprimer cette entrée ?")) {
      try {
        await contributionsAPI.delete(id);
        fetchContributions();
      } catch (e) {
        console.error("Error deleting", e);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Contributeur", "Type", "Mois", "Motif", "Montant (FCFA)"];
    const rows = contributions.map(c => [c.date, c.contributorName, c.contributorType, c.month, c.reason, c.amount]);
    const csvContent = [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `journal_amis_rim_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-10 bg-background-light dark:bg-background-dark font-jakarta">

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">payments</span>
              Nouveau Versement
            </h3>
            <form onSubmit={handleAddContribution} className="space-y-4">
              <div className="grid grid-cols-2 gap-1 p-1 bg-background-dark/50 rounded-xl border border-white/5">
                <button type="button" onClick={() => setFormData({ ...formData, contributorType: 'Resident', contributorName: '', profileId: '' })} className={`py - 2 text - [9px] font - black uppercase rounded - lg transition - all ${formData.contributorType === 'Resident' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'} `}>Résident</button>
                <button type="button" onClick={() => setFormData({ ...formData, contributorType: 'Partenaire', profileId: '' })} className={`py - 2 text - [9px] font - black uppercase rounded - lg transition - all ${formData.contributorType === 'Partenaire' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500'} `}>Partenaire</button>
              </div>

              {formData.contributorType === 'Resident' ? (
                <select
                  required
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm"
                  value={formData.profileId}
                  onChange={e => {
                    const selectedUser = usersList.find(u => u.id === e.target.value);
                    setFormData({
                      ...formData,
                      profileId: e.target.value,
                      contributorName: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName} ` : ''
                    });
                  }}
                >
                  <option value="">Sélectionner un résident...</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              ) : (
                <input required className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm" placeholder="Nom du partenaire..." value={formData.contributorName} onChange={e => setFormData({ ...formData, contributorName: e.target.value })} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm" placeholder="Montant..." value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                <select className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })}>
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-xl bg-white/5 text-slate-400 font-black uppercase text-[10px]">Annuler</button>
                <button type="submit" className="flex-1 py-4 rounded-xl bg-indigo-500 text-white font-black uppercase text-[10px] shadow-lg shadow-indigo-500/20">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 md:gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Caisse Commune</h2>
            <p className="text-slate-500 text-xs md:text-sm">Suivi des cotisations AMIS-RIM.</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-8 py-4 text-xs font-black text-white shadow-xl shadow-indigo-500/20"
            >
              <span className="material-symbols-outlined">add_card</span>
              NOUVELLE ENTRÉE
            </button>
          )}
        </div>

        {/* Dashboards Financiers - Optimized for mobile stacking */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2rem] p-6 md:p-10 shadow-2xl">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-3">Solde Total de la Caisse</p>
                  <h3 className="text-white text-3xl md:text-6xl font-black tracking-tighter">
                    {totalFund.toLocaleString()} <span className="text-sm md:text-xl font-bold opacity-60 uppercase">FCFA</span>
                  </h3>
                </div>
                <div className="size-12 md:size-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shrink-0">
                  <span className="material-symbols-outlined text-2xl md:text-4xl">account_balance_wallet</span>
                </div>
              </div>
              <div className="mt-8 md:mt-12 flex gap-4 md:gap-8 overflow-x-auto hide-scrollbar">
                <div className="shrink-0">
                  <p className="text-indigo-300 text-[8px] font-bold uppercase mb-1">Dernière Entrée</p>
                  <p className="text-white text-xs md:text-sm font-black">{contributions[0]?.date || '---'}</p>
                </div>
                <div className="w-px h-8 md:h-10 bg-white/10 shrink-0"></div>
                <div className="shrink-0">
                  <p className="text-indigo-300 text-[8px] font-bold uppercase mb-1">Partenaires</p>
                  <p className="text-white text-xs md:text-sm font-black">{partnerCount} Donateurs</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-surface-highlight rounded-[2rem] p-6 md:p-10 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">insights</span>
                </div>
                <h4 className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest">Mois en cours</h4>
              </div>
              <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{monthTotal.toLocaleString()} FCFA</p>
            </div>
            <div className="mt-6">
              <button
                onClick={exportToCSV}
                className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                EXPORTER CSV
              </button>
            </div>
          </div>
        </div>

        {/* Historique - Table with overflow or card-view (table-responsive) */}
        <div className="bg-white dark:bg-surface-dark rounded-[2rem] border border-gray-100 dark:border-surface-highlight shadow-2xl p-6 md:p-10 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-slate-900 dark:text-white text-lg font-black uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">history</span>
              Journal
            </h3>
          </div>

          <div className="overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full min-w-[600px] md:min-w-0">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="text-left pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest px-6">Source</th>
                  <th className="text-left pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest px-4">Motif</th>
                  <th className="text-left pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest px-4">Mois</th>
                  <th className="text-right pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest px-6">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {contributions.map(item => (
                  <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-5 px-6">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{item.contributorName}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">{item.contributorType}</p>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <span className="text-[8px] font-black px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 uppercase">{item.reason}</span>
                    </td>
                    <td className="py-5 px-4 text-[10px] text-slate-500">{item.month}</td>
                    <td className="py-5 px-6 text-right font-black text-xs">
                      {item.amount.toLocaleString()} FCFA
                    </td>
                    <td className="py-5 px-6 text-right">
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => deleteContribution(item.id)}
                          className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-inner"
                          title="Annuler (Admin)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cotisation;
