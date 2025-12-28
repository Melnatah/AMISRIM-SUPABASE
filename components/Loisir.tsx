import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LeisureEvent, LeisureFund } from '../types';
import { supabase } from '../services/supabase';

type EventType = 'voyage' | 'pique-nique' | 'fete';
type ViewTab = 'explorer' | 'gestion';

interface LoisirProps {
   user: { name: string, role: 'admin' | 'resident' };
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

   // États pour les données
   const [events, setEvents] = useState<LeisureEvent[]>([]);
   const [funds, setFunds] = useState<LeisureFund[]>([]);
   const [loading, setLoading] = useState(true);

   // États pour les modales
   const [isAddEventOpen, setIsAddEventOpen] = useState(false);
   const [isFundOpen, setIsFundOpen] = useState(false);
   const [selectedFund, setSelectedFund] = useState<LeisureFund | null>(null);
   const [contributionAmount, setContributionAmount] = useState('');

   // État pour le nouveau formulaire
   const [newEvent, setNewEvent] = useState({
      title: '',
      type: 'voyage' as EventType,
      date: '',
      location: '',
      description: '',
      costPerPerson: '',
      maxParticipants: '',
      imageUrl: ''
   });

   const fileInputRef = useRef<HTMLInputElement>(null);

   const fetchData = async () => {
      try {
         setLoading(true);
         const { data: eventsData, error: eventsError } = await supabase
            .from('leisure_events')
            .select('*')
            .order('created_at', { ascending: false });

         const { data: fundsData, error: fundsError } = await supabase
            .from('leisure_funds')
            .select('*');

         if (eventsError) throw eventsError;
         if (fundsError) throw fundsError;

         // Map snake_case database fields to camelCase TS interface
         const mappedEvents: LeisureEvent[] = (eventsData || []).map(e => ({
            id: e.id,
            title: e.title,
            type: e.type,
            date: e.event_date,
            location: e.location,
            description: e.description,
            costPerPerson: e.cost_per_person,
            maxParticipants: e.max_participants,
            registeredParticipants: e.registered_participants,
            pendingResidents: e.pending_residents || [],
            status: e.status,
            imageUrl: e.image_url
         }));

         const mappedFunds: LeisureFund[] = (fundsData || []).map(f => ({
            id: f.id,
            title: f.title,
            targetAmount: f.target_amount,
            currentAmount: f.current_amount,
            type: f.type
         }));

         setEvents(mappedEvents);
         setFunds(mappedFunds);
      } catch (error) {
         console.error('Error fetching leisure data:', error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   const filteredEvents = activeFilter === 'all'
      ? events
      : events.filter(e => e.type === activeFilter);

   const handleRegister = async (id: string) => {
      const event = events.find(e => e.id === id);
      if (!event) return;

      if (event.pendingResidents.includes(user.name)) {
         alert("Votre demande est déjà en cours de traitement.");
         return;
      }

      const updatedPending = [...event.pendingResidents, user.name];

      try {
         const { error } = await supabase
            .from('leisure_events')
            .update({ pending_residents: updatedPending })
            .eq('id', id);

         if (error) throw error;

         setEvents(prev => prev.map(e => e.id === id ? { ...e, pendingResidents: updatedPending } : e));
         alert("Votre demande d'inscription a été envoyée à l'administrateur.");
      } catch (error) {
         console.error('Error registering:', error);
         alert("Erreur lors de l'inscription.");
      }
   };

   const approveRegistration = async (eventId: string, residentName: string) => {
      if (!isAdmin) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      if (event.maxParticipants && event.registeredParticipants >= event.maxParticipants) {
         alert("Événement complet.");
         return;
      }

      const updatedPending = event.pendingResidents.filter(name => name !== residentName);
      const updatedRegistered = event.registeredParticipants + 1;

      try {
         const { error } = await supabase
            .from('leisure_events')
            .update({
               pending_residents: updatedPending,
               registered_participants: updatedRegistered
            })
            .eq('id', eventId);

         if (error) throw error;

         setEvents(prev => prev.map(e => e.id === eventId ? { ...e, pendingResidents: updatedPending, registeredParticipants: updatedRegistered } : e));
      } catch (error) {
         console.error(error);
      }
   };

   const rejectRegistration = async (eventId: string, residentName: string) => {
      if (!isAdmin) return;
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const updatedPending = event.pendingResidents.filter(name => name !== residentName);

      try {
         const { error } = await supabase
            .from('leisure_events')
            .update({ pending_residents: updatedPending })
            .eq('id', eventId);

         if (error) throw error;
         setEvents(prev => prev.map(e => e.id === eventId ? { ...e, pendingResidents: updatedPending } : e));
      } catch (error) {
         console.error(error);
      }
   };

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            setNewEvent(prev => ({ ...prev, imageUrl: reader.result as string }));
         };
         reader.readAsDataURL(file);
      }
   };

