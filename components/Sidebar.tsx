
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Site } from '../types';

interface SidebarProps {
  user: { name: string, role: 'admin' | 'resident' };
  onLogout: () => void;
  sites: Site[];
}

const Sidebar: React.FC<SidebarProps> = ({ sites, user }) => {
  const location = useLocation();
  const active = location.pathname;
  const [isEduOpen, setIsEduOpen] = useState(active.includes('/education'));
  const [isSitesOpen, setIsSitesOpen] = useState(active.includes('/sites'));
  const [isLoisirOpen, setIsLoisirOpen] = useState(active.includes('/loisir'));

  const handleOpenPacs = (e: React.MouseEvent) => {
    e.preventDefault();
    const pacsUrl = localStorage.getItem('amis_pacs_url');
    if (pacsUrl) {
      window.open(pacsUrl, '_blank');
    } else {
      alert("Aucun serveur PACS n'est configuré. Veuillez contacter un administrateur.");
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard', type: 'internal' },
    {
      path: '/education',
      label: 'Education',
      icon: 'school',
      type: 'dropdown',
      state: isEduOpen,
      setState: setIsEduOpen,
      subItems: [
        { path: '/education/cours', label: 'Cours' },
        { path: '/education/staff', label: 'Staff' },
        { path: '/education/epu', label: 'EPU' },
        { path: '/education/diu', label: 'DIU' },
      ]
    },
    {
      path: '/sites',
      label: 'Sites de Stage',
      icon: 'location_on',
      type: 'dropdown',
      state: isSitesOpen,
      setState: setIsSitesOpen,
      subItems: [
        { path: '/sites', label: 'Vue d\'ensemble' },
        ...sites.map(site => ({
          path: `/sites/${site.id}`,
          label: site.name
        }))
      ]
    },
    { path: '#pacs', label: 'PACS Viewer', icon: 'dataset', type: 'external', action: handleOpenPacs },
    { path: '/cotisation', label: 'Cotisation', icon: 'payments', type: 'internal' },
    {
      path: '/loisir',
      label: 'Loisir',
      icon: 'sports_esports',
      type: 'dropdown',
      state: isLoisirOpen,
      setState: setIsLoisirOpen,
      subItems: [
        { path: '/loisir', label: 'Vue d\'ensemble' },
        { path: '/loisir/voyage', label: 'Voyages' },
        { path: '/loisir/pique-nique', label: 'Pique-niques' },
        { path: '/loisir/fete', label: 'Fêtes' },
      ]
    },
    { path: '/statistics', label: 'Statistiques', icon: 'bar_chart', type: 'internal' },
    { path: '/messagerie', label: 'Messagerie', icon: 'chat_bubble', type: 'internal' },
  ];

  const renderNavLink = (item: any) => {
    const isActive = active === item.path || (item.subItems && active.startsWith(item.path));

    if (item.type === 'dropdown') {
      return (
        <div key={item.path} className="flex flex-col gap-1">
          <button
            onClick={() => item.setState(!item.state)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
            <span className={`material-symbols-outlined ml-auto text-sm transition-transform duration-300 ${item.state ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>

          {item.state && (
            <div className="flex flex-col gap-1 ml-9 border-l border-dark-border pl-3 mt-1 animate-in slide-in-from-top-2 duration-300">
              {item.subItems.map((sub: any) => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`py-2 text-xs font-medium transition-colors truncate pr-2 ${active === sub.path ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (item.type === 'external') {
      return (
        <button
          key={item.label}
          onClick={item.action}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="text-sm font-medium">{item.label}</span>
          <span className="material-symbols-outlined text-xs ml-auto opacity-50">open_in_new</span>
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
      >
        <span className="material-symbols-outlined">{item.icon}</span>
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#0e1117] border-r border-gray-100 dark:border-[#2d3342] z-20 h-full font-jakarta">
      <div className="flex-none h-16 flex items-center px-6 border-b border-gray-100 dark:border-[#2d3342]">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <span className="material-symbols-outlined text-primary text-2xl filled">medical_services</span>
          <span className="text-lg font-black tracking-tighter uppercase font-jakarta">AMIS RIM TOGO</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <p className="px-3 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Menu Principal</p>
        {navItems.map(renderNavLink)}

        {user.role === 'admin' && (
          <div className="pt-6 mt-6 border-t border-dark-border">
            <p className="px-3 mb-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Admin</p>
            <Link
              to="/admin"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active === '/admin' ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/5'
                }`}
            >
              <span className="material-symbols-outlined">security</span>
              <span className="text-sm font-medium">Paramètres Admin</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
