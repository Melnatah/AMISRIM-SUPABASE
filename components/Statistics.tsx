
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
  ComposedChart, Line
} from 'recharts';

// --- DONNÉES FICTIVES POUR LES STATISTIQUES ---

const financialHistory = [
  { month: 'Oct', commune: 320000, loisirs: 150000 },
  { month: 'Nov', commune: 450000, loisirs: 280000 },
  { month: 'Déc', commune: 510000, loisirs: 890000 }, 
  { month: 'Jan', commune: 480000, loisirs: 120000 },
  { month: 'Fév', commune: 550000, loisirs: 310000 },
  { month: 'Mar', commune: 420000, loisirs: 450000 },
];

const staffProduction = [
  { month: 'Oct', presentations: 4, documents: 12 },
  { month: 'Nov', presentations: 6, documents: 8 },
  { month: 'Déc', presentations: 3, documents: 5 },
  { month: 'Jan', presentations: 8, documents: 15 },
  { month: 'Fév', presentations: 12, documents: 20 },
  { month: 'Mar', presentations: 7, documents: 10 },
];

const internshipCapacity = [
  { name: 'CHU Campus', occupes: 3, capacite: 4 },
  { name: 'CHU SO', occupes: 5, capacite: 6 },
  { name: 'CHR Atakpamé', occupes: 2, capacite: 2 },
  { name: 'CHR Kara', occupes: 1, capacite: 3 },
  { name: 'C. Autonome', occupes: 4, capacite: 5 },
];

