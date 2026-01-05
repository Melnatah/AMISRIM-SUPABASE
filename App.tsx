
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Education from './components/Education';
import InternshipSites from './components/InternshipSites';
import Cotisation from './components/Cotisation';
import Loisir from './components/Loisir';
import Statistics from './components/Statistics';
import Messagerie from './components/Messagerie';
import DicomViewer from './components/DicomViewer';
import AdminSettings from './components/AdminSettings';
import Login from './components/Login';
import Signup from './components/Signup';
import SplashScreen from './components/SplashScreen';
import Profile from './components/Profile';
import { MOCK_SITES } from './constants';
import { Site } from './types';
import { auth, sites as sitesService } from './services/api';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'resident';
  avatar?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [sites, setSites] = useState<Site[]>([]);
  const [showSplash, setShowSplash] = useState(true);

  const loadUser = () => {
    if (auth.isAuthenticated()) {
      const user = auth.getCurrentUser();
      if (user) {
        const name = user.profile ? `${user.profile.firstName || user.profile.first_name || ''} ${user.profile.lastName || user.profile.last_name || ''}`.trim() : user.email.split('@')[0];
        // Normalisation du rôle (ADMIN -> admin)
        const role = (user.role === 'ADMIN' || user.role === 'admin') ? 'admin' : 'resident';

        setUser({
          id: user.id,
          name: name || user.email.split('@')[0],
          role: role as 'admin' | 'resident',
          avatar: user.profile?.avatar
        });
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // 1. Check Auth
      loadUser();

      // 2. Fetch Sites
      try {
        const sitesData = await sitesService.getAll();
        if (Array.isArray(sitesData)) {
          setSites(sitesData);
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };

    initApp();

    // Listen for user updates (e.g. from Profile component)
    const handleUserUpdate = () => {
      loadUser();
    };
    window.addEventListener('user-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

  const handleLogin = (name: string) => {
    // Legacy support or fallback if needed, but Supabase listener handles state now.
    // We can keep this empty or just log.
    console.log('Login triggered directly for:', name);
  };

  const handleLogout = async () => {
    auth.logout();
    setUser(null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return authView === 'login' ? (
      <Login onLogin={handleLogin} onNavigateToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onBackToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} sites={sites}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/education/*" element={<Education user={user} />} />
        <Route path="/education" element={<Education user={user} />} />
        <Route path="/sites" element={<InternshipSites user={user} />} />
        <Route path="/sites/:id" element={<InternshipSites user={user} />} />
        <Route path="/dicom" element={<DicomViewer />} />
        <Route path="/cotisation" element={<Cotisation user={user} />} />
        <Route path="/loisir/*" element={<Loisir user={user} />} />
        <Route path="/loisir" element={<Loisir user={user} />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/messagerie" element={<Messagerie user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/admin" element={user.role === 'admin' ? <AdminSettings /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

export default App;
