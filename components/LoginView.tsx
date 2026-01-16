import React, { useState } from 'react';
import { signInWithGoogle } from '../authService';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import logo from '../bethel-logo.png';

const LoginView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Note: For redirect flow, the page will reload/redirect away.
      // For popup flow, it will finish and App.tsx will pick up the user change.
    } catch (err: any) {
      console.error("Login failed:", err);
      setIsLoading(false);
      setError(err.message || "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg relative overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-bright/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-dark/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="glass p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <img src={logo} alt="Bethel University" className="w-24 mx-auto mb-8 drop-shadow-md" />
        <div className="w-16 h-16 rounded-2xl bg-app-dark bg-gradient-to-br from-app-dark to-app-deep flex items-center justify-center mx-auto mb-6 shadow-xl shadow-app-dark/20 text-white">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-black text-app-dark tracking-tight mb-3">InternPro</h1>
        <p className="text-app-slate font-bold opacity-70 mb-10 leading-relaxed">
          Secure Administrative Portfolio<br/>& Internship Tracking
        </p>

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-gray-50 text-app-dark font-black py-5 px-6 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-4 group border border-slate-100 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-app-bright" />
          ) : (
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          )}
          <span className="uppercase tracking-widest text-sm">
            {isLoading ? 'Connecting...' : 'Sign in with Google'}
          </span>
          {!isLoading && <ArrowRight size={18} className="text-app-slate group-hover:translate-x-1 transition-transform" />}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-left animate-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Authentication Error</p>
            <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-app-dark/5">
          <p className="text-[10px] uppercase font-black text-app-slate/40 tracking-[0.2em]">Bethel University</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