const COLORS = ['#0d59f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Statistics: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'finance' | 'staff' | 'stages'>('finance');
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadReport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      const reportTitle = "BILAN ANNUEL AMIS-RIM TOGO";
      const dateGen = new Date().toLocaleString();
      
      // Utilisation du point-virgule pour une ouverture automatique correcte sous Excel FR
      let csv = `\ufeff${reportTitle}\nGénéré le : ${dateGen}\n\n`;

      csv += "--- SECTION FINANCES ---\n";
      csv += "Mois;Caisse Commune (FCFA);Caisse Loisirs (FCFA);Total Mensuel\n";
      financialHistory.forEach(f => {
        csv += `${f.month};${f.commune};${f.loisirs};${f.commune + f.loisirs}\n`;
      });
      csv += `TOTAL CUMULÉ;${financialHistory.reduce((a,b)=>a+b.commune,0)};${financialHistory.reduce((a,b)=>a+b.loisirs,0)};${financialHistory.reduce((a,b)=>a+b.commune+b.loisirs,0)}\n\n`;

      csv += "--- ACTIVITÉ ACADÉMIQUE ---\n";
      csv += "Mois;Présentations;Documents Partagés\n";
      staffProduction.forEach(s => {
        csv += `${s.month};${s.presentations};${s.documents}\n`;
      });
      csv += "\n";

      csv += "--- RÉPARTITION DES STAGES ---\n";
      csv += "Centre;Affectés;Capacité;Occupation (%)\n";
      internshipCapacity.forEach(i => {
        csv += `${i.name};${i.occupes};${i.capacite};${Math.round((i.occupes/i.capacite)*100)}%\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bilan_Stat_AMIS_RIM_${new Date().getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 1000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 lg:p-10 bg-background-light dark:bg-background-dark font-jakarta">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              <span>Tableau de Bord</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-primary">Indicateurs de Performance</span>
            </div>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl uppercase">Statistiques Vitales</h2>
          </div>
          
          <div className="flex bg-surface-dark p-1 rounded-2xl border border-surface-highlight shadow-2xl overflow-hidden">
             <CategoryBtn label="Finances" active={activeCategory === 'finance'} onClick={() => setActiveCategory('finance')} icon="payments" />
             <CategoryBtn label="Académique" active={activeCategory === 'staff'} onClick={() => setActiveCategory('staff')} icon="menu_book" />
             <CategoryBtn label="Stages" active={activeCategory === 'stages'} onClick={() => setActiveCategory('stages')} icon="location_on" />
          </div>
        </div>

        {/* SECTION FINANCES */}
        {activeCategory === 'finance' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="account_balance" label="Solde Total" value="3.4M" subValue="FCFA cumulés" color="text-primary" bg="bg-primary/10" />
              <KpiCard icon="savings" label="Caisse Loisirs" value="1.2M" subValue="Caisse active" color="text-pink-500" bg="bg-pink-500/10" />
              <KpiCard icon="trending_up" label="Croissance" value="+12%" subValue="vs mois dernier" color="text-emerald-500" bg="bg-emerald-500/10" />
              <KpiCard icon="groups" label="Membres" value="158" subValue="Inscrits actifs" color="text-amber-500" bg="bg-amber-500/10" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <ChartBox title="Collecte Mensuelle" sub="Commune vs Loisirs" className="xl:col-span-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={financialHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3342" />
                      <XAxis dataKey="month" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                      <Legend iconType="circle" />
                      <Bar name="Commune" dataKey="commune" fill="#0d59f2" radius={[4, 4, 0, 0]} />
                      <Bar name="Loisirs" dataKey="loisirs" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </ChartBox>

               <ChartBox title="Sources de Revenus" sub="Origine des fonds">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie data={[
                        {name: 'Cotisations', value: 45},
                        {name: 'Dons', value: 35},
                        {name: 'Loisirs', value: 20},
                      ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                      <Legend verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
               </ChartBox>
            </div>
          </div>
        )}

        {/* SECTION ACADEMIQUE */}
        {activeCategory === 'staff' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="history_edu" label="Total Staffs" value="45" subValue="Depuis Octobre" color="text-indigo-500" bg="bg-indigo-500/10" />
              <KpiCard icon="description" label="Documents" value="128" subValue="Bibliothèque" color="text-blue-500" bg="bg-blue-500/10" />
              <KpiCard icon="star" label="Présence" value="92%" subValue="Taux moyen" color="text-amber-500" bg="bg-amber-500/10" />
              <KpiCard icon="cloud_download" label="Consultations" value="1.2k" subValue="Docs lus" color="text-emerald-500" bg="bg-emerald-500/10" />
            </div>

            <ChartBox title="Activité Scientifique" sub="Evolution de la production académique">
               <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={staffProduction}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3}/><stop offset="95%" stopColor="#0d59f2" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3342" />
                    <XAxis dataKey="month" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Legend />
                    <Area name="Staffs" type="monotone" dataKey="presentations" stroke="#8b5cf6" fill="url(#grad1)" strokeWidth={3} />
                    <Area name="Docs" type="monotone" dataKey="documents" stroke="#0d59f2" fill="url(#grad2)" strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </ChartBox>
          </div>
        )}

        {/* SECTION STAGES */}
        {activeCategory === 'stages' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="apartment" label="Centres" value="5" subValue="Sites conventionnés" color="text-emerald-500" bg="bg-emerald-500/10" />
              <KpiCard icon="person_pin" label="Résidents" value="18" subValue="Actuellement postés" color="text-indigo-500" bg="bg-indigo-500/10" />
              <KpiCard icon="fact_check" label="Saturation" value="82%" subValue="Occupation sites" color="text-amber-500" bg="bg-amber-500/10" />
              <KpiCard icon="schedule" label="Rotation" value="6" subValue="Mois en moyenne" color="text-blue-500" bg="bg-blue-500/10" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <ChartBox title="Taux d'Occupation" sub="Résidents par centre">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={internshipCapacity} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2d3342" />
                      <XAxis type="number" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                      <Bar name="Occupés" dataKey="occupes" fill="#10b981" radius={[0, 4, 4, 0]} />
                      <Bar name="Total" dataKey="capacite" fill="#2d3342" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </ChartBox>
               
               <ChartBox title="Type d'Hôpital" sub="Répartition des rotations cliniques">
                  <ResponsiveContainer width="100%" height={400}>
                    <RadialBarChart 
                      cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} 
                      data={[
                        { name: 'CHU', value: 85, fill: '#0d59f2' },
                        { name: 'CHR', value: 65, fill: '#10b981' },
                        { name: 'Clinique', value: 40, fill: '#f59e0b' },
                      ]}
                    >
                      <RadialBar label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} background dataKey="value" />
                      <Legend iconSize={10} verticalAlign="bottom" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
               </ChartBox>
            </div>
          </div>
        )}

        <div className="p-8 rounded-[2.5rem] bg-surface-dark border border-surface-highlight flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
           <div className="flex items-center gap-6 text-center md:text-left">
              <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">cloud_download</span>
              </div>
              <div>
                 <h4 className="text-white font-black text-xl uppercase tracking-tight mb-1">Bilan Consolidé</h4>
                 <p className="text-slate-500 text-sm font-medium">Téléchargez les données brutes pour vos rapports administratifs.</p>
              </div>
           </div>
           <button 
            onClick={handleDownloadReport}
            disabled={isExporting}
            className="px-10 py-5 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 min-w-[240px] justify-center"
           >
             {isExporting ? <div className="size-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-lg">download</span>}
             {isExporting ? 'Préparation...' : 'Télécharger le Bilan CSV'}
           </button>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value, subValue, color, bg }: any) => (
  <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
    <div className="relative z-10">
       <div className="flex items-center gap-3 mb-6">
          <div className={`size-10 rounded-xl ${bg} ${color} flex items-center justify-center`}><span className="material-symbols-outlined text-xl">{icon}</span></div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
       </div>
       <p className="text-3xl font-black text-white mb-1">{value}</p>
       <p className={`text-[10px] font-bold ${color} uppercase`}>{subValue}</p>
    </div>
  </div>
);

const CategoryBtn = ({ label, active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className="material-symbols-outlined text-lg">{icon}</span>
    {label}
  </button>
);

const ChartBox = ({ title, sub, children, className = "" }: any) => (
  <div className={`bg-surface-dark rounded-[2.5rem] border border-surface-highlight p-8 shadow-2xl flex flex-col min-h-[400px] ${className}`}>
    <div className="mb-8"><h3 className="text-white font-black text-xl uppercase tracking-tight">{title}</h3><p className="text-slate-500 text-xs">{sub}</p></div>
    <div className="flex-1">{children}</div>
  </div>
);

export default Statistics;
