
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Signup from './components/Signup';
import SplashScreen from './components/SplashScreen';
import { MOCK_SITES } from './constants';
import { Site } from './types';
import { auth, sites as sitesService } from './services/api';

// Lazy loading for optimization
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Education = React.lazy(() => import('./components/Education'));
const InternshipSites = React.lazy(() => import('./components/InternshipSites'));
const Cotisation = React.lazy(() => import('./components/Cotisation'));
const Loisir = React.lazy(() => import('./components/Loisir'));
const Statistics = React.lazy(() => import('./components/Statistics'));
const Messagerie = React.lazy(() => import('./components/Messagerie'));
const DicomViewer = React.lazy(() => import('./components/DicomViewer'));
const AdminSettings = React.lazy(() => import('./components/AdminSettings'));
const Profile = React.lazy(() => import('./components/Profile'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
      <React.Suspense fallback={<LoadingFallback />}>
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
      </React.Suspense>
    </Layout>
  );
};

export default App;
