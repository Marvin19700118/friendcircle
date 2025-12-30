import React, { useState, useRef, useEffect } from 'react';
import { User, Message, Screen, Contact } from '../types';
import { getNetworkingAdvice } from '../services/geminiService';
import { subscribeToContacts } from '../services/dataService';

interface ChatScreenProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigate: (screen: Screen, contact?: Contact) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout, onNavigateHome, onNavigate }) => {
  // 真實聯絡人數據
  const [allContacts, setAllContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (user.uid) {
      const unsubscribe = subscribeToContacts(user.uid, (contacts) => {
        setAllContacts(contacts);
      });
      return () => unsubscribe();
    }
  }, [user.uid]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! 我是您的社交助理。您可以問我任何關於聯絡人的問題。", // Using generic greeting
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>(['誰最近生日？', '顯示最近互動', '有哪些 VIP 客戶？']);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      text: textToSend,
      time: getCurrentTime()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // 傳遞歷史訊息 + 真實聯絡人資料 給 Gemini
      const response = await getNetworkingAdvice(messages, textToSend, allContacts);

      // 解析相關聯絡人
      const relatedContacts = response.relevantContactIds
        ? allContacts.filter(c => response.relevantContactIds.includes(c.id))
        : [];

      const aiMessage: Message = {
        role: 'model',
        text: response.answer,
        time: getCurrentTime(),
        contacts: relatedContacts
      };

      setMessages(prev => [...prev, aiMessage]);
      if (response.suggestedQuestions && response.suggestedQuestions.length > 0) {
        setActiveSuggestions(response.suggestedQuestions);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "抱歉，發生錯誤，請稍後再試。",
        time: getCurrentTime()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 dark:border-slate-800">
        <button onClick={onNavigateHome} className="text-slate-800 dark:text-white">
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Networking Assistant</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[10px] text-slate-500 font-medium">Online</span>
          </div>
        </div>
        <button className="text-slate-800 dark:text-white">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-44 no-scrollbar">
        {/* Date Divider */}
        <div className="flex justify-center my-6">
          <span className="text-[11px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Today</span>
        </div>

        <div className="flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex - col ${msg.role === 'user' ? 'items-end' : 'items-start'} `}>
              <div className={`flex items - end gap - 2.5 max - w - [90 %] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} `}>
                {/* Assistant Avatar */}
                {msg.role === 'model' && (
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-100">
                    <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="AI" />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className={`px - 4 py - 3 rounded - [20px] text - [15px] leading - relaxed shadow - sm ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-50 dark:border-slate-700 rounded-bl-none'
                    } `}>
                    {msg.text}
                  </div>

                  {/* Status Label */}
                  {msg.role === 'user' && (
                    <span className="text-[10px] text-slate-400 font-medium pr-1">Read {msg.time}</span>
                  )}
                </div>
              </div>

              {/* Render Contact Cards if available */}
              {msg.contacts && msg.contacts.length > 0 && (
                <div className="w-full max-w-[90%] mt-3 flex flex-col gap-2 ml-11">
                  {msg.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => onNavigate(Screen.CONTACT_DETAIL, contact)}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-3 flex items-center justify-between border border-slate-50 dark:border-slate-700 shadow-sm hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src={contact.avatar} className="w-11 h-11 rounded-full object-cover" alt={contact.name} />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{contact.name}</h4>
                          <p className="text-slate-400 text-[11px] mt-0.5">{contact.role}</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                      </div>
                    </div>
                  ))}
                  <button className="flex items-center justify-end gap-1 text-primary text-[13px] font-bold mt-2 pr-2 hover:underline">
                    Explore all {msg.contacts.length} profiles <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-end gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-100">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" alt="AI" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 shadow-sm border border-slate-50 dark:border-slate-700 rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Section Container */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-50">

        {/* Suggestion Chips */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
          {activeSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="flex-none px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-primary text-[13px] font-bold rounded-xl hover:bg-primary hover:text-white transition-all whitespace-nowrap border border-blue-100 dark:border-blue-800"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 pb-6 pt-1">
          <button className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors shrink-0">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask about your network.."
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-5 pr-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`w - 11 h - 11 rounded - full flex items - center justify - center transition - all shrink - 0 ${input.trim() ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-95' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
              } `}
          >
            <span className="material-symbols-outlined text-[22px]">send</span>
          </button>
        </div>

        {/* Footer Encryption Info */}
        <div className="flex items-center justify-center gap-1.5 pb-4 opacity-30">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Personal Context Encrypted</span>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
