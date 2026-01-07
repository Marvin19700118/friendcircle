import React from 'react';

interface LoginScreenProps {
  onGoogleLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onGoogleLogin }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Hero Section */}
        <div className="flex flex-col items-center max-w-sm mx-auto text-center">
          <div className="w-full aspect-square rounded-[40px] overflow-hidden shadow-2xl shadow-indigo-500/20 mb-10 bg-white">
            <img
              src="/app_illustration.png"
              alt="Network AI Illustration"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            NetworkAI
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-12">
            Your personal AI relationship manager. Track interactions, get smart insights, and never lose touch with important connections.
          </p>
        </div>

        {/* Login Section */}
        <div className="w-full max-w-xs flex flex-col gap-6">
          <div className="relative flex items-center justify-center">
            <span className="bg-slate-50 dark:bg-slate-950 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest z-10">Get Started</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
          </div>

          <button
            onClick={onGoogleLogin}
            className="flex items-center justify-center gap-3 w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold h-14 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-[0.98]"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-slate-400 dark:text-slate-600">
          By continuing, you agree to our <a className="underline cursor-pointer hover:text-slate-600">Terms</a> and <a className="underline cursor-pointer hover:text-slate-600">Privacy Policy</a>
        </p>

      </div>
    </div>
  );
};

export default LoginScreen;
