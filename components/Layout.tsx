
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Site } from '../types';
import { MOCK_MESSAGES } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string, role: 'admin' | 'resident' };
  onLogout: () => void;
  sites: Site[];
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, sites }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_MESSAGES.filter(m => !m.read));
  
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Réinitialiser les notifications si on va sur la page messagerie
  useEffect(() => {
    if (location.pathname === '/messagerie') {
      setNotifications([]);
    }
  }, [location.pathname]);

  const handleOpenPacs = () => {
    const pacsUrl = localStorage.getItem('amis_pacs_url');
    if (pacsUrl) {
      window.open(pacsUrl, '_blank');
    } else {
      alert("PACS non configuré.");
    }
  };

  const mobileNavItems = [
    { path: '/', label: 'Accueil', icon: 'home', type: 'internal' },
    { path: '/education', label: 'Cours', icon: 'school', type: 'internal' },
    { path: '#pacs', label: 'PACS', icon: 'dataset', type: 'action', action: handleOpenPacs },
    { path: '/cotisation', label: 'Caisse', icon: 'payments', type: 'internal' },
    { path: '/messagerie', label: 'Messages', icon: 'chat_bubble', type: 'internal' },
  ];

  const handleNotificationClick = (id: string) => {
    setIsNotificationOpen(false);
    navigate('/messagerie');
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-hidden font-jakarta">
      {/* Desktop Sidebar */}
      <Sidebar user={user} onLogout={onLogout} sites={sites} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="flex-none h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-[#0e1117] z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="lg:hidden flex items-center gap-2 text-primary font-black text-sm uppercase tracking-tighter">
                <span className="material-symbols-outlined filled text-xl">medical_services</span>
                <span className="whitespace-nowrap">AMIS RIM</span>
            </div>
            <label className="hidden md:flex items-center h-10 w-64 rounded-full bg-gray-100 dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight px-4 group focus-within:border-primary/50 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
              <input className="bg-transparent border-none text-xs w-full focus:ring-0 placeholder:text-slate-500" placeholder="Rechercher un cours, un site..."/>
            </label>
          </div>

          <div className="flex gap-2 items-center">
            {/* Notification System */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`p-2 rounded-xl transition-all relative ${isNotificationOpen ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-surface-dark'}`}
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0e1117] animate-pulse"></span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Centre d'alertes</h4>
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-[8px] font-black text-primary uppercase hover:underline">Tout marquer lu</button>
                      )}
                   </div>
                   <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <button 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif.id)}
                            className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-white/5 border-b border-gray-50 dark:border-white/5 transition-colors group"
                          >
                             <div className="flex gap-3">
                                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${notif.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                   <span className="material-symbols-outlined text-sm">{notif.priority === 'urgent' ? 'priority_high' : 'info'}</span>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                   <p className="text-[10px] font-black text-slate-900 dark:text-white truncate uppercase mb-0.5 group-hover:text-primary transition-colors">{notif.subject}</p>
                                   <p className="text-[9px] text-slate-500 line-clamp-1 mb-1">{notif.content}</p>
                                   <span className="text-[8px] font-bold text-slate-400 uppercase">{notif.timestamp}</span>
                                </div>
                             </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-12 text-center flex flex-col items-center">
                           <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700 mb-2">notifications_off</span>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aucune nouvelle alerte</p>
                        </div>
                      )}
                   </div>
                   <Link to="/messagerie" onClick={() => setIsNotificationOpen(false)} className="block w-full py-4 bg-gray-50 dark:bg-white/5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-primary transition-colors">
                      Voir tous les messages
                   </Link>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 p-1 rounded-xl transition-all ${isDropdownOpen ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-surface-dark'}`}
              >
                <div className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none ml-1">
                  <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{user.name}</span>
                  <span className="text-[8px] font-bold uppercase text-slate-500">{user.role}</span>
                </div>
                <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-highlight rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                   <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-2">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session active</p>
                     <p className="text-xs font-black truncate text-slate-900 dark:text-white">{user.name}</p>
                     <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">{user.role}</p>
                   </div>
                   <Link to="/profile" className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider transition-colors">
                     <span className="material-symbols-outlined text-sm">person</span> Mon Profil
                   </Link>
                   <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider transition-colors">
                     <span className="material-symbols-outlined text-sm">logout</span> Déconnexion
                   </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden pb-16 lg:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#0e1117] border-t border-gray-200 dark:border-dark-border flex items-center justify-around px-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
           {mobileNavItems.map(item => {
             if (item.type === 'action') {
               return (
                 <button 
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-slate-400"
                 >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
                 </button>
               );
             }
             const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
             return (
               <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all ${isActive ? 'text-primary' : 'text-slate-400'}`}
               >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>{item.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
               </Link>
             );
           })}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
