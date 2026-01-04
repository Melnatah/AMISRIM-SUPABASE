
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Subject, YearCurriculum, Module, AcademicItem } from '../types';
import { education } from '../services/api';

type Category = 'cours' | 'staff' | 'epu' | 'diu';

interface EducationProps {
   user: { id: string, name: string, role: 'admin' | 'resident' };
}

const Education: React.FC<EducationProps> = ({ user }) => {
   const isAdmin = user.role === 'admin';
   const location = useLocation();
   const navigate = useNavigate();

   const getCategoryFromPath = (): Category => {
      const path = location.pathname;
      if (path.includes('/staff')) return 'staff';
      if (path.includes('/epu')) return 'epu';
      if (path.includes('/diu')) return 'diu';
      return 'cours';
   };

   const activeCategory = getCategoryFromPath();
   const [activeYear, setActiveYear] = useState(1);
   const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
   const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   // Data State
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [modules, setModules] = useState<Module[]>([]);

   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [addType, setAddType] = useState<'subject' | 'module' | 'item' | 'file'>('subject');
   const [newName, setNewName] = useState('');
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [isUploading, setIsUploading] = useState(false);
   const [targetModuleId, setTargetModuleId] = useState<string | null>(null);

   useEffect(() => {
      setSelectedSubjectId(null);
      setSelectedItemId(null);
   }, [activeCategory]);

   const fetchData = async () => {
      try {
         setLoading(true);
         console.log('Fetching education data...');
         const [subjData, modData] = await Promise.all([
            education.getSubjects(),
            education.getModules()
         ]);
         console.log('API Response - Subjects:', subjData);
         console.log('API Response - Modules:', modData);

         setSubjects(subjData);
         setModules(modData);
      } catch (e) {
         console.error("Error fetching education data", e);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
      // Realtime subscription removed
   }, []);

   const getCurriculum = (): YearCurriculum[] => {
      const years = [1, 2, 3, 4];
      return years.map(y => {
         const yearSubjects = subjects
            .filter(s => (s.category === 'cours' || !s.category) && s.year === y)
            .map(s => ({
               ...s,
               modules: modules.filter(m => m.subjectId === s.id)
            }));
         return { year: y, subjects: yearSubjects };
      });
   };

   const getStaffModules = (): Module[] => modules.filter(m => m.category === 'staff');

   const getItems = (cat: 'epu' | 'diu'): AcademicItem[] => {
      return subjects
         .filter(s => s.category === cat)
         .map(s => ({
            id: s.id,
            name: s.name,
            description: '',
            modules: modules.filter(m => m.subjectId === s.id)
         }));
   };

   const handleCategoryChange = (cat: Category) => navigate(`/education/${cat}`);

   const handleFileUpload = async (file: File, moduleId: string) => {
      await education.uploadFile(file, { moduleId });
   };


   const handleAdd = async () => {
      if (!isAdmin) {
         alert("Vous devez être administrateur pour effectuer cette action.");
         return;
      }

      // Validation des entrées
      if (addType !== 'file' && !newName.trim()) {
         alert("Veuillez entrer un nom.");
         return;
      }

      if (addType === 'file' && !selectedFile) {
         alert("Veuillez sélectionner un fichier.");
         return;
      }

      try {
         setIsUploading(true);
         console.log('=== DÉBUT AJOUT ===');
         console.log('Type:', addType);
         console.log('Catégorie:', activeCategory);
         console.log('Nom:', newName);

         // AJOUT DE MATIÈRE (SUBJECT)
         if (addType === 'subject' || addType === 'item') {
            const subjectData: any = {
               name: newName.trim(),
               category: activeCategory
            };

            // Ajouter l'année seulement pour les cours
            if (activeCategory === 'cours') {
               subjectData.year = activeYear;
            }

            console.log('Données subject à envoyer:', subjectData);
            const result = await education.createSubject(subjectData);
            console.log('Subject créé:', result);
            alert(`Matière "${newName}" ajoutée avec succès !`);
         }

         // AJOUT DE MODULE
         else if (addType === 'module') {
            const parentId = activeCategory === 'cours' ? selectedSubjectId : selectedItemId;

            if (!parentId && activeCategory !== 'staff') {
               alert("Veuillez d'abord sélectionner une matière.");
               return;
            }

            const moduleData: any = {
               name: newName.trim(),
               category: activeCategory
            };

            if (parentId) {
               moduleData.subjectId = parentId;
            }

            console.log('Données module à envoyer:', moduleData);
            const result = await education.createModule(moduleData);
            console.log('Module créé:', result);

            // Si un fichier est sélectionné, l'uploader
            if (selectedFile) {
               console.log('Upload du fichier associé...');
               await handleFileUpload(selectedFile, result.id);
            }

            alert(`Module "${newName}" ajouté avec succès !`);
         }

         // AJOUT DE FICHIER
         else if (addType === 'file') {
            if (!targetModuleId) {
               alert("Erreur: Aucun module cible spécifié.");
               return;
            }

            console.log('Upload du fichier vers le module:', targetModuleId);
            await handleFileUpload(selectedFile!, targetModuleId);
            alert(`Fichier "${selectedFile!.name}" ajouté avec succès !`);
         }

         // Réinitialiser et rafraîchir
         setIsAddModalOpen(false);
         setNewName('');
         setSelectedFile(null);
         setTargetModuleId(null);
         await fetchData();

         console.log('=== AJOUT RÉUSSI ===');

      } catch (error: any) {
         console.error('=== ERREUR LORS DE L\'AJOUT ===');
         console.error('Error object:', error);
         console.error('Error message:', error?.message);
         console.error('Error details:', error?.details);

         let errorMessage = 'Une erreur est survenue';

         if (error?.details) {
            // Erreur de validation Zod
            const details = Array.isArray(error.details) ? error.details : [error.details];
            errorMessage = 'Erreur de validation:\n' + details.map((d: any) =>
               `- ${d.path?.join('.') || 'champ'}: ${d.message}`
            ).join('\n');
         } else if (error?.message) {
            errorMessage = error.message;
         } else if (error?.error) {
            errorMessage = error.error;
         } else if (typeof error === 'string') {
            errorMessage = error;
         }

         alert(`❌ Erreur lors de l'ajout:\n\n${errorMessage}\n\nConsultez la console pour plus de détails.`);
      } finally {
         setIsUploading(false);
      }
   };


   const handleDeleteSubject = async (id: string, name: string) => {
      if (!isAdmin || !window.confirm(`Supprimer "${name}" ?`)) return;
      try {
         await education.deleteSubject(id);
         fetchData();
      } catch (e) { alert("Erreur suppression"); }
   };

   const handleDeleteModule = async (id: string, name: string) => {
      if (!isAdmin || !window.confirm(`Supprimer "${name}" ?`)) return;
      try {
         await education.deleteModule(id);
         fetchData();
      } catch (e) { alert("Erreur suppression"); }
   };

   const handleDeleteFile = async (id: string, name: string) => {
      if (!isAdmin || !window.confirm(`Supprimer "${name}" ?`)) return;
      try {
         await education.deleteFile(id);
         fetchData();
      } catch (e) { alert("Erreur suppression"); }
   };

   const handleDownload = (url: string, name: string) => {
      if (!url) return;
      window.open(url, '_blank');
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
            <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
         </div>
      );
   }

   const curriculum = getCurriculum();
   const staffModules = getStaffModules();
   const epuItems = getItems('epu');
   const diuItems = getItems('diu');

   return (
      <div className="flex h-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta">
         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">add_circle</span>
                     Ajouter {addType === 'subject' ? 'Matière' : addType === 'module' ? 'Module' : addType === 'file' ? 'Fichier' : 'Item'}
                  </h3>

                  {addType !== 'file' && (
                     <input type="text" className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-white text-sm mb-4 outline-none" placeholder="Titre..." value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                  )}

                  {(addType === 'module' || addType === 'file') && (
                     <div className="mb-6">
                        <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">
                           {addType === 'module' ? 'Fichier (Optionnel)' : 'Sélectionner le fichier'}
                        </label>
                        <input
                           type="file"
                           className="text-[10px] text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                           onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                        />
                     </div>
                  )}

                  <div className="flex gap-3">
                     <button onClick={() => { setIsAddModalOpen(false); setSelectedFile(null); }} className="flex-1 py-3 text-[10px] font-black text-slate-500 uppercase" disabled={isUploading}>Annuler</button>
                     <button onClick={handleAdd} className="flex-1 py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase flex items-center justify-center gap-2" disabled={isUploading}>
                        {isUploading ? <div className="size-3 border-2 border-white border-t-transparent animate-spin rounded-full"></div> : 'Confirmer'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         <div className="max-w-[1200px] mx-auto w-full space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Académie AMIS-RIM</h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">Gérez et consultez les ressources pédagogiques nationales.</p>
               </div>
               <div className="flex p-1 bg-surface-dark border border-surface-highlight rounded-2xl overflow-x-auto hide-scrollbar w-full md:w-auto">
                  {(['cours', 'staff', 'epu', 'diu'] as Category[]).map(cat => (
                     <button key={cat} onClick={() => handleCategoryChange(cat)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{cat}</button>
                  ))}
               </div>
            </div>

            {activeCategory === 'cours' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-4 gap-3">
                     {[1, 2, 3, 4].map(y => (
                        <button key={y} onClick={() => { setActiveYear(y); setSelectedSubjectId(null); }} className={`p-4 rounded-2xl border transition-all ${activeYear === y ? 'bg-primary/10 border-primary text-primary shadow-xl' : 'bg-surface-dark border-surface-highlight text-slate-500'}`}>
                           <p className="text-2xl font-black">{y}è</p><p className="text-[8px] font-black uppercase opacity-60">Année</p>
                        </button>
                     ))}
                  </div>
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Matières de l'année {activeYear}
                        <button onClick={fetchData} className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-primary transition-all" title="Actualiser">
                           <span className="material-symbols-outlined text-sm">refresh</span>
                        </button>
                     </h3>
                     {isAdmin && <button onClick={() => { setAddType('subject'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> Ajouter Matière</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {curriculum.find(y => y.year === activeYear)?.subjects.map(subj => (
                        <div key={subj.id} className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                 <h4 className="text-white font-black text-sm uppercase">{subj.name}</h4>
                                 <span className="bg-white/5 text-slate-500 text-[8px] font-black px-2 py-1 rounded inline-block mt-1">{subj.modules.length} Modules</span>
                              </div>
                              {isAdmin && <button onClick={() => handleDeleteSubject(subj.id, subj.name)} className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>}
                           </div>
                           <button onClick={() => setSelectedSubjectId(selectedSubjectId === subj.id ? null : subj.id)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSubjectId === subj.id ? 'bg-primary text-white' : 'bg-white/5 text-slate-400'}`}>{selectedSubjectId === subj.id ? "Replier" : "Voir les Modules"}</button>
                           {selectedSubjectId === subj.id && (
                              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                 {subj.modules.map(mod => (
                                    <div key={mod.id} className="p-4 rounded-2xl bg-black/30 border border-white/5">
                                       <div className="flex justify-between items-center mb-2">
                                          <p className="text-xs font-black text-primary uppercase">{mod.name}</p>
                                          <div className="flex items-center gap-2">
                                             <span className="text-[8px] font-bold text-slate-500">{mod.files.length} fichiers</span>
                                             {isAdmin && (
                                                <div className="flex gap-1">
                                                   <button onClick={() => { setTargetModuleId(mod.id); setAddType('file'); setIsAddModalOpen(true); }} className="text-primary hover:text-white transition-colors" title="Ajouter un fichier"><span className="material-symbols-outlined text-xs">add_circle</span></button>
                                                   <button onClick={() => handleDeleteModule(mod.id, mod.name)} className="text-red-500 transition-colors"><span className="material-symbols-outlined text-xs">delete</span></button>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                       <div className="space-y-1">
                                          {mod.files.map(f => (
                                             <div key={f.id} className="flex items-center justify-between py-2 text-[10px] text-slate-400 border-t border-white/5">
                                                <span className="truncate">{f.name}</span>
                                                <div className="flex items-center gap-2">
                                                   <button onClick={() => handleDownload(f.url || '', f.name)} className="material-symbols-outlined text-sm hover:text-white">download</button>
                                                   {isAdmin && <button onClick={() => handleDeleteFile(f.id, f.name)} className="material-symbols-outlined text-sm text-red-500">delete</button>}
                                                </div>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 ))}
                                 {isAdmin && <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[8px] font-black text-slate-600 uppercase hover:text-primary transition-all">+ Ajouter un Module</button>}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeCategory === 'staff' && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Modules de Staff Scientifique</h3>
                     {isAdmin && <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> Nouveau Module</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {staffModules.map(mod => (
                        <div key={mod.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                           <div className="flex justify-between items-start mb-6">
                              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-2xl">menu_book</span></div>
                              {isAdmin && <button onClick={() => handleDeleteModule(mod.id, mod.name)} className="size-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>}
                           </div>
                           <h4 className="text-white font-black text-base uppercase mb-2 leading-tight">{mod.name}</h4>
                           <p className="text-slate-500 text-[10px] font-medium mb-6 flex-1">{mod.description || "Présentations et cas cliniques."}</p>
                           <div className="space-y-2">
                              {mod.files.map(f => (
                                 <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/50 transition-all">
                                    <span className="text-[10px] font-bold text-slate-300 truncate">{f.name}</span>
                                    <div className="flex items-center gap-2">
                                       <button onClick={() => handleDownload(f.url || '', f.name)} className="material-symbols-outlined text-slate-500 hover:text-white text-base">download</button>
                                       {isAdmin && <button onClick={() => handleDeleteFile(f.id, f.name)} className="material-symbols-outlined text-red-500 text-base">delete</button>}
                                    </div>
                                 </div>
                              ))}
                              {isAdmin && (
                                 <button onClick={() => { setTargetModuleId(mod.id); setAddType('file'); setIsAddModalOpen(true); }} className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[8px] font-black text-slate-500 uppercase hover:text-primary transition-all">+ Ajouter Fichier</button>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {(activeCategory === 'epu' || activeCategory === 'diu') && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Liste des Items {activeCategory.toUpperCase()}</h3>
                     {isAdmin && <button onClick={() => { setAddType('item'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1"><span className="material-symbols-outlined text-sm">add</span> Ajouter un Item</button>}
                  </div>
                  <div className="space-y-4">
                     {(activeCategory === 'epu' ? epuItems : diuItems).map(item => (
                        <div key={item.id} className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div className="flex-1">
                                 <h4 className="text-xl font-black text-white uppercase tracking-tight">{item.name}</h4>
                                 <div className="flex items-center gap-3 mt-1">
                                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">{item.modules.length} modules thématiques</p>
                                    {isAdmin && <button onClick={() => handleDeleteSubject(item.id, item.name)} className="text-red-500 hover:text-red-700 transition-colors"><span className="material-symbols-outlined text-xs">delete</span></button>}
                                 </div>
                              </div>
                              <button onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedItemId === item.id ? 'bg-white text-primary shadow-2xl' : 'bg-primary text-white shadow-xl'}`}>{selectedItemId === item.id ? "Replier" : "Développer l'Item"}</button>
                           </div>
                           {selectedItemId === item.id && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 animate-in fade-in slide-in-from-top-4">
                                 {item.modules.map(mod => (
                                    <div key={mod.id} className="p-6 rounded-2xl bg-black/20 border border-white/5 relative group">
                                       <div className="flex justify-between items-start mb-4">
                                          <h5 className="text-xs font-black text-primary uppercase">{mod.name}</h5>
                                          {isAdmin && <button onClick={() => handleDeleteModule(mod.id, mod.name)} className="size-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"><span className="material-symbols-outlined text-xs">delete</span></button>}
                                       </div>
                                       <div className="space-y-2">
                                          {mod.files.map(f => (
                                             <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                                <span className="text-[10px] font-bold text-slate-400 truncate">{f.name}</span>
                                                <div className="flex items-center gap-2">
                                                   <button onClick={() => handleDownload(f.url || '', f.name)} className="material-symbols-outlined text-sm text-slate-500 hover:text-white">download</button>
                                                   {isAdmin && <button onClick={() => handleDeleteFile(f.id, f.name)} className="material-symbols-outlined text-sm text-red-500">delete</button>}
                                                </div>
                                             </div>
                                          ))}
                                          {isAdmin && (
                                             <button onClick={() => { setTargetModuleId(mod.id); setAddType('file'); setIsAddModalOpen(true); }} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[8px] font-black text-slate-500 uppercase hover:text-primary transition-all">+ Fichier</button>
                                          )}
                                       </div>
                                    </div>
                                 ))}
                                 {isAdmin && <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="p-6 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-all text-slate-600"><span className="material-symbols-outlined">add_circle</span><span className="text-[10px] font-black uppercase">Nouveau Module</span></button>}
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

export default Education;
