
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Message } from '../types';

const Messagerie: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [mobileDetailView, setMobileDetailView] = useState(false);

  // États pour la création de message
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    priority: 'info' as 'urgent' | 'important' | 'info',
    content: ''
  });

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedMessages: Message[] = (data || []).map(m => ({
        id: m.id,
        sender: m.author || 'Admin',
        role: 'Bureau National', // Default role since not in DB
        subject: m.subject || 'Sujet manquant',
        content: m.content,
        timestamp: new Date(m.created_at).toLocaleDateString(),
        priority: (m.priority as any) || 'info',
        read: false // Default unread as we don't track per-user read state yet
      }));

      setMessages(mappedMessages);
      if (mappedMessages.length > 0 && !selectedMessage) {
        setSelectedMessage(mappedMessages[0]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMessages = messages.filter(m => {
    if (filter === 'unread') return !m.read;
    if (filter === 'urgent') return m.priority === 'urgent';
    return true;
  });

  const markAsRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    if (selectedMessage?.id === id) {
      setSelectedMessage(prev => prev ? { ...prev, read: true } : null);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    markAsRead(msg.id);
    setMobileDetailView(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.subject || !newMessage.content) return;

    try {
      const { error } = await supabase.from('messages').insert([{
        author: 'Admin AMIS-RIM', // Hardcoded sender for now
        subject: newMessage.subject,
        content: newMessage.content,
        priority: newMessage.priority,
        type: 'broadcast'
      }]);

      if (error) throw error;

      fetchData();
      setIsComposeModalOpen(false);
      setNewMessage({ subject: '', priority: 'info', content: '' });
      alert("Message envoyé !");
    } catch (error) {
      console.error('Error sending message:', error);
      alert("Erreur lors de l'envoi");
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent': return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'CRITIQUE' };
      case 'important': return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'IMPORTANT' };
      default: return { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'INFO' };
    }
  };

  return (
    <div className="flex h-full bg-background-light dark:bg-background-dark font-jakarta overflow-hidden">

      {/* MODAL DE RÉDACTION */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-6 md:p-8 w-full max-w-xl shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                Diffuser
              </h3>
              <button onClick={() => setIsComposeModalOpen(false)} className="text-slate-500 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-1 bg-background-dark/50 rounded-xl border border-white/5">
                {(['info', 'important', 'urgent'] as const).map((p) => (
                  <button key={p} type="button" onClick={() => setNewMessage({ ...newMessage, priority: p })} className={`py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${newMessage.priority === p ? (p === 'urgent' ? 'bg-red-500 text-white' : p === 'important' ? 'bg-amber-500 text-white' : 'bg-primary text-white') : 'text-slate-500'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <input required className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm" placeholder="Sujet..." value={newMessage.subject} onChange={e => setNewMessage({ ...newMessage, subject: e.target.value })} />
              <textarea required className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 px-5 text-white outline-none text-sm h-32 resize-none" placeholder="Message..." value={newMessage.content} onChange={e => setNewMessage({ ...newMessage, content: e.target.value })} />
              <button type="submit" className="w-full py-4 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px]">Envoyer</button>
            </form>
          </div>
        </div>
      )}

      {/* Liste des Messages */}
      <aside className={`w-full md:w-[400px] flex-none border-r border-gray-200 dark:border-dark-border flex flex-col bg-white dark:bg-[#0e1117] z-10 ${mobileDetailView ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">chat_bubble</span>
              Messages
            </h2>
            <button onClick={() => setIsComposeModalOpen(true)} className="size-9 md:size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined text-xl">edit_note</span>
            </button>
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-surface-highlight overflow-x-auto hide-scrollbar">
            <FilterTab label="Tous" active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterTab label="Urgent" active={filter === 'urgent'} onClick={() => setFilter('urgent')} />
            <FilterTab label="Non lu" active={filter === 'unread'} onClick={() => setFilter('unread')} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredMessages.length > 0 ? (
            filteredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`w-full p-4 md:p-6 text-left border-b border-gray-100 dark:border-white/5 transition-all relative group ${selectedMessage?.id === msg.id ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                {!msg.read && <div className="absolute top-6 md:top-8 right-4 md:right-6 size-2 bg-primary rounded-full"></div>}
                <div className="flex flex-col mb-1 md:mb-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${getPriorityConfig(msg.priority).color}`}>
                    {getPriorityConfig(msg.priority).label}
                  </span>
                  <p className={`text-sm font-black transition-colors truncate ${selectedMessage?.id === msg.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                    {msg.subject}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-2">{msg.content}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate w-32">{msg.sender}</p>
                  <p className="text-[9px] font-bold text-slate-500 shrink-0">{msg.timestamp}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 opacity-30">
              <span className="material-symbols-outlined text-4xl mb-2">mail_lock</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Aucun message</p>
            </div>
          )}
        </div>
      </aside>

      {/* Contenu du Message */}
      <main className={`flex-1 flex-col bg-background-light dark:bg-background-dark overflow-hidden relative ${mobileDetailView ? 'flex' : 'hidden md:flex'}`}>
        {selectedMessage ? (
          <>
            <div className="p-4 md:p-12 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-[#0e1117]/50 backdrop-blur-xl shrink-0">
              <div className="flex items-center gap-3 mb-6 md:hidden">
                <button onClick={() => setMobileDetailView(false)} className="size-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-slate-500">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retour aux messages</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 md:size-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center text-xl md:text-2xl font-black shrink-0">
                    {selectedMessage.sender.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1 truncate">{selectedMessage.subject}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary truncate">{selectedMessage.sender}</span>
                      <span className="size-1 rounded-full bg-slate-700 shrink-0"></span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{selectedMessage.role}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black border uppercase tracking-widest ${getPriorityConfig(selectedMessage.priority).bg} ${getPriorityConfig(selectedMessage.priority).color} ${getPriorityConfig(selectedMessage.priority).border}`}>
                    {getPriorityConfig(selectedMessage.priority).label}
                  </span>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{selectedMessage.timestamp}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span className="md:inline hidden">Imprimer</span>
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest transition-all">
                  <span className="material-symbols-outlined text-sm">mark_as_unread</span>
                  <span className="md:inline hidden">Non lu</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-12 overflow-y-auto">
              <div className="max-w-3xl mx-auto">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-800 dark:text-slate-200 text-sm md:text-lg leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedMessage.content}
                  </p>
                </div>
                <div className="mt-8 md:mt-12 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20">
                  <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-4">Consignes AMIS-RIM</h4>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium leading-relaxed">
                    Pour toute précision sur ce message, veuillez contacter votre représentant de garde ou répondre via le secrétariat national.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-600">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">drafts</span>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sélectionnez un message</p>
          </div>
        )}
      </main>
    </div>
  );
};

const FilterTab = ({ label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 shrink-0 py-2 px-3 md:px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-white dark:bg-[#0e1117] text-primary shadow-sm' : 'text-slate-500'}`}
  >
    {label}
  </button>
);

export default Messagerie;
