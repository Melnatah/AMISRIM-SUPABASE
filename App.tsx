
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
import { MOCK_SITES } from './constants';
import { Site } from './types';
import { supabase } from './services/supabase';

interface User {
  name: string;
  role: 'admin' | 'resident';
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { user_metadata } = session.user;
        const name = user_metadata.full_name || user_metadata.firstName || session.user.email?.split('@')[0] || 'Utilisateur';
        // Simple role check based on metadata or email
        const role = (session.user.email?.includes('admin') || user_metadata.role === 'admin') ? 'admin' : 'resident';
        setUser({ name, role });
      }
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const { user_metadata } = session.user;
        const name = user_metadata.full_name || user_metadata.firstName || session.user.email?.split('@')[0] || 'Utilisateur';
        const role = (session.user.email?.includes('admin') || user_metadata.role === 'admin') ? 'admin' : 'resident';
        setUser({ name, role });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (name: string) => {
    // Legacy support or fallback if needed, but Supabase listener handles state now.
    // We can keep this empty or just log.
    console.log('Login triggered directly for:', name);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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
        <Route path="/education/*" element={<Education />} />
        <Route path="/education" element={<Education />} />
        <Route path="/sites" element={<InternshipSites user={user} />} />
        <Route path="/sites/:id" element={<InternshipSites user={user} />} />
        <Route path="/dicom" element={<DicomViewer />} />
        <Route path="/cotisation" element={<Cotisation />} />
        <Route path="/loisir/*" element={<Loisir user={user} />} />
        <Route path="/loisir" element={<Loisir user={user} />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/messagerie" element={<Messagerie />} />
        <Route path="/admin" element={user.role === 'admin' ? <AdminSettings /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

export default App;
