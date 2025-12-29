import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabase';
import { Message } from '../types';

const chartData = [
  { name: 'Lun', activity: 30 },
  { name: 'Mar', activity: 50 },
  { name: 'Mer', activity: 40 },
  { name: 'Jeu', activity: 70 },
  { name: 'Ven', activity: 60 },
  { name: 'Sam', activity: 80 },
  { name: 'Dim', activity: 50 },
];

interface DashboardProps {
  user: { id: string, name: string, role: 'admin' | 'resident' };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [userCount, setUserCount] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'admin';

  const modules = [
    { title: 'Education', icon: 'school', path: '/education', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Stages', icon: 'location_on', path: '/sites', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'PACS', icon: 'dataset', path: '/dicom', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Caisse', icon: 'payments', path: '/cotisation', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Loisir', icon: 'sports_esports', path: '/loisir', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { title: 'Stats', icon: 'bar_chart', path: '/statistics', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  const fetchData = async () => {
    try {
      // Fetch User Count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!countError) setUserCount(count || 0);

      // Fetch Messages
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!msgError && msgs) {
        setMessages(msgs.map(m => ({
          id: m.id,
          content: m.content,
          author: m.author,
          createdAt: m.created_at,
          type: m.type
        })));
      }

      // Fetch Attendance
      if (isAdmin) {
        const { data: att } = await supabase.from('attendance').select('*, profiles(first_name, last_name)').eq('status', 'pending');
        setPendingAttendance(att || []);
      } else {
        const { data: myAtt } = await supabase.from('attendance').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(10);
        setMyAttendance(myAtt || []);
      }

    } catch (e) {
      console.error("Dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('dashboard-attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, (payload) => {
        console.log("Realtime update received:", payload);
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user.id, isAdmin]);

  const handleDeclarePresence = async (type: string) => {
    const today = new Date().toISOString().split('T')[0];
    const alreadyDeclared = myAttendance.some(a => a.item_type === type && a.created_at.startsWith(today));

    if (alreadyDeclared) {
      alert("Vous avez déjà émargé pour cette catégorie aujourd'hui.");
      return;
    }

    const { error } = await supabase.from('attendance').insert([{
      profile_id: user.id,
      item_type: type,
      status: 'pending'
    }]);

    if (error) alert(error.message);
    else alert("Émargement envoyé pour confirmation !");
  };

  const updateAttendanceStatus = async (id: string, status: 'confirmed' | 'rejected') => {
    if (status === 'confirmed') {
      const { error } = await supabase.from('attendance').update({ status: 'confirmed' }).eq('id', id);
      if (error) {
        alert("Erreur lors de la validation: " + error.message);
      }
    } else {
      const { error } = await supabase.from('attendance').delete().eq('id', id);
      if (error) {
        alert("Erreur lors du rejet: " + error.message);
      }
    }
    // Refresh immediately for the current admin
    fetchData();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-10 md:px-10 md:pb-10 pt-6 bg-background-light dark:bg-background-dark font-jakarta">
      <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">

        {/* Welcome Header */}
        <section className="rounded-[2.5rem] bg-surface-dark border border-surface-highlight shadow-xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="size-12 md:size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-inner border border-primary/20 uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-white text-xl md:text-3xl font-black leading-tight tracking-tight">Bienvenue Dr {user.name}</h2>
                <p className="text-slate-500 text-xs md:text-sm font-medium">Portail National des Résidents en Radiologie</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center min-w-[80px]">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Inscrits</p>
                <p className="text-sm font-black text-white">{userCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center min-w-[80px]">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Sessions</p>
                <p className="text-sm font-black text-green-500">Live</p>
              </div>
            </div>
          </div>
        </section>

        {/* Attendance System (Émargement) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resident Interaction */}
          <div className={`xl:col-span-2 bg-surface-dark rounded-[2.5rem] border border-surface-highlight p-8 shadow-xl relative overflow-hidden`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-white text-sm font-black uppercase tracking-widest">Émargement Quotidien</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Déclarez votre présence aux sessions d'aujourd'hui</p>
              </div>
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">how_to_reg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['staff', 'epu', 'diu', 'stage'].map(type => {
                const status = myAttendance.find(a => a.item_type === type && a.created_at.startsWith(new Date().toISOString().split('T')[0]))?.status;
                return (
                  <button
                    key={type}
                    onClick={() => !status && handleDeclarePresence(type)}
                    disabled={!!status}
                    className={`flex flex-col items-center p-6 rounded-3xl border transition-all ${status === 'confirmed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                      status === 'pending' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                        'bg-background-dark/40 border-white/5 text-slate-400 hover:border-primary/50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-3">
                      {type === 'staff' ? 'groups' : type === 'epu' ? 'school' : type === 'diu' ? 'workspace_premium' : 'location_on'}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                    {status && <span className="text-[8px] font-bold mt-2 uppercase">{status === 'confirmed' ? 'Validé' : 'En attente'}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Panel for Attendance */}
          {isAdmin && (
            <div className="bg-surface-dark rounded-[2.5rem] border border-emerald-500/30 p-8 shadow-xl animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-sm font-black uppercase tracking-widest">Validations ({pendingAttendance.length})</h3>
                <span className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center material-symbols-outlined text-sm">verified_user</span>
              </div>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingAttendance.length > 0 ? pendingAttendance.map(att => (
                  <div key={att.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                    <div>
                      <p className="text-white text-[10px] font-black uppercase">{att.profiles.first_name} {att.profiles.last_name}</p>
                      <p className="text-primary text-[8px] font-black uppercase">{att.item_type}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateAttendanceStatus(att.id, 'confirmed')} className="size-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><span className="material-symbols-outlined text-sm">done</span></button>
                      <button onClick={() => updateAttendanceStatus(att.id, 'rejected')} className="size-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-slate-600 text-[10px] font-black uppercase italic">Aucune attente</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Modules Grid - 2 cols on mobile, 6 on desktop */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {modules.map((mod, idx) => (
              <Link
                key={idx}
                to={mod.path}
                className="group flex flex-col items-center justify-center p-4 md:p-6 rounded-3xl bg-surface-dark border border-surface-highlight hover:border-primary/50 transition-all shadow-lg"
              >
                <div className={`size-10 md:size-12 rounded-xl ${mod.bg} ${mod.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-xl md:text-2xl">{mod.icon}</span>
                </div>
                <h4 className="text-white text-[10px] md:text-xs font-black text-center uppercase tracking-widest">{mod.title}</h4>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Activity Chart */}
          <div className="xl:col-span-2 bg-surface-dark rounded-[2.5rem] border border-surface-highlight shadow-xl p-6 md:p-8 min-h-[300px]">
            <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6">Activité Académique</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d59f2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d59f2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d3342" />
                  <XAxis dataKey="name" stroke="#9ca6ba" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1e232e', borderRadius: '12px', border: '1px solid #2d3342', color: '#fff', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="activity" stroke="#0d59f2" fillOpacity={1} fill="url(#colorAct)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actualités */}
          <div className="xl:col-span-1 bg-surface-dark rounded-[2.5rem] border border-surface-highlight shadow-xl p-6 md:p-8">
            <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6">Flash Infos</h3>
            <div className="flex flex-col gap-4">
              {messages.length > 0 ? messages.map(msg => (
                <div key={msg.id} className="p-4 rounded-2xl bg-surface-highlight/40 border border-white/5">
                  <div className="flex gap-3">
                    <div className={`size-2 mt-1.5 shrink-0 rounded-full ${msg.type === 'alert' ? 'bg-red-500' : 'bg-primary'} animate-pulse`}></div>
                    <div className="flex-1">
                      <p className="text-slate-200 text-xs font-medium leading-relaxed">{msg.content}</p>
                      <span className="mt-2 block text-[8px] font-black text-slate-500 uppercase">
                        {new Date(msg.createdAt).toLocaleDateString()} • {msg.author}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-xs italic">Aucune nouvelle annonce.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
