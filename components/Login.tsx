
import React, { useState } from 'react';
import { auth } from '../services/api';

interface LoginProps {
  onLogin: (name: string) => void;
  onNavigateToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToSignup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    FR: {
      title: "AMIS RIM TOGO",
      subtitle: "portail officiel des des en imagerie médicale au togo",
      userLabel: "Nom d'utilisateur ou Email",
      passLabel: "Mot de passe",
      forgotPass: "Mot de passe oublié ?",
      remember: "Se souvenir de moi",
      loginBtn: "SE CONNECTER",
      noAccount: "Pas encore membre ?",
      request: "Demander l'accès",
      error: "Veuillez remplir tous les champs.",
      copy: "© 2025 AMIS RIM TOGO"
    },
    EN: {
      title: "AMIS RIM TOGO",
      subtitle: "Official Radiology Residents Portal",
      userLabel: "Username or Email",
      passLabel: "Password",
      forgotPass: "Forgot password?",
      remember: "Remember me",
      loginBtn: "SIGN IN",
      noAccount: "Not a member yet?",
      request: "Request access",
      error: "Please fill in all fields.",
      copy: "© 2025 AMIS RIM TOGO"
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      setIsLoading(true);
      setError('');
      try {
        const user = await auth.login(username, password);
        // Construire le nom d'affichage
        const displayName = user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
          : user.email.split('@')[0];

        onLogin(displayName);
        // Recharger pour que App.tsx détecte la session
        window.location.reload();
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'Échec de la connexion');
        setIsLoading(false);
      }
    } else {
      setError(t.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark font-jakarta p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20 flex gap-1 bg-surface-dark border border-surface-highlight rounded-full p-1 shadow-lg">
        {(['FR', 'EN'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${lang === l ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-surface-dark/80 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="size-20 rounded-[1.5rem] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white mb-5 shadow-2xl shadow-primary/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="material-symbols-outlined text-4xl filled">medical_services</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">{t.title}</h1>
            <p className="text-text-secondary text-sm font-medium opacity-80">{t.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">{t.userLabel}</label>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-sm font-medium"
                  placeholder="nom@ecole.tg"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.passLabel}</label>
                <button type="button" className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest">{t.forgotPass}</button>
              </div>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-background-dark/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`size-5 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary text-white' : 'border-white/10 bg-white/5'}`}
              >
                {rememberMe && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
              </button>
              <span className="text-xs text-slate-400 font-medium cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                {t.remember}
              </span>
            </div>

            {error && <p className="text-red-500 text-xs font-bold text-center animate-bounce">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {t.loginBtn}
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">login</span>
                </>
              )}
            </button>
          </form>


          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-slate-400 text-xs font-medium">
              {t.noAccount} <button onClick={onNavigateToSignup} className="text-primary font-black hover:underline underline-offset-4 ml-1">{t.request}</button>
            </p>
          </div>
        </div>
        <p className="text-center mt-10 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">{t.copy}</p>
      </div>
    </div>
  );
};

export default Login;
