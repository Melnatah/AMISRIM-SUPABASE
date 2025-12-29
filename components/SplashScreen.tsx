import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); // Wait for fade-out animation
        }, 4500); // Show for 4.5 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0c10] overflow-hidden transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
            </div>

            <div className="relative flex flex-col items-center text-center px-6">
                {/* Logo Animation */}
                <div className="mb-12 relative">
                    <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative size-24 md:size-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-2xl animate-logo-reveal">
                        <span className="material-symbols-outlined text-white text-5xl md:text-7xl">radiology</span>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-6 max-w-2xl">
                    <div className="overflow-hidden">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter animate-title-slide">
                            AMIS RIM <span className="text-primary">TOGO</span>
                        </h1>
                    </div>

                    <div className="h-[2px] w-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-line-expand mx-auto"></div>

                    <p className="text-lg md:text-xl font-medium text-slate-400 italic tracking-wide opacity-0 animate-fade-in-delayed">
                        "Au cœur de la santé, par l'imagerie médicale et le savoir"
                    </p>
                </div>

                {/* Loading Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-progress-load"></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Initialisation du portail</span>
                </div>
            </div>

            <style>{`
        @keyframes logo-reveal {
          0% { transform: scale(0.5) rotate(-20deg); opacity: 0; filter: blur(20px); }
          60% { transform: scale(1.1) rotate(5deg); opacity: 1; filter: blur(0); }
          100% { transform: scale(1) rotate(0); }
        }
        @keyframes title-slide {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes line-expand {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes fade-in-delayed {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress-load {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .animate-logo-reveal { animation: logo-reveal 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .animate-title-slide { animation: title-slide 1s cubic-bezier(0.23, 1, 0.32, 1) 0.5s forwards; }
        .animate-line-expand { animation: line-expand 1.2s cubic-bezier(0.23, 1, 0.32, 1) 1.2s forwards; }
        .animate-fade-in-delayed { animation: fade-in-delayed 1s ease-out 2s forwards; }
        .animate-progress-load { animation: progress-load 4s linear forwards; }
      `}</style>
        </div>
    );
};

export default SplashScreen;
