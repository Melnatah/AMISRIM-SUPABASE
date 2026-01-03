
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { supabase } from '../services/supabase';

const DicomViewer: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const launchPacs = async () => {
      try {
        // MOCKED
        const pacsUrl = "https://demo.pacs.com"; // Mock URL

        if (pacsUrl) {
          window.open(pacsUrl, '_blank');
          navigate('/');
        } else {
          setError("L'URL du PACS n'est pas configurée. Contactez l'administrateur.");
        }
      } catch (e) {
        console.error("Error fetching PACS URL", e);
        setError("Impossible de récupérer l'URL du PACS.");
      }
    };

    launchPacs();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background-dark text-white font-jakarta">
      {!error ? (
        <>
          <div className="size-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-black uppercase tracking-widest">Lancement du PACS...</h2>
          <p className="text-slate-500 text-xs mt-2">Veuillez autoriser les pop-ups si l'onglet ne s'ouvre pas.</p>
        </>
      ) : (
        <div className="text-center p-8 bg-red-500/10 border border-red-500 rounded-2xl">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4">link_off</span>
          <p className="text-red-500 font-bold">{error}</p>
          <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 bg-white/10 rounded-xl text-xs font-black uppercase hover:bg-white/20">Retour au Dashboard</button>
        </div>
      )}
    </div>
  );
};

export default DicomViewer;
