import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Site, Resident } from '../types';
import { supabase } from '../services/supabase';

interface InternshipSitesProps {
  user: { role: 'admin' | 'resident' };
}

const InternshipSites: React.FC<InternshipSitesProps> = ({ user }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  // États de données
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // États Modales
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  // États Formulaires
  const [newSite, setNewSite] = useState({ name: '', type: 'CHU', supervisor: '', capacity: '3' });
  const [newResident, setNewResident] = useState({ firstName: '', lastName: '', email: '' });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*');

      if (sitesError) throw sitesError;

      // 2. Fetch profiles to map to sites (residents)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // 3. Map residents to sites
      const mappedSites: Site[] = (sitesData || []).map(site => {
        const siteResidents = (profilesData || [])
          .filter(p => p.hospital === site.name) // Matching by name as per current schema logic
          .map(p => ({
            id: p.id,
            firstName: p.first_name || '',
            lastName: p.last_name || ''
          }));

        return {
          ...site,
          residents: siteResidents
        };
      });

      setSites(mappedSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('sites-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sites' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtrer les sites si un ID est présent dans l'URL
  const displayedSites = id ? sites.filter(s => s.id === id) : sites;

  const handleAddSite = async () => {
    if (!isAdmin) return;
    if (!newSite.name || !newSite.supervisor) {
      alert("Veuillez remplir le nom du site et le responsable.");
      return;
    }

    try {
      const { error } = await supabase.from('sites').insert([
        {
          name: newSite.name,
          type: newSite.type,
          supervisor: newSite.supervisor,
          duration: '6 mois',
          equipment: ['Scanner', 'Échographie'],
          capacity: `${newSite.capacity} places`,
          status: 'available'
        }
      ]);

      if (error) throw error;

      fetchData(); // Refresh
      setIsAddSiteModalOpen(false);
      setNewSite({ name: '', type: 'CHU', supervisor: '', capacity: '3' });
    } catch (error) {
      console.error('Error adding site:', error);
      alert('Erreur lors de la création du site');
    }
  };

  const handleAddResident = async () => {
    if (!isAdmin || !activeSiteId || !newResident.lastName) return;

    // Note: Creating a brand new user/resident from admin panel is complex because it involves Auth.
    // Ideally, the resident should already exist and we just assign them to a hospital.
    // For this demo, let's assume we are just updating an existing profile OR creating a dummy profile entry if auth is not strictly enforced for listing.
    // However, `profiles.id` references `auth.users.id`. We cannot insert into profiles easily without a user.
    // PLAN: We will just search for a user by email or name to assign them, OR create a 'ghost' profile if constraint allows (it doesn't, FK exists).

    // Fallback: We'll imply that we are searching and assigning an EXISTING user by updating their hospital.
    // But since the UI asks for First/Last name to "create", I will assume we want to CREATE a placeholder.
    // Since I can't create an Auth User from here easily without Admin API (which I can't easily use from client),
    // I will change the logic to: "Update a profile to assign to this hospital".
    // But to keep it simple for the user request "Make it work", and since I have RLS policies...

    // REVISED PLAN: We will create a local "mock" update for now because creating Auth users is a separate flow.
    // ACTUALLY, for the purpose of "Assigning", let's assume the user enters an EMAIL of an existing user to assign them.
    // OR, better: The UI shows "Add Resident", let's assume we just want to create a row in a separate `site_assignments` table?
    // Current schema uses `hospital` column in `profiles`.

    // Hack for Demo: I'll accept that we can't easily "create" a resident here without them signing up first.
    // I will just alert the user "Pour ajouter un résident, il doit d'abord s'inscrire, puis vous pouvez modifier son hôpital dans son profil ou ici (future feature)."
    // BUT, the user wants "Everything functional".
    // Let's implement a "Fake" assignment by just updating the local state to show it works visually, OR properly implementing a 'Ghost' resident if I hadn't put the FK constraint.
    // I put the FK constraint `id UUID REFERENCES auth.users(id)`. So I strictly cannot create a profile without an auth user.

    // Compromise: I will check if I can find a profile with matching name/email to assign.
    // If not, I will show an alert.

    alert("Note: Dans cette version intégrée, le résident doit d'abord créer son compte via la page d'inscription. Une fois inscrit, il apparaîtra dans la liste globale et pourra être affecté.");

    // Alternative: We can update the currently logged in user just to show it works? No that's bad.
    // Real solution: Update `profiles` set `hospital` = site.name WHERE ...
    // Since we only have "First Name / Last Name" in the form...
    // Let's try to find a match.

    try {
      // Try to finding by last name
      const { data: foundProfiles } = await supabase
        .from('profiles')
        .select('*')
        .ilike('last_name', newResident.lastName);

      if (foundProfiles && foundProfiles.length > 0) {
        const profileToUpdate = foundProfiles[0];
        const activeSite = sites.find(s => s.id === activeSiteId);
        if (!activeSite) return;

        await supabase
          .from('profiles')
          .update({ hospital: activeSite.name })
          .eq('id', profileToUpdate.id);

        fetchData();
        setIsAddResidentModalOpen(false);
        setNewResident({ firstName: '', lastName: '', email: '' });
        alert(`Résident ${profileToUpdate.last_name} affecté avec succès !`);
      } else {
        alert("Aucun résident inscrit trouvé avec ce nom de famille. Invitez-le à s'inscrire d'abord.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeResident = async (siteId: string, residentId: string) => {
    if (!isAdmin) return;
    if (window.confirm("Voulez-vous retirer ce résident de ce site ?")) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ hospital: null })
          .eq('id', residentId);

        if (error) {
          alert("Erreur lors du retrait du résident : " + error.message);
        } else {
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!isAdmin) return;
    if (window.confirm("Supprimer définitivement ce centre hospitalier de la liste ?")) {
      try {
        const { error } = await supabase.from('sites').delete().eq('id', siteId);
        if (error) {
          alert("Erreur lors de la suppression : " + error.message);
        } else {
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
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
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-10 bg-background-light dark:bg-background-dark font-jakarta relative">

      {/* MODAL: AJOUT CENTRE HOSPITALIER */}
      {isAddSiteModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">add_business</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Nouveau Site de Stage</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nom du Centre / Hôpital</label>
                <input
                  autoFocus
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: CHU Sylvanus Olympio"
                  value={newSite.name}
                  onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Responsable du Stage</label>
                <input
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: Pr. Agbeko"
                  value={newSite.supervisor}
                  onChange={e => setNewSite({ ...newSite, supervisor: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Type d'établissement</label>
                  <select
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm"
                    value={newSite.type}
                    onChange={e => setNewSite({ ...newSite, type: e.target.value })}
                  >
                    <option value="CHU">CHU</option>
                    <option value="CHR">CHR</option>
                    <option value="CMA">CMA</option>
                    <option value="Clinique">Clinique</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Places Disponibles</label>
                  <input
                    type="number"
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                    placeholder="3"
                    value={newSite.capacity}
                    onChange={e => setNewSite({ ...newSite, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddSiteModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button onClick={handleAddSite} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Créer le site</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AFFECTER UN ETUDIANT */}
      {isAddResidentModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Affecter un Résident</h3>
            </div>
            <div className="space-y-5">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-medium">
                <p>Recherchez un résidant existant par son nom de famille pour l'affecter.</p>
              </div>
              {/*
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Prénom de l'Étudiant</label>
                <input 
                  autoFocus
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium"
                  placeholder="Jean-Luc"
                  value={newResident.firstName}
                  onChange={e => setNewResident({...newResident, firstName: e.target.value})}
                />
              </div>
              */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nom de Famille (Recherche)</label>
                <input
                  autoFocus
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium"
                  placeholder="ex: KOFFI"
                  value={newResident.lastName}
                  onChange={e => setNewResident({ ...newResident, lastName: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddResidentModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button onClick={handleAddResident} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">Affecter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto flex flex-col gap-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              <Link to="/sites" className="hover:text-primary transition-colors">Cursus Clinique</Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary">{id ? 'Détails du centre' : 'Tous les sites de stage'}</span>
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl uppercase">
              {id ? 'Détails du Site' : 'Gestion des Stages'}
            </h2>
            <p className="text-slate-500 text-sm max-w-xl">
              {id ? 'Consultez les informations détaillées et la liste des résidents affectés à ce centre.' : 'Affectation des résidents et suivi des responsables par centre hospitalier.'}
            </p>
          </div>
          <div className="flex gap-4">
            {id && (
              <button
                onClick={() => navigate('/sites')}
                className="flex items-center gap-3 rounded-[1.5rem] bg-white dark:bg-surface-dark border border-white/10 px-8 py-5 text-xs font-black text-slate-500 dark:text-white shadow-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                RETOUR
              </button>
            )}
            {!id && isAdmin && (
              <button
                onClick={() => setIsAddSiteModalOpen(true)}
                className="flex items-center gap-3 rounded-[1.5rem] bg-primary px-10 py-5 text-xs font-black text-white shadow-2xl shadow-primary/30 hover:scale-105 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add_business</span>
                AJOUTER UN SITE
              </button>
            )}
          </div>
        </div>

        {/* GRILLE DES SITES */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {displayedSites.map((site) => (
            <div key={site.id} className={`group relative flex flex-col bg-white dark:bg-surface-dark rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 transition-all hover:border-primary/20 ${id ? 'xl:col-span-2' : ''}`}>
              <div className="p-8 md:p-12 flex flex-col h-full">

                {/* Header Carte Site */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-6">
                    <div className="size-16 md:size-20 rounded-[1.5rem] md:rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl md:text-5xl">apartment</span>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors leading-tight mb-2">{site.name}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">{site.type}</span>
                        <div className="size-1 rounded-full bg-slate-700 hidden md:block"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">person</span>
                          Responsable : {site.supervisor}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge status={site.residents.length >= parseInt(site.capacity) ? 'full' : 'available'} />
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSite(site.id); }}
                        className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        title="Supprimer ce site"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Overview (Shown only when not in detail view) */}
                {!id && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupation du centre</p>
                      <p className="text-sm font-black text-primary">{site.residents.length} / {site.capacity} places</p>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-1000 ${site.residents.length >= parseInt(site.capacity) ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, (site.residents.length / parseInt(site.capacity)) * 100)}%` }}
                      ></div>
                    </div>
                    <button
                      onClick={() => navigate(`/sites/${site.id}`)}
                      className="w-full mt-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-primary hover:border-primary transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      Consulter les Détails & Résidents
                    </button>
                  </div>
                )}

                {/* LISTE DES ETUDIANTS (Shown only in detail view OR if ID is null we hide it for brevity) */}
                {id && (
                  <div className="bg-background-dark/40 rounded-[2.5rem] p-8 border border-white/5 mb-10 flex-1">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                          <span className="material-symbols-outlined text-sm text-primary filled">groups</span>
                          Résidents affectés
                        </h4>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{site.residents.length} / {site.capacity}</p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => { setActiveSiteId(site.id); setIsAddResidentModalOpen(true); }}
                          className="text-[9px] font-black text-white bg-primary hover:bg-primary-dark px-5 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          Affecter un Résident
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {site.residents.length > 0 ? (
                        site.residents.map(res => (
                          <div key={res.id} className="flex items-center justify-between p-5 rounded-2xl bg-surface-dark border border-white/5 group/res hover:border-primary/40 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                {res.lastName.charAt(0)}{res.firstName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-white leading-none mb-1">{res.lastName}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{res.firstName}</p>
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => removeResident(site.id, res.id)}
                                className="size-8 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center opacity-0 group-hover/res:opacity-100"
                                title="Retirer le résident"
                              >
                                <span className="material-symbols-outlined text-sm">person_remove</span>
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-dark-border rounded-[2rem] bg-black/10">
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Aucun résident posté dans ce centre</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Carte Site */}
                <div className={`grid grid-cols-2 gap-6 mt-auto pt-6 border-t border-white/5 ${!id ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-500">meeting_room</span>
                    <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Capacité</p>
                      <p className="text-sm font-black text-white">{site.capacity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-500">calendar_month</span>
                    <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Rotation</p>
                      <p className="text-sm font-black text-white">{site.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: any }) => {
  const configs = {
    available: { label: 'En rotation', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    full: { label: 'Effectif Complet', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
  };
  const config = configs[status as keyof typeof configs] || configs.available;
  return (
    <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.15em] border ${config.color} shadow-sm`}>
      {config.label}
    </span>
  );
};

export default InternshipSites;
