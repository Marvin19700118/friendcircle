
import React, { useState } from 'react';
import Input from '../components/Input';

interface RegisterScreenProps {
  onRegister: (email: string, password: string, name: string) => void;
  onNavigateLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister, onNavigateLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name && password) {
      onRegister(email, password, name);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center p-4 pb-2 justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div
          onClick={onNavigateLogin}
          className="text-[#111418] dark:text-white flex size-12 shrink-0 items-center justify-start cursor-pointer transition-opacity hover:opacity-70"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
        </div>
        <h2 className="text-[#111418] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">註冊新帳號</h2>
      </div>

      <div className="flex flex-col items-center px-4 pt-6 pb-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>person_add</span>
        </div>
        <h1 className="text-[#111418] dark:text-white tracking-tight text-2xl font-bold text-center">加入 NetworkAI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center max-w-xs">
          開始使用智慧 AI 提升您的人際網絡品質
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-6 w-full">
        <Input
          label="姓名"
          placeholder="您的全名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="電子郵件"
          placeholder="name@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon="mail"
          required
        />
        <Input
          label="密碼"
          placeholder="至少 8 個字元"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] w-full shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors mt-4"
        >
          註冊
        </button>
      </form>

      <div className="flex items-center justify-center pb-8 pt-2 mt-auto">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          已經有帳號？ <a onClick={onNavigateLogin} className="text-primary font-bold hover:underline cursor-pointer ml-1">登入</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
