import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Site, Profile } from '../types';
import { sites, profiles } from '../services/api';

interface InternshipSitesProps {
  user: { id: string, name: string, role: 'admin' | 'resident' };
}

const InternshipSites: React.FC<InternshipSitesProps> = ({ user }) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  // États de données
  const [sitesList, setSitesList] = useState<Site[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // États Modales
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isEditSiteModalOpen, setIsEditSiteModalOpen] = useState(false);
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);

  // États Formulaires
  const [newSite, setNewSite] = useState({ name: '', type: 'CHU', supervisor: '', address: '', phone: '', email: '' });
  const [editSite, setEditSite] = useState({ id: '', name: '', type: 'CHU', supervisor: '', address: '', phone: '', email: '' });
  const [selectedResidentId, setSelectedResidentId] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [sitesData, profilesData] = await Promise.all([
        sites.getAll(),
        profiles.getAll() // Fetch profiles for assignment
      ]);
      setSitesList(sitesData);
      setProfilesList(profilesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrer les sites si un ID est présent dans l'URL
  const displayedSites = id ? sitesList.filter(s => s.id === id) : sitesList;

  const handleAddSite = async () => {
    if (!isAdmin) return;
    if (!newSite.name || !newSite.supervisor) {
      alert("Veuillez remplir le nom du site et le responsable.");
      return;
    }

    try {
      await sites.create(newSite);
      fetchData(); // Refresh
      setIsAddSiteModalOpen(false);
      setNewSite({ name: '', type: 'CHU', supervisor: '', address: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error adding site:', error);
      alert('Erreur lors de la création du site');
    }
  };

  const handleEditSite = async () => {
    if (!isAdmin) return;
    if (!editSite.name || !editSite.supervisor) {
      alert("Veuillez remplir le nom du site et le responsable.");
      return;
    }

    try {
      const { id, ...data } = editSite;
      await sites.update(id, data);
      fetchData();
      setIsEditSiteModalOpen(false);
      setEditSite({ id: '', name: '', type: 'CHU', supervisor: '', address: '', phone: '', email: '' });
    } catch (error) {
      console.error('Error updating site:', error);
      alert('Erreur lors de la modification du site');
    }
  };

  const openEditModal = (site: Site) => {
    setEditSite({
      id: site.id,
      name: site.name,
      type: site.type || 'CHU',
      supervisor: site.supervisor || '',
      address: site.address || '',
      phone: site.phone || '',
      email: site.email || ''
    });
    setIsEditSiteModalOpen(true);
  };

  const handleAddResident = async () => {
    if (!isAdmin || !activeSiteId || !selectedResidentId) return;

    try {
      await sites.assignResident(activeSiteId, selectedResidentId);
      fetchData();
      setIsAddResidentModalOpen(false);
      setSelectedResidentId('');
      alert(`Résident affecté avec succès !`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'affectation.");
    }
  };

  const removeResident = async (siteId: string, residentId: string) => {
    if (!isAdmin) return;
    if (window.confirm("Voulez-vous retirer ce résident de ce site ?")) {
      try {
        await sites.removeResident(siteId, residentId);
        fetchData();
      } catch (e) {
        console.error(e);
        alert("Erreur lors du retrait.");
      }
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!isAdmin) return;
    if (window.confirm("Supprimer définitivement ce centre hospitalier de la liste ?")) {
      try {
        await sites.delete(siteId);
        fetchData();
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

  // Filter out residents already assigned to ANY site (optional logic, but safer)
  // Actually, we might want to re-assign someone. So let's show everyone or show current site.
  // For now show all.

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
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Localisation / Adresse</label>
                <input
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: Boulevard de la Paix, Lomé"
                  value={newSite.address}
                  onChange={e => setNewSite({ ...newSite, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Téléphone</label>
                  <input
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                    placeholder="ex: +228 22 21 ..."
                    value={newSite.phone}
                    onChange={e => setNewSite({ ...newSite, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input
                    type="email"
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                    placeholder="ex: contact@chu.tg"
                    value={newSite.email}
                    onChange={e => setNewSite({ ...newSite, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
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
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddSiteModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button onClick={handleAddSite} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Créer le site</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MODIFIER SITE */}
      {isEditSiteModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">edit</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Modifier le Site</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nom du Centre / Hôpital</label>
                <input
                  autoFocus
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: CHU Sylvanus Olympio"
                  value={editSite.name}
                  onChange={e => setEditSite({ ...editSite, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Responsable du Stage</label>
                <input
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: Pr. Agbeko"
                  value={editSite.supervisor}
                  onChange={e => setEditSite({ ...editSite, supervisor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Localisation / Adresse</label>
                <input
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                  placeholder="ex: Boulevard de la Paix, Lomé"
                  value={editSite.address}
                  onChange={e => setEditSite({ ...editSite, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Téléphone</label>
                  <input
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                    placeholder="ex: +228 22 21 ..."
                    value={editSite.phone}
                    onChange={e => setEditSite({ ...editSite, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input
                    type="email"
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm font-medium focus:ring-2 focus:ring-primary/50"
                    placeholder="ex: contact@chu.tg"
                    value={editSite.email}
                    onChange={e => setEditSite({ ...editSite, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Type d'établissement</label>
                  <select
                    className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm"
                    value={editSite.type}
                    onChange={e => setEditSite({ ...editSite, type: e.target.value })}
                  >
                    <option value="CHU">CHU</option>
                    <option value="CHR">CHR</option>
                    <option value="CMA">CMA</option>
                    <option value="Clinique">Clinique</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsEditSiteModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button onClick={handleEditSite} className="flex-1 py-4 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20">Modifier</button>
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
                <p>Sélectionnez un résident inscrit pour l'affecter à ce site.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Résident</label>
                <select
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm"
                  value={selectedResidentId}
                  onChange={e => setSelectedResidentId(e.target.value)}
                >
                  <option value="">-- Choisir un résident --</option>
                  {profilesList.map(p => (
                    <option key={p.id} value={p.id}>Dr {p.lastName} {p.firstName} {p.year ? `(${p.year})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddResidentModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-widest text-[10px]">Annuler</button>
                <button
                  onClick={handleAddResident}
                  disabled={!selectedResidentId}
                  className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Affecter
                </button>
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
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(site); }}
                          className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-amber-500 hover:text-white"
                          title="Modifier ce site"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSite(site.id); }}
                          className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          title="Supprimer ce site"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Overview (Shown only when not in detail view) */}
                {!id && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Effectif actuel</p>
                      <p className="text-sm font-black text-primary">{site.residents?.length || 0} {site.residents?.length > 1 ? 'Résidents' : 'Résident'}</p>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-primary/20 w-full"></div>
                    </div>
                    <button
                      onClick={() => navigate(`/sites/${site.id}`)}
                      className="w-full mt-8 py-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      Consulter Détails & Liste des Résidents
                    </button>
                  </div>
                )}

                {/* DETAILED INFO (Location, Contact) */}
                {id && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="flex items-center gap-4 bg-background-dark/20 p-5 rounded-[2rem] border border-white/5">
                      <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">location_on</span>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase">Adresse</p>
                        <p className="text-[11px] font-black text-white">{site.address || 'Non renseigné'}</p>
                        {site.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-primary hover:text-primary-dark flex items-center gap-1 mt-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">navigation</span>
                            Voir sur Maps
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-background-dark/20 p-5 rounded-[2rem] border border-white/5">
                      <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">call</span>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase">Contact</p>
                        <p className="text-[11px] font-black text-white">{site.phone || 'Non renseigné'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-background-dark/20 p-5 rounded-[2rem] border border-white/5">
                      <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">mail</span>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase">Email</p>
                        <p className="text-[11px] font-black text-white truncate max-w-[150px]">{site.email || 'Non renseigné'}</p>
                      </div>
                    </div>
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
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{site.residents?.length || 0} {site.residents?.length > 1 ? 'Résidents' : 'Résident'}</p>
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
                      {site.residents && site.residents.length > 0 ? (
                        site.residents.map(res => (
                          <div key={res.id} className="flex items-center justify-between p-5 rounded-2xl bg-surface-dark border border-white/5 group/res hover:border-primary/40 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                                {res.lastName?.charAt(0)}{res.firstName?.charAt(0)}
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

                <div className={`flex items-center gap-6 mt-auto pt-6 border-t border-white/5 ${!id ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-slate-500">groups</span>
                    <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Nombre total d'étudiants</p>
                      <p className="text-sm font-black text-white">{site.residents?.length || 0}</p>
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

export default InternshipSites;
