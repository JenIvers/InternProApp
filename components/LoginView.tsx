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
    } catch (err) {
      console.error("Login failed:", err);
      setIsLoading(false);
      setError(err instanceof Error && err.message ? err.message : "Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-4">
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-app-slate/15 shadow-2xl max-w-md w-full text-center">
        <img src={logo} alt="Bethel University" className="w-24 mx-auto mb-8" />
        <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-6 text-white">
          <ShieldCheck size={32} strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-app-dark to-app-bright bg-clip-text text-transparent">InternPro</h1>
        <p className="text-app-slate text-sm opacity-70 mb-10 leading-relaxed">
          Secure Administrative Portfolio<br/>& Internship Tracking
        </p>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-white hover:bg-app-slate/5 text-app-dark font-bold py-3 px-6 min-h-[48px] rounded-lg border border-app-slate/15 shadow-sm transition-colors flex items-center justify-center gap-4 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-app-bright" />
          ) : (
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          )}
          <span className="text-sm font-bold">
            {isLoading ? 'Connecting...' : 'Sign in with Google'}
          </span>
          {!isLoading && <ArrowRight size={18} className="text-app-slate group-hover:translate-x-1 transition-transform" />}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-1">Authentication Error</p>
            <p className="text-xs text-red-600 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-10 pt-8 border-t border-app-slate/10">
          <p className="text-[10px] uppercase font-semibold text-app-slate/50 tracking-wide">Bethel University</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