   const handleCreateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAdmin) return;

      const newEventData = {
         title: newEvent.title,
         type: newEvent.type,
         event_date: newEvent.date,
         location: newEvent.location || 'À définir',
         description: newEvent.description,
         cost_per_person: parseInt(newEvent.costPerPerson) || 0,
         max_participants: parseInt(newEvent.maxParticipants) || null,
         registered_participants: 0,
         pending_residents: [],
         status: 'open',
         image_url: newEvent.imageUrl || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000'
      };

      try {
         const { error } = await supabase.from('leisure_events').insert([newEventData]);
         if (error) throw error;

         fetchData();
         setIsAddEventOpen(false);
         setNewEvent({ title: '', type: 'voyage', date: '', location: '', description: '', costPerPerson: '', maxParticipants: '', imageUrl: '' });
      } catch (error) {
         console.error('Error creating event:', error);
         alert("Erreur lors de la création.");
      }
   };

   const deleteEvent = async (id: string) => {
      if (window.confirm("Supprimer cette activité du catalogue ?")) {
         try {
            await supabase.from('leisure_events').delete().eq('id', id);
            setEvents(prev => prev.filter(e => e.id !== id));
         } catch (error) {
            console.error(error);
         }
      }
   };

   const handleContribution = async () => {
      if (!selectedFund || !contributionAmount) return;

      const amount = parseInt(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
         alert("Montant invalide");
         return;
      }

      try {
         // 1. Insert contribution
         const { error: contribError } = await supabase.from('leisure_contributions').insert([{
            fund_id: selectedFund.id,
            resident_name: user.name,
            amount: amount,
            contribution_date: new Date().toISOString()
         }]);
         if (contribError) throw contribError;

         // 2. Update fund total
         const newTotal = Number(selectedFund.currentAmount) + amount;
         const { error: fundError } = await supabase
            .from('leisure_funds')
            .update({ current_amount: newTotal })
            .eq('id', selectedFund.id);

         if (fundError) throw fundError;

         alert("Versement enregistré !");
         setIsFundOpen(false);
         setContributionAmount('');
         fetchData();
      } catch (error) {
         console.error('Error contributing:', error);
         alert("Erreur lors du versement.");
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
            <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
         </div>
      )
   }

   return (
      <div className="flex h-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta relative">

         {/* BOUTON FLOTTANT D'AJOUT (PERMANENT POUR ADMIN) */}
         {isAdmin && (
            <button
               onClick={() => setIsAddEventOpen(true)}
               className="fixed bottom-20 lg:bottom-10 right-6 lg:right-10 size-14 lg:size-16 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] animate-in slide-in-from-bottom-10"
               title="Ajouter une activité"
            >
               <span className="material-symbols-outlined text-3xl">add</span>
            </button>
         )}

         {/* MODAL : CRÉATION D'ÉVÉNEMENT (AVEC SÉLECTEUR DE TYPE) */}
         {isAddEventOpen && isAdmin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                           <span className="material-symbols-outlined text-2xl">festival</span>
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Organiser un Événement</h3>
                     </div>
                     <button onClick={() => setIsAddEventOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleCreateEvent} className="space-y-8">
                     {/* Sélecteur de Type (selon le classeur) */}
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">1. Choisissez le type (selon le classeur)</label>
                        <div className="grid grid-cols-3 gap-4">
                           {(['voyage', 'pique-nique', 'fete'] as EventType[]).map(type => (
                              <button
                                 key={type}
                                 type="button"
                                 onClick={() => setNewEvent({ ...newEvent, type })}
                                 className={`flex flex-col items-center justify-center p-6 rounded-[1.5rem] border transition-all ${newEvent.type === type
                                       ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10'
                                       : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                                    }`}
                              >
                                 <span className="material-symbols-outlined text-4xl mb-3">
                                    {type === 'voyage' ? 'flight_takeoff' : type === 'pique-nique' ? 'park' : 'nightlife'}
                                 </span>
                                 <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">2. Détails de l'événement</label>
                           <input required className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Titre de l'activité..." />

                           <div className="grid grid-cols-2 gap-4">
                              <input type="date" required className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                              <input className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Lieu..." />
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <input type="number" className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary" value={newEvent.costPerPerson} onChange={e => setNewEvent({ ...newEvent, costPerPerson: e.target.value })} placeholder="Prix par personne (FCFA)" />
                              <input type="number" className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary" value={newEvent.maxParticipants} onChange={e => setNewEvent({ ...newEvent, maxParticipants: e.target.value })} placeholder="Max places..." />
                           </div>
                        </div>

                        <div className="space-y-4 flex flex-col">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">3. Médias & Description</label>
                           <div
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 min-h-[140px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center bg-black/20 hover:border-primary transition-all cursor-pointer overflow-hidden relative"
                           >
                              {newEvent.imageUrl ? (
                                 <img src={newEvent.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                 <>
                                    <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">add_a_photo</span>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Cliquer pour uploader</p>
                                 </>
                              )}
                              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                           </div>
                           <textarea className="w-full h-24 bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-sm text-white outline-none focus:border-primary resize-none" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description..." />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-white/5">
                        <button type="button" onClick={() => setIsAddEventOpen(false)} className="flex-1 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-2xl border border-white/5">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-primary text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-primary/20">Publier l'activité</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL : CAISSE (VERSEMENT) */}
         {isFundOpen && selectedFund && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined text-pink-500">savings</span>
                     {selectedFund.title}
                  </h3>
                  <div className="space-y-3">
                     <input className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-xs text-white outline-none" placeholder="Nom de l'étudiant..." defaultValue={user.name} disabled />
                     <input
                        className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-xs text-white outline-none"
                        placeholder="Montant (FCFA)..."
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                     />
                     <button onClick={handleContribution} className="w-full py-4 bg-pink-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-pink-500/20 mt-2">Confirmer Versement</button>
                  </div>
                  <button onClick={() => setIsFundOpen(false)} className="w-full mt-4 text-[10px] font-black text-slate-500 uppercase">Fermer</button>
               </div>
            </div>
         )}

         <div className="max-w-[1200px] mx-auto w-full space-y-10 pb-20">

            {/* Header avec action */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div className="flex flex-col gap-2">
                  <h2 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Loisir & Détente</h2>
                  <p className="text-slate-500 text-xs md:text-sm">Financement et organisation de la vie communautaire.</p>
               </div>

               {isAdmin && (
                  <div className="flex bg-surface-dark p-1 border border-surface-highlight rounded-2xl shadow-xl">
                     <button
                        onClick={() => setActiveTab('explorer')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'explorer' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >
                        Exploration
                     </button>
                     <button
                        onClick={() => setActiveTab('gestion')}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'gestion' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >
                        Panneau Admin
                     </button>
                  </div>
               )}
            </div>

            {activeTab === 'explorer' ? (
               <div className="space-y-12 animate-in fade-in duration-500">
                  {/* Caisses de financement */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {funds.map(fund => (
                        <div key={fund.id} className="bg-surface-dark border border-surface-highlight rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                           <div className="relative z-10">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="size-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined">savings</span>
                                 </div>
                                 <button onClick={() => { setSelectedFund(fund); setIsFundOpen(true); }} className="text-[8px] font-black bg-white/5 px-3 py-1.5 rounded-lg text-slate-400 uppercase tracking-widest hover:text-white hover:bg-pink-500 transition-all">Participer</button>
                              </div>
                              <h4 className="text-[11px] font-black text-white uppercase mb-4 truncate">{fund.title}</h4>
                              <div className="w-full h-1.5 bg-white/5 rounded-full mb-2">
                                 <div className="h-full bg-pink-500 rounded-full" style={{ width: `${(fund.currentAmount / fund.targetAmount) * 100}%` }}></div>
                              </div>
                              <p className="text-[10px] font-black text-white">{fund.currentAmount.toLocaleString()} <span className="text-[8px] opacity-40 uppercase">FCFA</span></p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Filtrage et Liste des Événements */}
                  <div className="space-y-6">
                     <div className="flex items-center justify-between border-b border-white/5 pb-4 overflow-x-auto hide-scrollbar">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Activités Proposées</h3>
                        <div className="flex gap-2">
                           {(['all', 'voyage', 'pique-nique', 'fete'] as const).map(f => (
                              <button
                                 key={f}
                                 onClick={() => navigate(`/loisir/${f === 'all' ? '' : f}`)}
                                 className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase transition-all whitespace-nowrap ${activeFilter === f ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                              >
                                 {f}
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredEvents.map(event => {
                           const isFull = event.maxParticipants && event.registeredParticipants >= event.maxParticipants;
                           const isPending = event.pendingResidents.includes(user.name);
                           return (
                              <div key={event.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl group border-transparent hover:border-primary/30 transition-all">
                                 <div className="relative h-60">
                                    <img src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={event.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                       <div>
                                          <span className="bg-primary/20 backdrop-blur-md text-primary text-[8px] font-black px-3 py-1 rounded-full uppercase mb-2 inline-block border border-primary/20">{event.type}</span>
                                          <h3 className="text-xl font-black text-white uppercase">{event.title}</h3>
                                       </div>
                                       <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black text-white">
                                          {event.costPerPerson.toLocaleString()} FCFA
                                       </div>
                                    </div>
                                 </div>
                                 <div className="p-8">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                       <div>
                                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Date & Lieu</p>
                                          <p className="text-[11px] text-white font-bold">{event.date} • {event.location}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Disponibilité</p>
                                          <p className="text-[11px] text-primary font-black">{event.registeredParticipants} / {event.maxParticipants || '∞'}</p>
                                       </div>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-medium mb-8 leading-relaxed line-clamp-3">{event.description}</p>
                                    <button
                                       onClick={() => handleRegister(event.id)}
                                       disabled={isFull || isPending}
                                       className={`w-full py-4.5 rounded-2xl border text-[10px] font-black uppercase transition-all shadow-xl active:scale-95 ${isFull
                                             ? 'bg-slate-700 text-slate-500 border-transparent cursor-not-allowed'
                                             : isPending
                                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-wait'
                                                : 'bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary hover:shadow-primary/20'
                                          }`}
                                    >
                                       {isFull ? 'Événement Complet' : isPending ? 'Inscription en attente' : 'S\'inscrire à l\'activité'}
                                    </button>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            ) : (
               /* PANNEAU ADMINISTRATEUR DÉDIÉ */
               <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-20">

                  {/* Statistiques Admin */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                     <AdminStat icon="event" label="Total Activités" value={events.length.toString()} color="text-primary" />
                     <AdminStat icon="pending_actions" label="Demandes en attente" value={events.reduce((acc, e) => acc + e.pendingResidents.length, 0).toString()} color="text-amber-500" />
                     <AdminStat icon="group" label="Inscriptions" value={events.reduce((acc, e) => acc + e.registeredParticipants, 0).toString()} color="text-emerald-500" />
                     <AdminStat icon="payments" label="Financements" value="1.4M FCFA" color="text-indigo-500" />
                  </div>

                  {/* Table de Gestion */}
                  <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] shadow-2xl overflow-hidden">
                     <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-white font-black text-sm uppercase tracking-widest">Gestionnaire de Loisirs</h3>
                        <button onClick={() => setIsAddEventOpen(true)} className="text-[10px] font-black text-primary uppercase flex items-center gap-2 bg-primary/10 px-6 py-3 rounded-xl hover:bg-primary hover:text-white transition-all">
                           <span className="material-symbols-outlined text-sm">add_circle</span> Ajouter (selon classeur)
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-black/20">
                                 <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Activité</th>
                                 <th className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                                 <th className="px-6 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Inscriptions</th>
                                 <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {events.map(event => (
                                 <tr key={event.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-10 py-6">
                                       <div className="flex items-center gap-4">
                                          <div className="size-10 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                             <img src={event.imageUrl} className="w-full h-full object-cover" alt="" />
                                          </div>
                                          <div>
                                             <p className="text-xs font-black text-white uppercase">{event.title}</p>
                                             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{event.date} • {event.location}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-6">
                                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                                          {event.type}
                                       </span>
                                    </td>
                                    <td className="px-6 py-6">
                                       <div className="flex items-center gap-3">
                                          <div className="flex-1 h-1.5 bg-white/5 rounded-full max-w-[80px] overflow-hidden">
                                             <div className="h-full bg-primary" style={{ width: `${Math.min(100, (event.registeredParticipants / (event.maxParticipants || 100)) * 100)}%` }}></div>
                                          </div>
                                          <span className="text-[10px] font-black text-white">{event.registeredParticipants}</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button onClick={() => deleteEvent(event.id)} className="size-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-inner">
                                             <span className="material-symbols-outlined text-sm">delete</span>
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Section Modération */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {events.filter(e => e.pendingResidents.length > 0).map(event => (
                        <div key={event.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 shadow-xl">
                           <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3">
                                 <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-xl">how_to_reg</span>
                                 </div>
                                 <h4 className="text-xs font-black text-white uppercase tracking-widest">{event.title}</h4>
                              </div>
                              <span className="bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-[9px] font-black animate-pulse">
                                 {event.pendingResidents.length} EN ATTENTE
                              </span>
                           </div>
                           <div className="space-y-3">
                              {event.pendingResidents.map(name => (
                                 <div key={name} className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                       <div className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                                          {name.charAt(0)}
                                       </div>
                                       <span className="text-xs font-bold text-white uppercase">{name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                       <button onClick={() => approveRegistration(event.id, name)} className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black rounded-lg uppercase shadow-lg shadow-emerald-500/10 hover:scale-105 transition-all">Valider</button>
                                       <button onClick={() => rejectRegistration(event.id, name)} className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase hover:bg-red-500 hover:text-white transition-all">Refuser</button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                     {events.every(e => e.pendingResidents.length === 0) && (
                        <div className="col-span-full py-20 text-center bg-surface-dark/50 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center">
                           <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                              <span className="material-symbols-outlined text-4xl">done_all</span>
                           </div>
                           <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Toutes les demandes de participation sont à jour.</p>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

const AdminStat = ({ icon, label, value, color }: any) => (
   <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700"></div>
      <div className="relative z-10">
         <div className="flex items-center gap-3 mb-4">
            <div className={`size-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
               <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
         </div>
         <p className="text-2xl font-black text-white">{value}</p>
      </div>
   </div>
);

export default Loisir;
