
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LeisureEvent, LeisureFund } from '../types';
import { leisure } from '../services/api';

type EventType = 'voyage' | 'pique-nique' | 'fete';
type ViewTab = 'explorer' | 'gestion';

interface LoisirProps {
   user: { id: string, name: string, role: 'admin' | 'resident' };
}

const Loisir: React.FC<LoisirProps> = ({ user }) => {
   const location = useLocation();
   const navigate = useNavigate();
   const isAdmin = user.role === 'admin';

   const getFilterFromPath = (): EventType | 'all' => {
      const path = location.pathname;
      if (path.includes('/voyage')) return 'voyage';
      if (path.includes('/pique-nique')) return 'pique-nique';
      if (path.includes('/fete')) return 'fete';
      return 'all';
   };

   const activeFilter = getFilterFromPath();
   const [activeTab, setActiveTab] = useState<ViewTab>(isAdmin ? 'gestion' : 'explorer');

   const [events, setEvents] = useState<LeisureEvent[]>([]);
   const [funds, setFunds] = useState<LeisureFund[]>([]);
   const [contributions, setContributions] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   const [isAddEventOpen, setIsAddEventOpen] = useState(false);
   const [isFundOpen, setIsFundOpen] = useState(false);
   const [selectedFund, setSelectedFund] = useState<LeisureFund | null>(null);
   const [contributionAmount, setContributionAmount] = useState('');

   const [profiles, setProfiles] = useState<any[]>([]);
   const [selectedEventForFinance, setSelectedEventForFinance] = useState<string | null>(null);
   const [manualContribution, setManualContribution] = useState({ profileId: '', amount: '' });
   const [eventImage, setEventImage] = useState<File | null>(null);

   const [newEvent, setNewEvent] = useState({
      title: '', type: 'voyage' as EventType, date: '', location: '', description: '', costPerPerson: '', maxParticipants: '', imageUrl: ''
   });

   const fileInputRef = useRef<HTMLInputElement>(null);

   const fetchData = async () => {
      try {
         setLoading(true);
         const [eventsData, contribData] = await Promise.all([
            leisure.getEvents(),
            leisure.getContributions()
         ]);

         // Helper to map backend event structure to frontend if needed
         // Assuming backend returns events with participants and funds
         // If funds are separate, we might need adjustments.
         // For now, mapping as is.
         setEvents(eventsData || []);
         // Start with inferred funds from events if not returned separately
         // setFunds(fundsData || []);
         // Actually, let's assume events contain needed info or we accept lighter data for now.

         setContributions(contribData || []);
      } catch (error) {
         console.error(error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
      // Realtime subscription removed
   }, []);

   const handleRegister = async (eventId: string) => {
      try {
         await leisure.joinEvent(eventId);
         alert("Demande envoyée !");
         fetchData();
      } catch (error: any) {
         alert("Erreur lors de l'inscription : " + error.message);
      }
   };

   const updateParticipantStatus = async (participantId: string, eventId: string, newStatus: 'approved' | 'rejected') => {
      try {
         await leisure.updateParticipantStatus(eventId, participantId, newStatus);
         fetchData();
      } catch (error: any) {
         alert("Erreur : " + error.message);
      }
   };

   const handleCreateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         // Simplified image handling (URL only for now unless we implement upload properly)
         const finalImageUrl = newEvent.imageUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000';

         await leisure.createEvent({
            title: newEvent.title,
            description: newEvent.description,
            type: newEvent.type,
            eventDate: newEvent.date ? new Date(newEvent.date).toISOString() : undefined,
            location: newEvent.location,
            costPerPerson: newEvent.costPerPerson ? Number(newEvent.costPerPerson) : undefined,
            maxParticipants: newEvent.maxParticipants ? Number(newEvent.maxParticipants) : undefined
         });

         setIsAddEventOpen(false);
         setNewEvent({ title: '', type: 'voyage', date: '', location: '', description: '', costPerPerson: '', maxParticipants: '', imageUrl: '' });
         setEventImage(null);
         fetchData();
      } catch (error: any) {
         alert("Erreur lors de la création : " + error.message);
      }
   };

   const deleteEvent = async (id: string) => {
      if (window.confirm("Supprimer cette activité ?")) {
         try {
            await leisure.deleteEvent(id);
            fetchData();
         } catch (e) { console.error(e); }
      }
   };

   const deleteFund = async (id: string, title: string) => {
      if (window.confirm(`Supprimer la caisse "${title}" ?`)) {
         // Mock delete
         alert("Supprimé (Simulation)");
      }
   };

   const handleContribution = async () => {
      if (!selectedFund || !contributionAmount) return;
      try {
         await leisure.addContribution({
            eventId: selectedFund.eventId,
            profileId: user.id,
            amount: Number(contributionAmount)
         });
         setIsFundOpen(false);
         setContributionAmount('');
         fetchData();
      } catch (e) {
         console.error(e);
         alert("Erreur");
      }
   };

   const addManualContribution = async () => {
      if (!selectedEventForFinance || !manualContribution.profileId || !manualContribution.amount) return;
      try {
         await leisure.addContribution({
            eventId: selectedEventForFinance,
            profileId: manualContribution.profileId,
            amount: Number(manualContribution.amount)
         });
         setManualContribution({ profileId: '', amount: '' });
         fetchData();
         alert("Cotisation ajoutée !");
      } catch (e) {
         alert("Erreur");
      }
   };

   const deleteContribution = async (contribId: string) => {
      if (!window.confirm("Annuler ce versement ?")) return;
      try {
         await leisure.deleteContribution(contribId);
         fetchData();
      } catch (e) { alert("Erreur"); }
   };

   if (loading) return <div className="flex h-full items-center justify-center"><div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

   const filteredEvents = activeFilter === 'all' ? events : events.filter(e => e.type === activeFilter);

   return (
      <div className="flex h-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta relative">
         {isAdmin && <button onClick={() => setIsAddEventOpen(true)} className="fixed bottom-20 right-6 size-14 rounded-full bg-primary text-white shadow-2xl z-[60] flex items-center justify-center hover:scale-110 transition-all"><span className="material-symbols-outlined text-3xl">add</span></button>}

         {isAddEventOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 w-full max-w-3xl overflow-y-auto max-h-[90vh]">
                  <h3 className="text-xl font-black text-white uppercase mb-8">Organiser un Événement</h3>
                  <form onSubmit={handleCreateEvent} className="space-y-6 text-white text-xs">
                     <div className="grid grid-cols-3 gap-4">
                        {(['voyage', 'pique-nique', 'fete'] as const).map(t => (
                           <button key={t} type="button" onClick={() => setNewEvent({ ...newEvent, type: t })} className={`p-4 rounded-xl border ${newEvent.type === t ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/5'}`}>{t}</button>
                        ))}
                     </div>
                     <input required className="w-full bg-black/50 border border-white/10 rounded-xl p-4" placeholder="Titre..." value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                     <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="bg-black/50 border border-white/10 rounded-xl p-4" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                        <input className="bg-black/50 border border-white/10 rounded-xl p-4" placeholder="Lieu..." value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <input type="number" className="bg-black/50 border border-white/10 rounded-xl p-4" placeholder="Coût par personne (FCFA)..." value={newEvent.costPerPerson} onChange={e => setNewEvent({ ...newEvent, costPerPerson: e.target.value })} />
                        <input type="number" className="bg-black/50 border border-white/10 rounded-xl p-4" placeholder="Max Participants..." value={newEvent.maxParticipants} onChange={e => setNewEvent({ ...newEvent, maxParticipants: e.target.value })} />
                     </div>
                     <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-4 h-24" placeholder="Description..." value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                     <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Image de l'activité</label>
                        <div className="flex gap-4 items-center">
                           <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-[10px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                           >
                              <span className="material-symbols-outlined text-sm">image</span>
                              {eventImage ? eventImage.name : "Choisir une image"}
                           </button>
                           {eventImage && (
                              <button type="button" onClick={() => setEventImage(null)} className="text-red-500 material-symbols-outlined">close</button>
                           )}
                        </div>
                        <input
                           type="file"
                           ref={fileInputRef}
                           hidden
                           accept="image/*"
                           onChange={(e) => setEventImage(e.target.files?.[0] || null)}
                        />
                     </div>
                     <div className="flex gap-4">
                        <button type="button" onClick={() => setIsAddEventOpen(false)} className="flex-1 py-4 border border-white/10 rounded-xl">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-primary rounded-xl">Publier</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {isFundOpen && selectedFund && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8 w-full max-w-md">
                  <h3 className="text-white font-black uppercase mb-6">{selectedFund.title}</h3>
                  <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white mb-4" placeholder="Montant..." value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} />
                  <button onClick={handleContribution} className="w-full py-4 bg-pink-500 text-white rounded-xl font-black uppercase">Confirmer</button>
                  <button onClick={() => setIsFundOpen(false)} className="w-full mt-4 text-slate-500 uppercase text-[10px]">Fermer</button>
               </div>
            </div>
         )}

         <div className="max-w-[1200px] mx-auto w-full space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">Loisir & Détente</h2>
                  <p className="text-slate-500 text-xs mt-2">Communauté et événements.</p>
               </div>
               {isAdmin && (
                  <div className="flex bg-surface-dark p-1 rounded-2xl border border-white/5">
                     <button onClick={() => setActiveTab('explorer')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'explorer' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}`}>Exploration</button>
                     <button onClick={() => setActiveTab('gestion')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === 'gestion' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>Gestion</button>
                  </div>
               )}
            </div>

            {activeTab === 'explorer' ? (
               <div className="space-y-12 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {funds.map(f => (
                        <div key={f.id} className="bg-surface-dark border border-surface-highlight rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="size-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center"><span className="material-symbols-outlined">savings</span></div>
                              <div className="flex gap-2">
                                 {isAdmin && <button onClick={() => deleteFund(f.id, f.title)} className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-xs">delete</span></button>}
                                 <button onClick={() => { setSelectedFund(f); setIsFundOpen(true); }} className="text-[8px] font-black bg-white/5 px-3 py-1.5 rounded-lg text-slate-400 uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all">Participer</button>
                              </div>
                           </div>
                           <h4 className="text-[11px] font-black text-white uppercase mb-2">{f.title}</h4>
                           <div className="w-full h-1.5 bg-white/5 rounded-full mb-2"><div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, (f.currentAmount / f.targetAmount) * 100)}%` }} /></div>
                           <p className="text-[10px] font-black text-white">{f.currentAmount.toLocaleString()} FCFA</p>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {filteredEvents.map(e => {
                        const userParticipant = e.participants.find(p => p.profileId === user.id);
                        return (
                           <div key={e.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden group hover:border-primary/50 transition-all border-transparent">
                              <div className="relative h-60">
                                 <img src={e.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-transparent" />

                                 {/* Delete button for admins */}
                                 {isAdmin && (
                                    <button
                                       onClick={() => deleteEvent(e.id)}
                                       className="absolute top-4 right-4 size-10 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                 )}

                                 <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex justify-between items-end">
                                       <div>
                                          <span className="bg-primary/20 text-primary text-[8px] font-black px-3 py-1 rounded-full uppercase mb-2 inline-block border border-primary/20">{e.type}</span>
                                          <h3 className="text-xl font-black text-white uppercase">{e.title}</h3>
                                       </div>
                                       {userParticipant && (
                                          <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase border ${userParticipant.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' :
                                             userParticipant.status === 'rejected' ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                                                'bg-amber-500/20 text-amber-500 border-amber-500/20'
                                             }`}>
                                             {userParticipant.status === 'approved' ? 'Inscrit' : userParticipant.status === 'rejected' ? 'Refusé' : 'En attente'}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                              </div>
                              <div className="p-8">
                                 <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-6 uppercase">
                                    <span>{e.date} • {e.location}</span>
                                    <span className="text-primary">{e.registeredParticipants} / {e.maxParticipants || '∞'} PLACES</span>
                                 </div>
                                 <button
                                    disabled={!!userParticipant && userParticipant.status !== 'rejected'}
                                    onClick={() => handleRegister(e.id)}
                                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase text-white transition-all ${userParticipant ? 'bg-white/5 text-slate-500 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'
                                       }`}
                                 >
                                    {userParticipant ? 'Demande envoyée' : "S'inscrire"}
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            ) : (
               <div className="space-y-10 animate-in fade-in">
                  {/* Gestion Financière par Activité */}
                  <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden">
                     <div className="px-10 py-8 border-b border-white/5 bg-background-dark/20 flex justify-between items-center">
                        <h3 className="text-white font-black text-sm uppercase">Détails Financiers par Activité</h3>
                        <div className="flex gap-4">
                           <select
                              className="bg-black/50 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black text-white uppercase outline-none"
                              value={selectedEventForFinance || ''}
                              onChange={(e) => setSelectedEventForFinance(e.target.value)}
                           >
                              <option value="">Sélectionner une activité...</option>
                              {events.map(e => (
                                 <option key={e.id} value={e.id}>{e.title}</option>
                              ))}
                           </select>
                        </div>
                     </div>

                     {selectedEventForFinance ? (
                        <div className="p-10 space-y-8">
                           {/* Stats rapides pour l'activité */}
                           {(() => {
                              const fund = funds.find(f => f.eventId === selectedEventForFinance);
                              const event = events.find(e => e.id === selectedEventForFinance);
                              if (!fund || !event) return <p className="text-slate-500 font-bold italic uppercase text-[10px]">Aucune caisse liée à cette activité.</p>;

                              const eventContribs = contributions.filter(c => c.fund_id === fund.id);

                              return (
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Total Collecté</p>
                                       <p className="text-2xl font-black text-emerald-500">{fund.currentAmount.toLocaleString()} FCFA</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Objectif (Basé sur max participants)</p>
                                       <p className="text-2xl font-black text-white">{fund.targetAmount.toLocaleString()} FCFA</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                       <p className="text-[8px] font-black text-slate-500 uppercase mb-2">Taux de recouvrement</p>
                                       <p className="text-2xl font-black text-primary">{Math.round((fund.currentAmount / (fund.targetAmount || 1)) * 100)}%</p>
                                    </div>
                                 </div>
                              );
                           })()}

                           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                              {/* Formulaire ajout manuel */}
                              <div className="lg:col-span-1 space-y-6 bg-black/20 p-8 rounded-3xl border border-white/5">
                                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Enregistrer une cotisation</h4>
                                 <div className="space-y-4">
                                    <select
                                       className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-white text-xs"
                                       value={manualContribution.profileId}
                                       onChange={(e) => setManualContribution({ ...manualContribution, profileId: e.target.value })}
                                    >
                                       <option value="">Choisir un résident...</option>
                                       {profiles.map(p => (
                                          <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                       ))}
                                    </select>
                                    <input
                                       type="number"
                                       placeholder="Montant (FCFA)"
                                       className="w-full bg-surface-dark border border-white/10 rounded-xl p-4 text-white text-xs"
                                       value={manualContribution.amount}
                                       onChange={(e) => setManualContribution({ ...manualContribution, amount: e.target.value })}
                                    />
                                    <button
                                       onClick={addManualContribution}
                                       className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20"
                                    >
                                       Ajouter le versement
                                    </button>
                                 </div>
                              </div>

                              {/* Liste des versements pour cette activité */}
                              <div className="lg:col-span-2">
                                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Historique des versements</h4>
                                 <div className="overflow-hidden rounded-2xl border border-white/5">
                                    <table className="w-full text-left text-xs text-white">
                                       <thead><tr className="bg-white/5 font-black text-[9px] text-slate-500 uppercase"><th className="px-6 py-4">Résident</th><th className="px-6 py-4">Montant</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                                       <tbody className="divide-y divide-white/5 font-bold">
                                          {(() => {
                                             const fund = funds.find(f => f.eventId === selectedEventForFinance);
                                             const eventContribs = contributions.filter(c => c.fund_id === fund?.id);
                                             if (eventContribs.length === 0) return <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-600 uppercase text-[10px]">Aucun versement enregistré</td></tr>;
                                             return eventContribs.map(c => (
                                                <tr key={c.id}>
                                                   <td className="px-6 py-4 uppercase text-primary text-[10px]">{c.resident_name}</td>
                                                   <td className="px-6 py-4">{c.amount.toLocaleString()} FCFA</td>
                                                   <td className="px-6 py-4 text-right">
                                                      <button
                                                         onClick={() => deleteContribution(c.id)}
                                                         className="text-red-500/50 hover:text-red-500"
                                                      >
                                                         <span className="material-symbols-outlined text-sm">delete</span>
                                                      </button>
                                                   </td>
                                                </tr>
                                             ));
                                          })()}
                                       </tbody>
                                    </table>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="p-20 text-center">
                           <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">payments</span>
                           <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Sélectionnez une activité pour gérer ses cotisations</p>
                        </div>
                     )}
                  </div>

                  {/* Gestion des Inscriptions */}
                  <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden">
                     <div className="px-10 py-8 border-b border-white/5">
                        <h3 className="text-white font-black text-sm uppercase">Demandes d'inscription en attente</h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white">
                           <thead><tr className="bg-black/20 font-black text-[9px] text-slate-500 uppercase"><th className="px-10 py-5">Résident</th><th className="px-6 py-5">Activité</th><th className="px-6 py-5">Date Demande</th><th className="px-10 py-5 text-right">Décision</th></tr></thead>
                           <tbody className="divide-y divide-white/5">
                              {events.flatMap(e => e.participants.filter(p => p.status === 'pending').map(p => (
                                 <tr key={p.id} className="hover:bg-white/5">
                                    <td className="px-10 py-6 font-black uppercase">{p.firstName} {p.lastName}</td>
                                    <td className="px-6 py-6 uppercase text-primary font-bold">{e.title}</td>
                                    <td className="px-6 py-6 text-slate-500">N/A</td>
                                    <td className="px-10 py-6 text-right space-x-2">
                                       <button onClick={() => updateParticipantStatus(p.id, e.id, 'approved')} className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg font-black uppercase text-[8px] hover:bg-emerald-500 hover:text-white transition-all">Accepter</button>
                                       <button onClick={() => updateParticipantStatus(p.id, e.id, 'rejected')} className="bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg font-black uppercase text-[8px] hover:bg-red-500 hover:text-white transition-all">Refuser</button>
                                    </td>
                                 </tr>
                              )))}
                              {events.every(e => e.participants.filter(p => p.status === 'pending').length === 0) && (
                                 <tr><td colSpan={4} className="px-10 py-10 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">Aucune demande en attente</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Liste des Participants Approuvés */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {events.filter(e => e.participants.some(p => p.status === 'approved')).map(e => (
                        <div key={e.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8">
                           <div className="flex justify-between items-center mb-6">
                              <h4 className="text-xs font-black text-white uppercase">{e.title} (Participants {e.registeredParticipants})</h4>
                              <span className="text-[10px] font-black text-primary uppercase">{e.type}</span>
                           </div>
                           <div className="space-y-2">
                              {e.participants.filter(p => p.status === 'approved').map(p => (
                                 <div key={p.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="text-[10px] font-black text-white uppercase">{p.firstName} {p.lastName}</span>
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">verified</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Gestion des Activités */}
                  <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden">
                     <div className="px-10 py-8 border-b border-white/5 flex justify-between">
                        <h3 className="text-white font-black text-sm uppercase">Toutes les Activités</h3>
                        <button onClick={() => setIsAddEventOpen(true)} className="text-[10px] font-black text-primary uppercase">+ Ajouter</button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white">
                           <thead><tr className="bg-black/20 font-black text-[9px] text-slate-500 uppercase"><th className="px-10 py-5">Événement</th><th className="px-6 py-5">Type</th><th className="px-6 py-5">Inscrits</th><th className="px-10 py-5 text-right">Actions</th></tr></thead>
                           <tbody className="divide-y divide-white/5">
                              {events.map(e => (
                                 <tr key={e.id} className="hover:bg-white/5">
                                    <td className="px-10 py-6 font-black uppercase font-medium">{e.title}</td>
                                    <td className="px-6 py-6 uppercase">{e.type}</td>
                                    <td className="px-6 py-6 font-black text-primary">{e.registeredParticipants} / {e.maxParticipants || '∞'}</td>
                                    <td className="px-10 py-6 text-right"><button onClick={() => deleteEvent(e.id)} className="text-red-500 opacity-50 hover:opacity-100"><span className="material-symbols-outlined text-sm">delete</span></button></td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Versements Récents */}
                  <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden">
                     <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-white font-black text-sm uppercase">Versements (Cajous)</h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white">
                           <thead><tr className="bg-black/20 font-black text-[9px] text-slate-500 uppercase"><th className="px-10 py-5">Résident</th><th className="px-6 py-5">Caisse / Activité</th><th className="px-6 py-5">Montant</th><th className="px-10 py-5 text-right">Actions</th></tr></thead>
                           <tbody className="divide-y divide-white/5">
                              {contributions.map(c => {
                                 const fund = funds.find(f => f.id === c.fund_id);
                                 const eventLink = events.find(e => e.id === fund?.eventId);
                                 return (
                                    <tr key={c.id} className="hover:bg-white/5">
                                       <td className="px-10 py-4 font-black uppercase text-primary">{c.resident_name}</td>
                                       <td className="px-6 py-4 uppercase text-[10px]">
                                          <div className="flex flex-col">
                                             <span className="text-white font-bold">{fund?.title || 'Caisse supprimée'}</span>
                                             {eventLink && <span className="text-primary text-[8px] font-black uppercase mt-1">Activité: {eventLink.title}</span>}
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 font-black">{c.amount.toLocaleString()} FCFA</td>
                                       <td className="px-10 py-4 text-right"><button onClick={() => deleteContribution(c.id)} className="text-red-500/50 hover:text-red-500"><span className="material-symbols-outlined text-sm">cancel</span></button></td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default Loisir;
