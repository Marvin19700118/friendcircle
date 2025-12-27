
import React, { useState } from 'react';
import Input from '../components/Input';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onNavigateRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top App Bar */}
      <div className="flex items-center p-4 pb-2 justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer transition-opacity hover:opacity-70">
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </div>
        <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">登入 / 註冊</h2>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center px-4 pt-4 pb-2">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>hub</span>
        </div>
        <h1 className="text-[#111418] dark:text-white tracking-tight text-[28px] font-bold leading-tight text-center">歡迎回來</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal pt-2 text-center max-w-xs">
          您的個人人脈 AI 助手，<br />隨時隨地連結重要關係。
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-6 w-full">
        <Input
          label="電子郵件或電話號碼"
          placeholder="name@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="mail"
          required
        />
        <Input
          label="密碼"
          placeholder="輸入您的密碼"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showToggle
          isToggled={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          required
        />
        
        <div className="flex justify-end">
          <a className="text-primary text-sm font-medium hover:underline cursor-pointer">忘記密碼？</a>
        </div>

        <button 
          type="submit"
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] w-full shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors mt-2"
        >
          登入
        </button>

        <div className="flex justify-center mt-2">
          <button 
            type="button"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>face</span>
            使用 Face ID 登入
          </button>
        </div>
      </form>

      {/* Social Login Section */}
      <div className="flex flex-col px-6 pb-6 w-full">
        <div className="relative py-4 flex items-center w-full">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium uppercase tracking-wider">或透過以下方式繼續</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>
        <div className="flex flex-col gap-3">
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-black dark:bg-white text-white dark:text-black text-base font-bold leading-normal tracking-[0.015em] w-full hover:opacity-80 transition-opacity">
            <span className="mr-2 flex items-center">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-.98-.4-2.12-.45-3.03.35-1.12.95-2.28.93-3.23-.3C5.7 18.15 4 14.7 6.45 10.5c1.1-1.8 2.95-2.4 4.4-2.2 1.25.15 2.2.8 2.9.8.7 0 1.95-.9 3.25-.8 1.45.1 2.5.8 3.2 1.85-2.8 1.4-2.35 5.5.55 6.75-.4 1.15-.95 2.25-1.7 3.38zM13 6.3c-.25 2.05-1.95 3.5-3.6 3.4-.4-1.95 1.55-3.8 3.6-3.4z"></path></svg>
            </span>
            透過 Apple 登入
          </button>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#111418] dark:text-white text-base font-medium leading-normal tracking-[0.015em] w-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="mr-2 flex items-center">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            </span>
            透過 Google 登入
          </button>
        </div>
      </div>

      {/* Bottom Link */}
      <div className="flex items-center justify-center pb-8 pt-2">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          還沒有帳號？ <a onClick={onNavigateRegister} className="text-primary font-bold hover:underline cursor-pointer ml-1">立即註冊</a>
        </p>
      </div>

      {/* Footer Terms */}
      <div className="px-6 pb-6 text-center">
        <p className="text-slate-400 dark:text-slate-600 text-xs leading-relaxed">
          繼續使用即表示您同意我們的<br />
          <a className="underline hover:text-slate-500 cursor-pointer">服務條款</a> 和 <a className="underline hover:text-slate-500 cursor-pointer">隱私權政策</a>
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
