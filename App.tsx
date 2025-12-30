
import React, { useState } from 'react';
import Layout from './components/Layout';
import { Screen, User, Contact, LogEntry } from './types';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';

import { auth, initializationError } from './services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { loginUser, registerUser, logoutUser, loginWithGoogle } from './services/authService';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      action: '系統初始化',
      contactName: 'NetworkAI',
      timestamp: '剛剛',
      details: '歡迎使用 NetworkAI，您的個人助理已準備就緒。',
      type: 'create'
    }
  ]);

  // Auth State Listener
  React.useEffect(() => {
    // Safety check: if auth is null (init failed), simply stop loading and don't crash
    if (!auth) {
      console.warn("Firebase Auth not initialized. Skipping auth listener.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          uid: firebaseUser.uid
        });
        if (currentScreen === Screen.LOGIN || currentScreen === Screen.REGISTER) {
          setCurrentScreen(Screen.DASHBOARD);
        }
      } else {
        setUser(null);
        setCurrentScreen(Screen.LOGIN);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentScreen]);

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = async (email: string, password?: string) => {
    if (!password) return; // Should not happen with updated UI
    const { error } = await loginUser(email, password);
    if (error) {
      alert(error); // Using alert for simplicity as requested not to change UI components too much
    }
    // Success State handled by useEffect
  };

  const handleGoogleLogin = async () => {
    const { error } = await loginWithGoogle();
    if (error) alert(error);
  };

  const handleRegister = async (email: string, password?: string, name?: string) => {
    if (!password || !name) return;
    const { error } = await registerUser(email, password, name);
    if (error) {
      alert(error);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setSelectedContact(null);
    setCurrentScreen(Screen.LOGIN);
  };

  const navigateTo = (screen: Screen, contact?: Contact) => {
    if (contact) setSelectedContact(contact);
    else if (screen !== Screen.CONTACT_DETAIL) setSelectedContact(null);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    if (initializationError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
          <div className="text-red-500 font-bold text-xl mb-4">系統設定錯誤</div>
          <p className="text-slate-600 mb-2">無法連接至 Firebase 服務。</p>
          <p className="text-slate-400 text-sm bg-slate-100 p-2 rounded">{(initializationError as Error).message}</p>
          <p className="mt-8 text-sm text-slate-500">請檢查您的 .env 檔案是否設定正確。</p>
        </div>
      );
    }
    if (isLoading) return <div className="flex h-screen items-center justify-center">載入中...</div>;

    if (!user && (currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER)) {
      return <LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
    }

    switch (currentScreen) {
      case Screen.LOGIN:
        return <LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
      case Screen.REGISTER:
        return <RegisterScreen onRegister={handleRegister} onNavigateLogin={() => navigateTo(Screen.LOGIN)} />;
      case Screen.DASHBOARD:
      case Screen.HISTORY:
        return <DashboardScreen
          user={user!}
          onLogout={handleLogout}
          currentScreen={currentScreen}
          onNavigate={navigateTo}
          logs={logs}
        />;
      case Screen.CHAT:
        return <ChatScreen
          user={user!}
          onLogout={handleLogout}
          onNavigateHome={() => navigateTo(Screen.DASHBOARD)}
          onNavigate={navigateTo}
        />;
      case Screen.CONTACT_DETAIL:
        return <ContactDetailScreen
          contact={selectedContact}
          userId={user?.uid}
          onBack={() => navigateTo(Screen.DASHBOARD)}
          onNavigate={navigateTo}
          onAddLog={addLog}
        />;
      default:
        return <LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
    }
  };

  return <Layout>{renderScreen()}</Layout>;
};

export default App;
