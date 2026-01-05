import React, { useState, useEffect } from 'react';
import { profiles, contributions, attendance, auth } from '../services/api';

type AdminTab = 'users' | 'finance' | 'attendance' | 'broadcast' | 'system';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  hospital: string;
  year: string;
  date: string;
}

interface ApprovedUser extends PendingUser {
  role: string;
  status: 'approved' | 'pending' | 'rejected';
}

const AdminSettings: React.FC = () => {
  // Double Security Check
  const currentUser = auth.getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">gpp_bad</span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Accès Refusé</h1>
        <p className="text-slate-500 mt-2">Vous n'avez pas les droits d'administration nécessaires pour voir cette page.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [loading, setLoading] = useState(false);

  // States
  const [pacsUrl, setPacsUrl] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState('5000');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [allContributions, setAllContributions] = useState<any[]>([]);
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);

  // User filter state
  const [userFilter, setUserFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; user: PendingUser | null; selectedRole: 'resident' | 'admin' }>({
    isOpen: false,
    user: null,
    selectedRole: 'resident'
  });

  // Add user modal state
  const [addUserModal, setAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    year: '1',
    hospital: '',
    phone: '',
    role: 'resident' as 'resident' | 'admin'
  });

  const fetchSettings = async () => {
    // Mock settings for now
    setPacsUrl("https://demo.pacs.com");
    setMaintenanceMode(false);
    setMonthlyFee('5000');
  };

  const fetchPendingUsers = async () => {
    try {
      const data = await profiles.getAll();
      const pending = data.filter((u: any) => u.status === 'pending');
      setPendingUsers(pending.map((u: any) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Sans nom',
        email: u.email || '',
        hospital: u.hospital || 'Non spécifié',
        year: u.year ? `${u.year}ème année` : 'Non spécifié',
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : ''
      })));
    } catch (e) {
      console.error('Error fetching pending users:', e);
    }
  };

  const fetchApprovedUsers = async () => {
    try {
      const data = await profiles.getAll();
      // Fetch ALL users (not just approved)
      const allUsers = data.map((u: any) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Sans nom',
        email: u.email || '',
        hospital: u.hospital || 'Non spécifié',
        year: u.year ? `${u.year}ème année` : 'Non spécifié',
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '',
        role: u.role || 'resident',
        status: u.status || 'approved' // Add status field
      }));
      setApprovedUsers(allUsers);
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const fetchAllContributions = async () => {
    try {
      const data = await contributions.getAll();
      setAllContributions(data || []);
    } catch (e) {
      console.error('Error fetching contributions:', e);
    }
  };

  const fetchPendingAttendance = async () => {
    try {
      const data = await attendance.getPending();
      setPendingAttendance(data || []);
    } catch (e) {
      console.error('Error fetching pending attendance:', e);
      setPendingAttendance([]);
    }
  };

  const handleAttendanceAction = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await attendance.validate(id, status);
      fetchPendingAttendance();
      alert(status === 'confirmed' ? 'Émargement validé !' : 'Émargement rejeté.');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la validation.');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const blob = await attendance.exportCSV({ status: 'confirmed' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emargements_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'export.');
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPendingUsers();
    fetchApprovedUsers();
    fetchAllContributions();
    fetchPendingAttendance();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    // Mock save
    await new Promise(r => setTimeout(r, 500));
  };

  const handleSavePacs = async () => {
    await saveSetting('pacs_url', pacsUrl);
    alert("Serveur PACS configuré !");
  };

  const toggleMaintenance = async () => {
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    await saveSetting('maintenance_mode', String(newState));
  };

  const handleSaveFinance = async () => {
    await saveSetting('monthly_fee', monthlyFee);
    alert("Paramètres financiers mis à jour !");
  };

  const openApprovalModal = (user: PendingUser) => {
    setApprovalModal({ isOpen: true, user, selectedRole: 'resident' });
  };

  const handleApproveUser = async () => {
    if (!approvalModal.user) return;
    try {
      // First update status to approved
      await profiles.updateStatus(approvalModal.user.id, 'approved');
      // Then update role if admin was selected
      if (approvalModal.selectedRole === 'admin') {
        await profiles.updateRole(approvalModal.user.id, 'admin');
      }
      // Refresh both lists
      fetchPendingUsers();
      fetchApprovedUsers();
      setApprovalModal({ isOpen: false, user: null, selectedRole: 'resident' });
      alert(`Utilisateur approuvé en tant que ${approvalModal.selectedRole === 'admin' ? 'Administrateur' : 'Résident'} !`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'approbation.");
    }
  };

  const handleRejectUser = async (id: string) => {
    if (!window.confirm("Rejeter ce compte ? Cette action est irréversible.")) return;
    try {
      await profiles.updateStatus(id, 'rejected');
      fetchPendingUsers();
      fetchApprovedUsers();
      alert("Utilisateur rejeté.");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePromoteUser = async (id: string) => {
    if (!window.confirm("Promouvoir cet utilisateur Administrateur ?")) return;
    try {
      await profiles.updateRole(id, 'admin');
      fetchApprovedUsers();
      alert("Promotion réussie !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la promotion.");
    }
  };

  const handleDemoteUser = async (id: string) => {
    if (!window.confirm("Rétrograder cet utilisateur en Résident ?")) return;
    try {
      await profiles.updateRole(id, 'resident');
      fetchApprovedUsers();
      alert("Rétrogradation réussie !");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la rétrogradation.");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer définitivement l'utilisateur "${name}" ? Cette action est irréversible.`)) return;
    try {
      await profiles.delete(id);
      fetchApprovedUsers();
      fetchPendingUsers();
      alert("Utilisateur supprimé avec succès.");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression.");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    try {
      // Use the register endpoint to create the user
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          year: newUser.year,
          hospital: newUser.hospital,
          phone: newUser.phone,
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur');
      }

      const data = await response.json();

      // Now approve and set role
      await profiles.updateStatus(data.user.id, 'approved');
      if (newUser.role === 'admin') {
        await profiles.updateRole(data.user.id, 'admin');
      }

      setAddUserModal(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', year: '1', hospital: '', phone: '', role: 'resident' });
      fetchApprovedUsers();
      fetchPendingUsers();
      alert(`Utilisateur "${newUser.firstName} ${newUser.lastName}" créé avec succès !`);
    } catch (e: any) {
      console.error(e);
      alert(`Erreur: ${e.message}`);
    }
  };

  const deleteContribution = async (id: string) => {
    if (!window.confirm("Annuler ce versement définitivement ?")) return;
    try {
      await contributions.delete(id);
      fetchAllContributions();
      alert("Versement annulé.");
    } catch (e) {
      console.error(e);
      alert("Erreur.");
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    // Mock insert
    alert(`Message diffusé à tous les résidents (Simulation).`);
    setBroadcastMsg('');
  };

  // Bulk Actions
  const handleSelectAll = () => {
    const filteredUserIds = getFilteredUsers().map(u => u.id);
    if (selectedUsers.length === filteredUserIds.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUserIds);
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`Approuver ${selectedUsers.length} utilisateur(s) ?`)) return;

    try {
      for (const userId of selectedUsers) {
        await profiles.updateStatus(userId, 'approved');
      }
      alert(`${selectedUsers.length} utilisateur(s) approuvé(s) avec succès !`);
      setSelectedUsers([]);
      fetchApprovedUsers();
      fetchPendingUsers();
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Erreur lors de l\'approbation groupée');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    if (!window.confirm(`ATTENTION : Supprimer définitivement ${selectedUsers.length} utilisateur(s) ?`)) return;

    try {
      for (const userId of selectedUsers) {
        await profiles.delete(userId);
      }
      alert(`${selectedUsers.length} utilisateur(s) supprimé(s)`);
      setSelectedUsers([]);
      fetchApprovedUsers();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Erreur lors de la suppression groupée');
    }
  };

  // Export to Excel
  const handleExportUsers = () => {
    const users = getFilteredUsers();
    const csv = [
      ['Nom', 'Email', 'Hôpital', 'Année', 'Rôle', 'Statut', 'Date d\'inscription'].join(','),
      ...users.map(u => [
        u.name,
        u.email,
        u.hospital,
        u.year,
        u.role,
        u.status,
        u.date
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportContributions = () => {
    const csv = [
      ['Contributeur', 'Montant', 'Mois', 'Statut', 'Date'].join(','),
      ...allContributions.map(c => [
        c.contributor_name || 'N/A',
        c.amount,
        c.month || 'N/A',
        c.status || 'N/A',
        new Date(c.created_at).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contributions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter users based on search and status
  const getFilteredUsers = () => {
    return approvedUsers
      .filter(u => userFilter === 'all' || u.status === userFilter)
      .filter(u =>
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.hospital.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };


  const systemStatus = [
    { label: 'PACS Gateway', status: pacsUrl ? 'Configuré' : 'Non défini', color: pacsUrl ? 'text-emerald-500' : 'text-amber-500' },
    { label: 'Base de données', status: 'Synchronisée', color: 'text-emerald-500' },
    { label: 'Maintenance', status: maintenanceMode ? 'Actif' : 'Inactif', color: maintenanceMode ? 'text-red-500' : 'text-slate-500' },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-10 font-jakarta">
      {/* Approval Modal */}
      {approvalModal.isOpen && approvalModal.user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <div className="size-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Approuver l'inscription</h3>
              <p className="text-slate-400 text-sm">{approvalModal.user.name}</p>
              <p className="text-slate-500 text-xs">{approvalModal.user.email}</p>
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Attribuer le rôle</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setApprovalModal(prev => ({ ...prev, selectedRole: 'resident' }))}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${approvalModal.selectedRole === 'resident'
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl">school</span>
                  <span className="text-[10px] font-black uppercase">Résident</span>
                </button>
                <button
                  onClick={() => setApprovalModal(prev => ({ ...prev, selectedRole: 'admin' }))}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${approvalModal.selectedRole === 'admin'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                  <span className="text-[10px] font-black uppercase">Administrateur</span>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setApprovalModal({ isOpen: false, user: null, selectedRole: 'resident' })}
                className="flex-1 py-4 border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleApproveUser}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {addUserModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface-dark border border-surface-highlight rounded-[2rem] p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="size-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Ajouter un utilisateur</h3>
              <p className="text-slate-500 text-xs">Créer un nouveau compte directement</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nom *</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mot de passe *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Année</label>
                  <select
                    value={newUser.year}
                    onChange={e => setNewUser({ ...newUser, year: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                  >
                    <option value="1">1ère Année</option>
                    <option value="2">2ème Année</option>
                    <option value="3">3ème Année</option>
                    <option value="4">4ème Année</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Téléphone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                    placeholder="+228 00 00 00 00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Hôpital</label>
                <input
                  type="text"
                  value={newUser.hospital}
                  onChange={e => setNewUser({ ...newUser, hospital: e.target.value })}
                  className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-primary"
                  placeholder="CHU Campus"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Rôle</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role: 'resident' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newUser.role === 'resident'
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                      }`}
                  >
                    <span className="material-symbols-outlined text-2xl">school</span>
                    <span className="text-[10px] font-black uppercase">Résident</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newUser.role === 'admin'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                      }`}
                  >
                    <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                    <span className="text-[10px] font-black uppercase">Administrateur</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setAddUserModal(false);
                  setNewUser({ firstName: '', lastName: '', email: '', password: '', year: '1', hospital: '', phone: '', role: 'resident' });
                }}
                className="flex-1 py-4 border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
              >
                Créer l'utilisateur
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto space-y-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">security</span>
            <span>Privilèges Administrateur</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-foreground-light dark:text-foreground-dark uppercase tracking-tighter">Configuration Système</h2>
        </div>

        <div className="flex gap-1 bg-surface-dark p-1 rounded-2xl border border-surface-highlight overflow-x-auto hide-scrollbar shadow-2xl">
          <TabBtn label="Utilisateurs" icon="group" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabBtn label="Finances" icon="account_balance" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} />
          <TabBtn label="Émargements" icon="how_to_reg" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} />
          <TabBtn label="Diffusion" icon="campaign" active={activeTab === 'broadcast'} onClick={() => setActiveTab('broadcast')} />
          <TabBtn label="Système" icon="settings_suggest" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">person_add</span>
                    Demandes en attente
                  </h3>
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    {pendingUsers.length} Nouveau{pendingUsers.length > 1 ? 'x' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all gap-6">
                      <div className="flex items-center gap-5">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-black text-xl">
                          {user.name.split(' ')[1]?.[0] || user.name[0]}
                        </div>
                        <div>
                          <p className="text-lg font-black text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.hospital} • {user.year}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => openApprovalModal(user)} className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">Approuver</button>
                        <button onClick={() => handleRejectUser(user.id)} className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all">Rejeter</button>
                      </div>
                    </div>
                  )) : (
                    <div className="py-16 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                      <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">verified_user</span>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aucune demande d'adhésion en attente.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <h3 className="text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">group</span>
                    Gestion des Utilisateurs
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      {approvedUsers.filter(u => userFilter === 'all' || u.status === userFilter).length} Utilisateur{approvedUsers.filter(u => userFilter === 'all' || u.status === userFilter).length > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setAddUserModal(true)}
                      className="px-4 py-2 bg-primary text-white text-[10px] font-black rounded-xl uppercase flex items-center gap-2 hover:bg-primary-dark transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5 mb-8 overflow-x-auto hide-scrollbar">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Tous ({approvedUsers.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('approved')}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === 'approved' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Actifs ({approvedUsers.filter(u => u.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('pending')}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    En attente ({approvedUsers.filter(u => u.status === 'pending').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('rejected')}
                    className={`flex-1 min-w-[100px] py-3 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${userFilter === 'rejected' ? 'bg-red-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    Refusés ({approvedUsers.filter(u => u.status === 'rejected').length})
                  </button>
                </div>

                {/* Search Bar & Export */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email ou hôpital..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-primary transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    onClick={handleExportUsers}
                    className="px-4 py-3 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-xl uppercase flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Exporter CSV
                  </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectedUsers.length > 0 && (
                  <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <span className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-sm">{selectedUsers.length}</span>
                      <span className="text-sm font-bold text-white">utilisateur(s) sélectionné(s)</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkApprove}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-xl uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Approuver
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Supprimer
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="px-4 py-2 bg-white/5 text-slate-400 text-[10px] font-black rounded-xl uppercase hover:bg-white/10 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Select All Checkbox */}
                {getFilteredUsers().length > 0 && (
                  <div className="mb-4 flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === getFilteredUsers().length && getFilteredUsers().length > 0}
                      onChange={handleSelectAll}
                      className="size-4 rounded border-white/20 bg-white/10 checked:bg-primary cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tout sélectionner</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredUsers().map(user => (
                    <div key={user.id} className="flex flex-col p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-all gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          {/* Checkbox for bulk selection */}
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleToggleUser(user.id)}
                            className="size-4 rounded border-white/20 bg-white/10 checked:bg-primary cursor-pointer shrink-0"
                          />
                          <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-primary/20 text-primary border border-primary/20'}`}>
                            {user.name.split(' ')[1]?.[0] || user.name[0]}
                          </div>
                          <div>
                            <p className="text-base font-black text-white flex items-center gap-2">
                              {user.name}
                              {user.role === 'admin' && <span className="material-symbols-outlined text-[14px] text-amber-500" title="Administrateur">verified_user</span>}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.hospital} • {user.year}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-bold text-slate-400 uppercase">{user.role}</div>
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            user.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                            {user.status === 'approved' ? '✓ Actif' : user.status === 'pending' ? '⏳ En attente' : '✗ Refusé'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2 pt-4 border-t border-white/5">
                        {user.role !== 'admin' ? (
                          <button onClick={() => handlePromoteUser(user.id)} className="flex-1 py-2 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-xl uppercase hover:bg-indigo-500 hover:text-white transition-all">Promouvoir Admin</button>
                        ) : (
                          <button onClick={() => handleDemoteUser(user.id)} className="flex-1 py-2 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-xl uppercase hover:bg-amber-500 hover:text-white transition-all">Rétrograder</button>
                        )}
                        <button onClick={() => handleDeleteUser(user.id, user.name)} className="px-4 py-2 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-sm">delete</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">payments</span>
                  Paramètres des Cotisations
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Montant Mensuel (FCFA)</label>
                    <input type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} className="w-full bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-[10px] text-indigo-300 font-medium leading-relaxed italic">Ce montant sera utilisé comme référence pour le calcul automatique des dettes et des balances dans le module Cotisation.</p>
                  </div>
                  <button onClick={handleSaveFinance} className="w-full py-4.5 bg-indigo-500 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-indigo-500/20">Enregistrer les tarifs</button>
                </div>
              </div>

              <div className="bg-surface-dark border border-surface-highlight rounded-[2.5rem] p-8 shadow-2xl flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">history</span>
                    Dernières Transactions
                  </h3>
                  <button
                    onClick={handleExportContributions}
                    className="px-3 py-2 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-lg uppercase flex items-center gap-2 hover:bg-emerald-500 hover:text-slate-900 dark:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    Export
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2">Membre</th>
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2 text-right">Montant</th>
                        <th className="pb-4 text-[8px] font-black text-slate-500 uppercase px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allContributions.map(c => (
                        <tr key={c.id} className="group hover:bg-white/5">
                          <td className="py-4 px-2">
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{c.contributor_name}</p>
                            <p className="text-[7px] text-slate-500 uppercase">{c.month}</p>
                          </td>
                          <td className="py-4 px-2 text-right text-[10px] font-black text-emerald-500">{c.amount.toLocaleString()}</td>
                          <td className="py-4 px-2 text-right">
                            <button onClick={() => deleteContribution(c.id)} className="size-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all mx-auto mr-0"><span className="material-symbols-outlined text-xs">delete</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-surface-highlight rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tight flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">how_to_reg</span>
                  Émargements à Valider
                </h3>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    {pendingAttendance.length} En attente
                  </span>
                  <button
                    onClick={handleExportAttendance}
                    className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-xl uppercase flex items-center gap-2 hover:bg-emerald-500 hover:text-slate-900 dark:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Exporter CSV
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {pendingAttendance.length > 0 ? pendingAttendance.map((att: any) => (
                  <div key={att.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-primary/30 transition-all gap-6">
                    <div className="flex items-center gap-5">
                      <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl">
                          {att.itemType === 'staff' ? 'groups' : att.itemType === 'epu' ? 'school' : att.itemType === 'diu' ? 'workspace_premium' : 'location_on'}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-black text-slate-900 dark:text-white">{att.profile?.firstName} {att.profile?.lastName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-primary text-[10px] font-black uppercase tracking-widest">{att.itemType}</span>
                          <span className="text-slate-500 text-[10px] font-bold uppercase">•</span>
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            {new Date(att.createdAt).toLocaleDateString('fr-FR')} {new Date(att.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleAttendanceAction(att.id, 'confirmed')} className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-slate-900 dark:text-white text-[10px] font-black rounded-xl uppercase shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-sm">done</span> Valider
                      </button>
                      <button onClick={() => handleAttendanceAction(att.id, 'rejected')} className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl uppercase hover:bg-red-500 hover:text-slate-900 dark:text-white transition-all flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-sm">close</span> Rejeter
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center bg-black/20 rounded-[2rem] border border-dashed border-white/5">
                    <span className="material-symbols-outlined text-4xl text-slate-700 mb-4">checklist</span>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aucun émargement en attente de validation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-surface-highlight rounded-[2.5rem] p-10 md:p-14 shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-3">
                  <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-6"><span className="material-symbols-outlined text-4xl">campaign</span></div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Flash Info Global</h3>
                  <p className="text-slate-500 text-sm">Envoyez une notification instantanée qui apparaîtra sur le dashboard de tous les résidents connectés.</p>
                </div>
                <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Écrivez votre message d'urgence ou d'information ici..." className="w-full h-40 bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-slate-900 dark:text-white text-sm outline-none focus:border-amber-500 transition-all resize-none" />
                <button onClick={handleSendBroadcast} className="w-full py-5 bg-amber-500 text-slate-900 dark:text-white font-black rounded-2xl text-[10px] uppercase shadow-xl shadow-amber-500/20 transition-all">Diffuser le message</button>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl">
                  <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2"><span className="material-symbols-outlined text-primary">dataset</span>Passerelle PACS</h3>
                  <input type="text" value={pacsUrl} onChange={(e) => setPacsUrl(e.target.value)} placeholder="https://pacs.hopital.tg/viewer" className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white text-sm outline-none mb-6" />
                  <button onClick={handleSavePacs} className="w-full py-4.5 bg-primary text-slate-900 dark:text-white font-black rounded-2xl text-[10px] uppercase">Mettre à jour le lien</button>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-surface-highlight rounded-[2.5rem] p-10 shadow-2xl space-y-6">
                  <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest mb-4">État des Services</h3>
                  {systemStatus.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                      <span className={`text-[10px] font-black uppercase ${s.color}`}>{s.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`border rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 transition-all ${maintenanceMode ? 'bg-red-500/10 border-red-500' : 'bg-surface-dark border-surface-highlight shadow-2xl'}`}>
                <div className="flex items-center gap-6">
                  <div className={`size-16 rounded-2xl flex items-center justify-center ${maintenanceMode ? 'bg-red-500 text-slate-900 dark:text-white shadow-lg' : 'bg-red-500/10 text-red-500'}`}><span className="material-symbols-outlined text-4xl">construction</span></div>
                  <div><h4 className="text-slate-900 dark:text-white font-black text-xl uppercase mb-1">Mode Maintenance Global</h4><p className="text-slate-500 text-sm">Bloquer l'accès au portail pour tous les utilisateurs non-administrateurs.</p></div>
                </div>
                <button onClick={toggleMaintenance} className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${maintenanceMode ? 'bg-red-500 text-slate-900 dark:text-white shadow-xl' : 'bg-white/5 text-red-500 border border-red-500/30'}`}>{maintenanceMode ? 'Désactiver' : 'Activer'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ label, icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-slate-900 dark:text-white shadow-2xl' : 'text-slate-500 hover:text-slate-900 dark:text-white hover:bg-white/5'}`}>
    <span className="material-symbols-outlined text-lg">{icon}</span>{label}
  </button>
);

export default AdminSettings;
