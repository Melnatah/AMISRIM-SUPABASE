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
  user: { name: string };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [userCount, setUserCount] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const modules = [
    { title: 'Education', icon: 'school', path: '/education', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Stages', icon: 'location_on', path: '/sites', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'PACS', icon: 'dataset', path: '/dicom', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Caisse', icon: 'payments', path: '/cotisation', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Loisir', icon: 'sports_esports', path: '/loisir', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { title: 'Stats', icon: 'bar_chart', path: '/statistics', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  ];

  useEffect(() => {
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
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
