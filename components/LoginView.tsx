import React from 'react';
import { signInWithGoogle } from '../authService';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const LoginView: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg relative overflow-hidden p-4">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-bright/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-dark/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="glass p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-app-dark to-app-deep flex items-center justify-center mx-auto mb-8 shadow-xl shadow-app-dark/20 text-white">
          <ShieldCheck size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-4xl font-black text-app-dark tracking-tight mb-3">InternPro</h1>
        <p className="text-app-slate font-bold opacity-70 mb-10 leading-relaxed">
          Secure Administrative Portfolio<br/>& Internship Tracking
        </p>

        <button 
          onClick={signInWithGoogle}
          className="w-full bg-white hover:bg-gray-50 text-app-dark font-black py-5 px-6 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-4 group border border-slate-100"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          <span className="uppercase tracking-widest text-sm">Sign in with Google</span>
          <ArrowRight size={18} className="text-app-light group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-10 pt-8 border-t border-app-dark/5">
          <p className="text-[10px] uppercase font-black text-app-slate/40 tracking-[0.2em]">Bethel University</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
