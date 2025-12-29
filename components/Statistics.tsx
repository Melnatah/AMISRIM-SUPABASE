import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { supabase } from '../services/supabase';

const COLORS = ['#0d59f2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

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
    className={`flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
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

const Statistics: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'finance' | 'staff' | 'stages' | 'activites'>('finance');
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dbStats, setDbStats] = useState({
    totalFinance: 0,
    leisureFinance: 0,
    memberCount: 0,
    docCount: 0,
    staffCount: 0,
    siteCount: 0,
    activeResidents: 0,
    financialChart: [] as any[],
    academicChart: [] as any[],
    sitesChart: [] as any[],
    activitiesChart: [] as any[],
    attendanceStats: { staff: 0, epu: 0, diu: 0, stage: 0 },
    eventStats: { total: 0, participants: 0, byType: [] as any[] }
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: contribs } = await supabase.from('contributions').select('amount, created_at');
      const { data: leisureContribs } = await supabase.from('leisure_contributions').select('amount, created_at');

      const totalCommune = (contribs || []).reduce((acc, c) => acc + Number(c.amount), 0);
      const totalLeisure = (leisureContribs || []).reduce((acc, c) => acc + Number(c.amount), 0);

      const { data: filesData, count: fileCount } = await supabase.from('files').select('id, created_at', { count: 'exact' });
      const { count: moduleCount } = await supabase.from('modules').select('*', { count: 'exact', head: true });

      const { data: profiles } = await supabase.from('profiles').select('hospital, status');
      const { count: siteCountRes } = await supabase.from('sites').select('*', { count: 'exact', head: true });
      const approvedProfiles = (profiles || []).filter(p => p.status === 'approved');

      const { data: events } = await supabase.from('leisure_events').select('*');
      const { data: participants } = await supabase.from('leisure_participants').select('*').eq('status', 'approved');
      const { data: attendance } = await supabase.from('attendance').select('*').eq('status', 'confirmed');

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const currentYear = new Date().getFullYear();

      const monthlyFinancial = monthNames.map((name, index) => {
        const commune = (contribs || [])
          .filter(c => {
            const d = new Date(c.created_at);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          })
          .reduce((sum, c) => sum + Number(c.amount), 0);

        const loisirs = (leisureContribs || [])
          .filter(c => {
            const d = new Date(c.created_at);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          })
          .reduce((sum, c) => sum + Number(c.amount), 0);

        return { month: name, commune, loisirs };
      }).filter(d => d.commune > 0 || d.loisirs > 0 || monthNames.indexOf(d.month) <= new Date().getMonth());

      const monthlyAcademic = monthNames.map((name, index) => {
        return {
          month: name,
          presentations: (events || []).filter(e => {
            const d = new Date(e.event_date);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          }).length,
          documents: (filesData || []).filter(f => {
            const d = new Date(f.created_at);
            return d.getMonth() === index && d.getFullYear() === currentYear;
          }).length
        };
      }).filter((_, i) => i <= new Date().getMonth());

      const eventTypes = ['voyage', 'pique-nique', 'fete'];
      const eventByType = eventTypes.map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: (events || []).filter(e => e.type === type).length
      })).filter(v => v.value > 0);

      const siteDistribution = (profiles || [])
        .filter(p => p.hospital)
        .reduce((acc: any, p) => {
          acc[p.hospital] = (acc[p.hospital] || 0) + 1;
          return acc;
        }, {});

      const sitesChartData = Object.entries(siteDistribution).map(([name, count]) => ({
        name: name.length > 15 ? name.substring(0, 12) + '...' : name,
        occupes: count,
        capacite: 6
      }));

      setDbStats({
        totalFinance: totalCommune,
        leisureFinance: totalLeisure,
        memberCount: (profiles || []).length,
        docCount: fileCount || 0,
        staffCount: moduleCount || 0,
        siteCount: siteCountRes || 0,
        activeResidents: approvedProfiles.length,
        financialChart: monthlyFinancial,
        academicChart: monthlyAcademic,
        sitesChart: sitesChartData,
        activitiesChart: (events || []).map(e => ({
          name: e.title,
          inscrits: (participants || []).filter(p => p.event_id === e.id).length,
          max: e.max_participants || 50
        })),
        attendanceStats: {
          staff: (attendance || []).filter(a => a.item_type === 'staff').length,
          epu: (attendance || []).filter(a => a.item_type === 'epu').length,
          diu: (attendance || []).filter(a => a.item_type === 'diu').length,
          stage: (attendance || []).filter(a => a.item_type === 'stage').length
        },
        eventStats: {
          total: (events || []).length,
          participants: (participants || []).length,
          byType: eventByType
        }
      });

    } catch (e) {
      console.error("Stats error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const reportTitle = "BILAN ANNUEL AMIS-RIM TOGO";
      const dateGen = new Date().toLocaleString();
      let csv = `\ufeff${reportTitle}\nGénéré le : ${dateGen}\n\n`;

      csv += "--- SECTION FINANCES ---\n";
      csv += "Mois;Caisse Commune (FCFA);Caisse Loisirs (FCFA);Total Mensuel\n";
      dbStats.financialChart.forEach(f => {
        csv += `${f.month};${f.commune};${f.loisirs};${f.commune + f.loisirs}\n`;
      });
      csv += `TOTAL;${dbStats.totalFinance};${dbStats.leisureFinance};${dbStats.totalFinance + dbStats.leisureFinance}\n\n`;

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

  if (loading) return (
    <div className="flex-1 h-full flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calcul des indicateurs...</p>
      </div>
    </div>
  );

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
          <div className="flex bg-surface-dark p-1 rounded-2xl border border-surface-highlight shadow-2xl overflow-hidden overflow-x-auto">
            <CategoryBtn label="Finances" active={activeCategory === 'finance'} onClick={() => setActiveCategory('finance')} icon="payments" />
            <CategoryBtn label="Activités" active={activeCategory === 'activites'} onClick={() => setActiveCategory('activites')} icon="sports_esports" />
            <CategoryBtn label="Académique" active={activeCategory === 'staff'} onClick={() => setActiveCategory('staff')} icon="menu_book" />
            <CategoryBtn label="Stages" active={activeCategory === 'stages'} onClick={() => setActiveCategory('stages')} icon="location_on" />
          </div>
        </div>

        {activeCategory === 'finance' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="account_balance" label="Solde Commune" value={`${(dbStats.totalFinance / 1000).toFixed(1)}k`} subValue="FCFA collectés" color="text-primary" bg="bg-primary/10" />
              <KpiCard icon="savings" label="Caisse Loisirs" value={`${(dbStats.leisureFinance / 1000).toFixed(1)}k`} subValue="Total activités" color="text-pink-500" bg="bg-pink-500/10" />
              <KpiCard icon="trending_up" label="Capitaux" value={`${((dbStats.totalFinance + dbStats.leisureFinance) / 1000).toFixed(1)}k`} subValue="Total disponible" color="text-emerald-500" bg="bg-emerald-500/10" />
              <KpiCard icon="groups" label="Membres" value={dbStats.memberCount.toString()} subValue="Inscrits" color="text-amber-500" bg="bg-amber-500/10" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <ChartBox title="Collecte Mensuelle" sub="Commune vs Loisirs (Année en cours)" className="xl:col-span-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dbStats.financialChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3342" />
                    <XAxis dataKey="month" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Legend iconType="circle" />
                    <Bar name="Caisse Commune" dataKey="commune" fill="#0d59f2" radius={[4, 4, 0, 0]} />
                    <Bar name="Loisirs" dataKey="loisirs" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Répartition du Budget" sub="Origine des fonds réels">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Caisse Commune', value: dbStats.totalFinance },
                      { name: 'Loisirs', value: dbStats.leisureFinance },
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

        {activeCategory === 'activites' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="event" label="Total Activités" value={dbStats.eventStats.total.toString()} subValue="Événements créés" color="text-indigo-500" bg="bg-indigo-500/10" />
              <KpiCard icon="person_add" label="Participants" value={dbStats.eventStats.participants.toString()} subValue="Inscriptions validées" color="text-emerald-500" bg="bg-emerald-500/10" />
              <KpiCard icon="celebration" label="Fréquentation" value={`${dbStats.eventStats.total > 0 ? (dbStats.eventStats.participants / dbStats.eventStats.total).toFixed(1) : 0}`} subValue="Moyennne / évent" color="text-amber-500" bg="bg-amber-500/10" />
              <KpiCard icon="confirmation_number" label="Taux Inscription" value={`${Math.min(100, (dbStats.eventStats.participants / (dbStats.memberCount * (dbStats.eventStats.total || 1)) * 100)).toFixed(0)}%`} subValue="Engagement global" color="text-blue-500" bg="bg-blue-500/10" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ChartBox title="Popularité des Activités" sub="Nombre d'inscrits par événement">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dbStats.activitiesChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3342" />
                    <XAxis dataKey="name" stroke="#9ca6ba" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Bar name="Inscrits" dataKey="inscrits" fill="#0d59f2" radius={[4, 4, 0, 0]} />
                    <Bar name="Capacité Max" dataKey="max" fill="#2d3342" radius={[4, 4, 0, 0]} opacity={0.3} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Typologie des Événements" sub="Répartition par catégorie">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={dbStats.eventStats.byType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {dbStats.eventStats.byType.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </div>
        )}

        {activeCategory === 'staff' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="history_edu" label="Total Staffs" value={dbStats.staffCount.toString()} subValue="Modules créés" color="text-indigo-500" bg="bg-indigo-500/10" />
              <KpiCard icon="description" label="Documents" value={dbStats.docCount.toString()} subValue="Bibliothèque" color="text-blue-500" bg="bg-blue-500/10" />
              <KpiCard icon="how_to_reg" label="Émargement Staff" value={dbStats.attendanceStats.staff.toString()} subValue="Présences confirmées" color="text-amber-500" bg="bg-amber-500/10" />
              <KpiCard icon="workspace_premium" label="Soutien EPU/DIU" value={(dbStats.attendanceStats.epu + dbStats.attendanceStats.diu).toString()} subValue="Participations" color="text-emerald-500" bg="bg-emerald-500/10" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <ChartBox title="Engagement Académique" sub="Répartition de l'émargement confirmé" className="xl:col-span-1">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Staff', value: dbStats.attendanceStats.staff },
                      { name: 'EPU', value: dbStats.attendanceStats.epu },
                      { name: 'DIU', value: dbStats.attendanceStats.diu },
                    ]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Activité Scientifique" sub="Evolution de la production académique" className="xl:col-span-2">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={dbStats.academicChart}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3} /><stop offset="95%" stopColor="#0d59f2" stopOpacity={0} /></linearGradient>
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
          </div>
        )}

        {activeCategory === 'stages' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard icon="apartment" label="Centres" value={dbStats.siteCount.toString()} subValue="Sites conventionnés" color="text-emerald-500" bg="bg-emerald-500/10" />
              <KpiCard icon="person_pin" label="Résidents" value={dbStats.activeResidents.toString()} subValue="Effectif validé" color="text-indigo-500" bg="bg-indigo-500/10" />
              <KpiCard icon="check_circle" label="Émargement Stage" value={dbStats.attendanceStats.stage.toString()} subValue="Présences validées" color="text-amber-500" bg="bg-amber-500/10" />
              <KpiCard icon="schedule" label="Rotation" value="6" subValue="Mois en moyenne" color="text-blue-500" bg="bg-blue-500/10" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ChartBox title="Taux d'Occupation" sub="Résidents par centre">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dbStats.sitesChart} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2d3342" />
                    <XAxis type="number" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#9ca6ba" fontSize={11} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342' }} />
                    <Bar name="Occupés" dataKey="occupes" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar name="Capacité" dataKey="capacite" fill="#2d3342" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
              <ChartBox title="Type d'Hôpital" sub="Répartition des rotations cliniques">
                <ResponsiveContainer width="100%" height={400}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} data={[{ name: 'CHU', value: 85, fill: '#0d59f2' }, { name: 'CHR', value: 65, fill: '#10b981' }, { name: 'Clinique', value: 40, fill: '#f59e0b' }]}>
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
          <button onClick={handleDownloadReport} disabled={isExporting} className="px-10 py-5 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-3 min-w-[240px] justify-center">
            {isExporting ? <div className="size-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div> : <span className="material-symbols-outlined text-lg">download</span>}
            {isExporting ? 'Préparation...' : 'Télécharger le Bilan CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
