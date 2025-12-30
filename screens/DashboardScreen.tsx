
import React, { useState, useMemo } from 'react';
import { User, Contact, Screen, LogEntry } from '../types';
import { subscribeToContacts } from '../services/dataService';

interface DashboardScreenProps {
  user: User;
  onLogout: () => void;
  currentScreen: Screen;
  onNavigate: (screen: Screen, contact?: Contact) => void;
  logs?: LogEntry[];
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, currentScreen, onNavigate, logs = [] }) => {
  const [activeTab, setActiveTab] = useState('全部');
  const [selectedCircle, setSelectedCircle] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  React.useEffect(() => {
    if (user?.uid) {
      console.log("Dashboard: 訂閱使用者資料...", user.uid);
      const unsubscribe = subscribeToContacts(user.uid, (newContacts) => {
        console.log("Dashboard: 收到 Firestore 資料更新，筆數:", newContacts.length);
        console.log("資料內容:", newContacts);
        setContacts(newContacts);
      });
      return () => unsubscribe();
    } else {
      console.log("Dashboard: 尚未取得 user.uid，跳過訂閱");
    }
  }, [user]);

  const socialCircles = [
    { name: '全部', icon: 'groups' },
    { name: '廠商', icon: 'storefront' },
    { name: '客戶', icon: 'sentiment_satisfied' },
    { name: '家人', icon: 'family_restroom' },
    { name: 'VIP', icon: 'grade' },
  ];

  // Replacing allContacts dummy data with real 'contacts'
  const filteredContactsByLetter = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.company?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCircle = selectedCircle === '全部' || contact.tags?.includes(selectedCircle);
      return matchesSearch && matchesCircle;
    });

    // 根據 activeTab 進行二次過濾
    if (activeTab === 'AI 推薦') {
      // 邏輯：優先顯示 VIP 且很久沒互動的，或是沒有互動紀錄的
      filtered = filtered.filter(c => {
        const isVIP = c.tags?.includes('VIP');
        const hasNoInteractions = !c.interactions || c.interactions.length === 0;
        // 簡單實作：顯示 VIP 或 無互動紀錄者
        return isVIP || hasNoInteractions;
      });
    } else if (activeTab === '需要跟進') {
      // 邏輯：顯示有被標記為 '近期未聯繫' 或 '需要跟進' 的 (這裡暫時用 tags 判斷，或者可擴充邏輯)
      filtered = filtered.filter(c => c.tags?.includes('近期未聯繫') || c.tags?.includes('需要跟進'));
    }

    const groups: Record<string, Contact[]> = {};
    filtered.forEach(contact => {
      const firstLetter = (contact.initials?.[0] || contact.name.charAt(0)).toUpperCase();
      const key = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';

      if (!groups[key]) groups[key] = [];
      groups[key].push(contact);
    });

    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Contact[]>);
  }, [selectedCircle, searchQuery, contacts, activeTab]);

  const renderHistoryView = () => (
    <div className="flex flex-col gap-4 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">操作紀錄</h2>
        <span className="text-xs text-slate-400 font-medium">{logs.length} 筆活動</span>
      </div>
      <div className="flex flex-col gap-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50 dark:border-slate-700 flex gap-4">
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${log.type === 'create' ? 'bg-green-50 text-green-600' :
              log.type === 'update' ? 'bg-blue-50 text-blue-600' :
                log.type === 'photo' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'
              }`}>
              <span className="material-symbols-outlined text-[20px]">
                {log.type === 'create' ? 'person_add' :
                  log.type === 'update' ? 'edit_note' :
                    log.type === 'photo' ? 'image' : 'event_repeat'}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{log.action}</h4>
                <span className="text-[10px] text-slate-400">{log.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mb-1">對象：{log.contactName}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContactsView = () => (
    <div className="flex flex-col gap-4 pt-2">
      <div className="px-4">
        <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <span className="material-symbols-outlined text-slate-400 mr-2">search</span>
          <input
            type="text"
            placeholder="搜尋姓名、公司或職稱..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 text-slate-700 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">我的社交圈</h3>
          <span className="material-symbols-outlined text-slate-300 text-[16px]">settings</span>
        </div>
        <div className="flex gap-2.5 px-4 overflow-x-auto no-scrollbar py-1">
          {socialCircles.map((circle) => (
            <button
              key={circle.name}
              onClick={() => setSelectedCircle(circle.name)}
              className={`flex items-center gap-1.5 flex-none px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedCircle === circle.name
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:border-primary/50'
                }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: selectedCircle === circle.name ? "'FILL' 1" : "" }}>
                {circle.icon}
              </span>
              {circle.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 px-4 py-1 border-t border-slate-50 dark:border-slate-800 mt-1 pt-3">
        {['全部', 'AI 推薦', '需要跟進'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'text-slate-400 dark:text-slate-500'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 pb-12 min-h-[400px]">
        {Object.entries(filteredContactsByLetter).map(([letter, items]) => (
          <div key={letter} className="mb-6">
            <h2 className="text-primary text-[11px] font-bold mb-3 ml-2 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 w-7 h-7 flex items-center justify-center rounded-lg">{letter}</h2>
            <div className="flex flex-col gap-3">
              {(items as Contact[]).map(contact => (
                <div
                  key={contact.id}
                  onClick={() => onNavigate(Screen.CONTACT_DETAIL, contact)}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-3.5 flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-700 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      {contact.avatar ? (
                        <img src={contact.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700" alt={contact.name} />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-600 dark:text-indigo-200 ring-2 ring-white dark:ring-slate-700">
                          {contact.initials || contact.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">{contact.name}</h4>
                      <p className="text-slate-400 text-[11px] font-medium mt-0.5">{contact.role} {contact.company ? `@ ${contact.company}` : ''}</p>
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-2xl bg-[#f1f5f9] dark:bg-slate-700/50 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{contact.actionIcon || 'chevron_right'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 pb-20">
      <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-50 dark:border-slate-800">
        <button className="text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {currentScreen === Screen.HISTORY ? '活動紀錄' : '聯絡人清單'}
        </h1>
        <button onClick={() => onNavigate(Screen.CONTACT_DETAIL)} className="text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>add_circle</span>
        </button>
      </div>

      <div className="flex flex-col overflow-y-auto no-scrollbar">
        {currentScreen === Screen.HISTORY ? renderHistoryView() : renderContactsView()}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 px-4 z-40">
        <button onClick={() => onNavigate(Screen.DASHBOARD)} className={`flex flex-col items-center gap-1 min-w-[64px] ${currentScreen === Screen.DASHBOARD ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentScreen === Screen.DASHBOARD ? "'FILL' 1" : "", fontSize: '26px' }}>contacts</span>
          <span className="text-[11px] font-bold">聯絡人</span>
        </button>
        <button onClick={() => onNavigate(Screen.CHAT)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>smart_toy</span>
          <span className="text-[11px] font-medium">助理</span>
        </button>
        <button onClick={() => onNavigate(Screen.HISTORY)} className={`flex flex-col items-center gap-1 min-w-[64px] ${currentScreen === Screen.HISTORY ? 'text-primary' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentScreen === Screen.HISTORY ? "'FILL' 1" : "", fontSize: '26px' }}>history</span>
          <span className="text-[11px] font-bold">History</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>login</span>
          <span className="text-[11px] font-medium">登入</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardScreen;
