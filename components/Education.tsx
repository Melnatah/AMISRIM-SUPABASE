
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Subject, EducationFile, YearCurriculum, Module, AcademicItem } from '../types';
import { supabase } from '../services/supabase';

type Category = 'cours' | 'staff' | 'epu' | 'diu';

const Education: React.FC = () => {
   const location = useLocation();
   const navigate = useNavigate();

   // Synchronisation de la catégorie active avec l'URL
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
   // We infer structure from these flat lists

   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
   const [addType, setAddType] = useState<'subject' | 'module' | 'item' | 'file'>('subject');
   const [newName, setNewName] = useState('');

   // Réinitialiser les sélections lors du changement de catégorie
   useEffect(() => {
      setSelectedSubjectId(null);
      setSelectedItemId(null);
   }, [activeCategory]);

   const fetchData = async () => {
      try {
         setLoading(true);
         // Fetch all subjects
         const { data: subData, error: subError } = await supabase
            .from('subjects')
            .select('*');
         if (subError) throw subError;

         // Fetch all modules with their files
         // Supabase join syntax: modules(*, files(*))
         const { data: modData, error: modError } = await supabase
            .from('modules')
            .select(`
          *,
          files (*)
        `);
         if (modError) throw modError;

         // Map DB to Types
         const mappedSubjects: Subject[] = (subData || []).map(s => ({
            id: s.id,
            name: s.name,
            // We'll attach modules later locally
            modules: [],
            year: parseInt(s.year) || 0,
            // @ts-ignore - we added category column but type might not reflect it immediately in strict TS if not updated. 
            // We'll use it for filtering.
            category: s.category || 'cours'
         }));

         const mappedModules: Module[] = (modData || []).map(m => ({
            id: m.id,
            name: m.name,
            description: m.description,
            subjectId: m.subject_id,
            category: m.category,
            files: (m.files || []).map((f: any) => ({
               id: f.id,
               name: f.name,
               type: f.type,
               url: f.url,
               size: f.size,
               author: f.author,
               date: new Date(f.created_at).toLocaleDateString()
            }))
         }));

         setSubjects(mappedSubjects);
         setModules(mappedModules);

      } catch (e) {
         console.error("Error fetching education data", e);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, []);

   // Derived State for UI
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

   const getStaffModules = (): Module[] => {
      return modules.filter(m => m.category === 'staff');
   };

   const getItems = (cat: 'epu' | 'diu'): AcademicItem[] => {
      return subjects
         .filter(s => s.category === cat)
         .map(s => ({
            id: s.id,
            name: s.name,
            description: '', // Subjects table doesn't have desc yet, but UI expects it potentially
            modules: modules.filter(m => m.subjectId === s.id)
         }));
   };

   const handleCategoryChange = (cat: Category) => {
      navigate(`/education/${cat}`);
   };

   const handleAdd = async () => {
      if (!newName.trim()) return;

      try {
         if (activeCategory === 'cours' && addType === 'subject') {
            const { error } = await supabase.from('subjects').insert([{
               name: newName,
               year: activeYear.toString(),
               category: 'cours'
            }]);
            if (error) throw error;
         }
         else if (activeCategory === 'staff' && addType === 'module') {
            const { error } = await supabase.from('modules').insert([{
               name: newName,
               category: 'staff',
               description: 'Nouveau module de staff'
            }]);
            if (error) throw error;
         }
         else if ((activeCategory === 'epu' || activeCategory === 'diu') && addType === 'item') {
            const { error } = await supabase.from('subjects').insert([{
               name: newName,
               category: activeCategory,
               year: '0'
            }]);
            if (error) throw error;
         }
         else if (addType === 'module' && (activeCategory === 'cours' || activeCategory === 'epu' || activeCategory === 'diu')) {
            // Adding a module to a parent subject/item
            const parentId = activeCategory === 'cours' ? selectedSubjectId : selectedItemId;
            if (!parentId) {
               alert("Impossible d'ajouter : aucun parent sélectionné.");
               return;
            }
            const { error } = await supabase.from('modules').insert([{
               name: newName,
               subject_id: parentId,
               description: 'Nouveau module'
            }]);
            if (error) throw error;
         }

         await fetchData();
         setIsAddModalOpen(false);
         setNewName('');
      } catch (e) {
         console.error("Error adding item", e);
         alert("Erreur lors de l'ajout.");
      }
   };

   const simulateDownload = (name: string) => {
      alert(`Téléchargement de : ${name}`);
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-full bg-background-light dark:bg-background-dark">
            <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full"></div>
         </div>
      )
   }

   const curriculum = getCurriculum();
   const staffModules = getStaffModules();
   const epuItems = getItems('epu');
   const diuItems = getItems('diu');

   return (
      <div className="flex h-full flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta">

         {/* Modal d'ajout générique */}
         {isAddModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
               <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8 w-full max-w-sm shadow-2xl">
                  <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">add_circle</span>
                     Ajouter {addType === 'subject' ? 'une Matière' : addType === 'module' ? 'un Module' : addType === 'item' ? 'un Item' : 'un Fichier'}
                  </h3>
                  <input
                     type="text"
                     className="w-full bg-background-dark/50 border border-white/5 rounded-xl py-4 px-4 text-white text-sm mb-6 outline-none focus:border-primary"
                     placeholder="Titre..."
                     value={newName}
                     onChange={e => setNewName(e.target.value)}
                     autoFocus
                  />
                  <div className="flex gap-3">
                     <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-[10px] font-black text-slate-500 uppercase">Annuler</button>
                     <button onClick={handleAdd} className="flex-1 py-3 bg-primary text-white text-[10px] font-black rounded-xl uppercase">Confirmer</button>
                  </div>
               </div>
            </div>
         )}

         <div className="max-w-[1200px] mx-auto w-full space-y-8 pb-20">

            {/* Header Académique avec Catégories synchronisées */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
               <div>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Académie AMIS-RIM</h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">Gérez et consultez les ressources pédagogiques nationales.</p>
               </div>

               <div className="flex p-1 bg-surface-dark border border-surface-highlight rounded-2xl overflow-x-auto hide-scrollbar w-full md:w-auto">
                  {(['cours', 'staff', 'epu', 'diu'] as Category[]).map(cat => (
                     <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                     >
                        {cat}
                     </button>
                  ))}
               </div>
            </div>

            {/* CONTENU : COURS (Années > Matières > Modules) */}
            {activeCategory === 'cours' && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-4 gap-3">
                     {[1, 2, 3, 4].map(y => (
                        <button
                           key={y}
                           onClick={() => { setActiveYear(y); setSelectedSubjectId(null); }}
                           className={`p-4 rounded-2xl border transition-all ${activeYear === y ? 'bg-primary/10 border-primary text-primary shadow-xl' : 'bg-surface-dark border-surface-highlight text-slate-500'}`}
                        >
                           <p className="text-2xl font-black">{y}è</p>
                           <p className="text-[8px] font-black uppercase opacity-60">Année</p>
                        </button>
                     ))}
                  </div>

                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Matières de l'année {activeYear}</h3>
                     <button onClick={() => { setAddType('subject'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">add</span> Ajouter Matière
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {curriculum.find(y => y.year === activeYear)?.subjects.map(subj => (
                        <div key={subj.id} className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="text-white font-black text-sm uppercase tracking-tight">{subj.name}</h4>
                              <span className="bg-white/5 text-slate-500 text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">{subj.modules.length} Modules</span>
                           </div>
                           <button
                              onClick={() => setSelectedSubjectId(selectedSubjectId === subj.id ? null : subj.id)}
                              className={`w-full py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSubjectId === subj.id ? 'bg-primary text-white' : 'bg-white/5 text-slate-400 hover:bg-primary/10 hover:text-primary'}`}
                           >
                              {selectedSubjectId === subj.id ? "Replier" : "Voir les Modules"}
                           </button>

                           {selectedSubjectId === subj.id && (
                              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                                 {subj.modules.length > 0 ? subj.modules.map(mod => (
                                    <div key={mod.id} className="p-4 rounded-2xl bg-black/30 border border-white/5">
                                       <div className="flex justify-between items-center mb-2">
                                          <p className="text-xs font-black text-primary uppercase">{mod.name}</p>
                                          <span className="text-[8px] font-bold text-slate-500">{mod.files.length} fichiers</span>
                                       </div>
                                       <div className="space-y-1">
                                          {mod.files.map(f => (
                                             <div key={f.id} className="flex items-center justify-between py-2 text-[10px] text-slate-400 border-t border-white/5">
                                                <span className="truncate">{f.name}</span>
                                                <button onClick={() => simulateDownload(f.name)} className="material-symbols-outlined text-sm hover:text-white">download</button>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 )) : (
                                    <p className="text-[10px] text-slate-600 italic text-center py-4">Aucun module dans cette matière.</p>
                                 )}
                                 <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[8px] font-black text-slate-600 uppercase hover:border-primary/50 hover:text-primary transition-all">
                                    + Ajouter un Module
                                 </button>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* CONTENU : STAFF (Modules directs) */}
            {activeCategory === 'staff' && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Modules de Staff Scientifique</h3>
                     <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">add</span> Nouveau Module
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {staffModules.map(mod => (
                        <div key={mod.id} className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 shadow-xl flex flex-col">
                           <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                              <span className="material-symbols-outlined text-2xl">menu_book</span>
                           </div>
                           <h4 className="text-white font-black text-base uppercase mb-2 leading-tight">{mod.name}</h4>
                           <p className="text-slate-500 text-[10px] font-medium mb-6 flex-1">{mod.description || "Présentations et cas cliniques."}</p>
                           <div className="space-y-2">
                              {mod.files.map(f => (
                                 <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                       <span className="material-symbols-outlined text-red-500 text-sm">picture_as_pdf</span>
                                       <span className="text-[10px] font-bold text-slate-300 truncate">{f.name}</span>
                                    </div>
                                    <button onClick={() => simulateDownload(f.name)} className="material-symbols-outlined text-slate-500 hover:text-white text-base">download</button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* CONTENU : EPU / DIU (Items > Modules) */}
            {(activeCategory === 'epu' || activeCategory === 'diu') && (
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Liste des Items {activeCategory.toUpperCase()}</h3>
                     <button onClick={() => { setAddType('item'); setIsAddModalOpen(true); }} className="text-primary text-[10px] font-black uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">add</span> Ajouter un Item
                     </button>
                  </div>
                  <div className="space-y-4">
                     {(activeCategory === 'epu' ? epuItems : diuItems).map(item => (
                        <div key={item.id} className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8">
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div>
                                 <h4 className="text-xl font-black text-white uppercase tracking-tight">{item.name}</h4>
                                 <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">{item.modules.length} modules thématiques</p>
                              </div>
                              <button
                                 onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${selectedItemId === item.id ? 'bg-white text-primary' : 'bg-primary text-white shadow-primary/20'}`}
                              >
                                 {selectedItemId === item.id ? "Replier" : "Développer l'Item"}
                              </button>
                           </div>

                           {selectedItemId === item.id && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 animate-in slide-in-from-top-4 duration-300">
                                 {item.modules.map(mod => (
                                    <div key={mod.id} className="p-6 rounded-2xl bg-black/20 border border-white/5">
                                       <h5 className="text-xs font-black text-primary uppercase mb-4">{mod.name}</h5>
                                       <div className="space-y-2">
                                          {mod.files.map(f => (
                                             <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                                                <span className="text-[10px] font-bold text-slate-400 truncate">{f.name}</span>
                                                <button onClick={() => simulateDownload(f.name)} className="material-symbols-outlined text-sm text-slate-500 hover:text-white">download</button>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 ))}
                                 <button onClick={() => { setAddType('module'); setIsAddModalOpen(true); }} className="p-6 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-all text-slate-600">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <span className="text-[10px] font-black uppercase">Nouveau Module</span>
                                 </button>
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
