
import React, { useState } from 'react';
import Layout from './components/Layout';
import { Screen, User, Contact, LogEntry } from './types';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import ChatScreen from './screens/ChatScreen';
import ContactDetailScreen from './screens/ContactDetailScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
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

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (email: string) => {
    setUser({ email, name: email.split('@')[0] });
    setCurrentScreen(Screen.DASHBOARD);
  };

  const handleLogout = () => {
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
    if (!user && (currentScreen !== Screen.LOGIN && currentScreen !== Screen.REGISTER)) {
      return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
    }

    switch (currentScreen) {
      case Screen.LOGIN:
        return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
      case Screen.REGISTER:
        return <RegisterScreen onRegister={handleLogin} onNavigateLogin={() => navigateTo(Screen.LOGIN)} />;
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
          onBack={() => navigateTo(Screen.DASHBOARD)}
          onNavigate={navigateTo}
          onAddLog={addLog}
        />;
      default:
        return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => navigateTo(Screen.REGISTER)} />;
    }
  };

  return <Layout>{renderScreen()}</Layout>;
};

export default App;
