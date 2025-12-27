
import React, { useState, useRef, useEffect } from 'react';
import { Contact, Screen, Interaction, LogEntry } from '../types';
import { extractContactFromCard, getSuggestedTopics } from '../services/geminiService';

interface ContactDetailScreenProps {
  contact: Contact | null;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onAddLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

interface AISuggestion {
  topic: string;
  reason: string;
}

const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({ contact, onBack, onNavigate, onAddLog }) => {
  const isNew = !contact;
  const [activeSubTab, setActiveSubTab] = useState('總覽');
  
  // 基本資料狀態
  const [name, setName] = useState(contact?.name || '');
  const [role, setRole] = useState(contact?.role || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [notes, setNotes] = useState(contact?.notes || (isNew ? '' : ''));
  
  // 照片狀態 (最多 5 張)
  const [photos, setPhotos] = useState<string[]>(contact?.photos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 社交圈標籤
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [availableCircles, setAvailableCircles] = useState(['商務', '好友', '家教', 'VIP', '近期未聯繫']);
  const [showAddCircleInput, setShowAddCircleInput] = useState(false);
  const [newCircleValue, setNewCircleValue] = useState('');

  // AI 建議話題
  const [suggestedTopics, setSuggestedTopics] = useState<AISuggestion[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  // 名片掃描器狀態
  const [showScanner, setShowScanner] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 互動紀錄
  const [interactions, setInteractions] = useState<Interaction[]>(contact?.interactions || []);

  // 儲存邏輯
  const handleSaveContact = () => {
    onAddLog({
      action: isNew ? '新增聯絡人' : '更新聯絡資訊',
      contactName: name || '未命名',
      type: isNew ? 'create' : 'update',
      details: isNew ? `成功將 ${name} 加入您的通訊錄。` : `修改了 ${name} 的詳細資料。`
    });
    onBack();
  };

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewCircle = () => {
    const trimmed = newCircleValue.trim();
    if (trimmed) {
      if (!availableCircles.includes(trimmed)) setAvailableCircles(prev => [...prev, trimmed]);
      if (!tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);
      setNewCircleValue('');
      setShowAddCircleInput(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - photos.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => {
          const newPhotos = [...prev, reader.result as string].slice(0, 5);
          onAddLog({
            action: '上傳活動照片',
            contactName: name || '未命名',
            type: 'photo',
            details: `為 ${name || '未命名'} 上傳了一張新照片。`
          });
          return newPhotos;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const generateTopics = async () => {
    if (!name) return alert('請先輸入姓名以生成話題');
    setIsGeneratingTopics(true);
    try {
      const topics = await getSuggestedTopics({ name, role, company, notes }, interactions);
      setSuggestedTopics(topics);
      onAddLog({
        action: 'AI 話題生成',
        contactName: name,
        type: 'interaction',
        details: '為下次見面生成了 AI 破冰建議。'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // 相機控制
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showScanner) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        });
    }
    return () => stream?.getTracks().forEach(t => t.stop());
  }, [showScanner]);

  const captureCard = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCardImage(dataUrl);
      setShowScanner(false);
      handleOcr(dataUrl);
    }
  };

  const handleOcr = async (img: string) => {
    setIsScanning(true);
    try {
      const data = await extractContactFromCard(img, 'image/jpeg');
      if (data.name) setName(data.name);
      if (data.role) setRole(data.role);
      if (data.company) setCompany(data.company);
      if (data.phone) setPhone(data.phone);
      if (data.email) setEmail(data.email);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const renderOverview = () => (
    <div className="flex flex-col gap-6">
      {/* 名片掃描區 */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span>
            名片識別
          </h4>
          <button onClick={() => setShowScanner(true)} className="text-[11px] font-bold text-primary px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">啟動相機</button>
        </div>
        <div className="aspect-[1.6/1] border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden">
          {cardImage ? <img src={cardImage} className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-slate-200 text-4xl">add_a_photo</span>}
        </div>
        {isScanning && <div className="mt-3 text-center text-xs text-primary font-bold animate-pulse">AI 正在辨識名片...</div>}
      </section>

      {/* 活動照片 (最多 5 張) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">photo_library</span>
            活動照片 ({photos.length}/5)
          </h4>
          <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handlePhotoUpload} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-3">
          {photos.map((p, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100">
              <img src={p} className="w-full h-full object-cover" />
            </div>
          ))}
          {photos.length < 5 && (
            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300">
              <span className="material-symbols-outlined">add_photo_alternate</span>
            </button>
          )}
        </div>
      </section>

      {/* 社交圈標籤 */}
      <section>
        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3 px-1">社交圈</h4>
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
          {availableCircles.map(c => (
            <button key={c} onClick={() => toggleTag(c)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tags.includes(c) ? 'bg-primary text-white shadow-md' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>{c}</button>
          ))}
          {showAddCircleInput ? (
            <div className="flex gap-1">
              <input autoFocus className="w-20 px-2 py-1 text-xs border rounded-lg focus:ring-0" value={newCircleValue} onChange={e => setNewCircleValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNewCircle()} />
              <button onClick={handleAddNewCircle} className="text-primary material-symbols-outlined text-sm">check</button>
            </div>
          ) : (
            <button onClick={() => setShowAddCircleInput(true)} className="px-3 py-1.5 rounded-full border border-dashed border-slate-200 text-slate-300 text-xs font-bold">自定義</button>
          )}
        </div>
      </section>

      {/* AI 話題建議 */}
      <section className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-200">auto_awesome</span>
            AI 破冰話題建議
          </h4>
          <button onClick={generateTopics} className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md transition-all">
            {isGeneratingTopics ? '分析中...' : '重新生成'}
          </button>
        </div>
        {suggestedTopics.length > 0 ? (
          <div className="flex flex-col gap-3">
            {suggestedTopics.map((t, idx) => (
              <div key={idx} className="bg-white/10 border border-white/20 rounded-2xl p-3.5 backdrop-blur-sm">
                <p className="text-white text-sm font-bold leading-snug">{t.topic}</p>
                <p className="text-white/60 text-[10px] mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                  {t.reason}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-white/70 text-xs mb-4">讓 AI 根據過往互動，為您建議合適的話題。</p>
            <button onClick={generateTopics} className="bg-white text-indigo-600 px-6 py-2 rounded-full text-xs font-bold shadow-lg active:scale-95 transition-all">獲取建議</button>
          </div>
        )}
      </section>

      {/* 詳細資料欄位 */}
      <section className="flex flex-col gap-4">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm px-1">基本資料</h4>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-50 dark:divide-slate-700">
          <div className="p-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">手機號碼</label>
            <input className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 dark:text-white focus:ring-0" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xx-xxx-xxx" />
          </div>
          <div className="p-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">電子郵件</label>
            <input className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 dark:text-white focus:ring-0" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@mail.com" />
          </div>
          <div className="p-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">個人備註</label>
            <textarea className="w-full bg-transparent border-none p-0 text-sm text-slate-600 dark:text-slate-300 resize-none min-h-[80px] focus:ring-0" value={notes} onChange={e => setNotes(e.target.value)} placeholder="記錄關於對方的興趣、家庭或特別話題..." />
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-950 pb-24 overflow-y-auto no-scrollbar relative">
      {/* 掃描器全螢幕 UI */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="relative flex-1 flex flex-col items-center justify-between p-8 text-white">
            <button onClick={() => setShowScanner(false)} className="self-start w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-[85%] aspect-[1.6/1] border-2 border-white/50 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]"></div>
            <button onClick={captureCard} className="w-20 h-20 rounded-full border-4 border-white p-1 mb-8">
              <div className="w-full h-full rounded-full bg-white"></div>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-slate-50 dark:border-slate-800">
        <button onClick={onBack} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{isNew ? '新增聯絡人' : '編輯資料'}</h1>
        <button onClick={handleSaveContact} className="text-primary font-bold text-sm px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">儲存</button>
      </div>

      {/* 頂部個人化區塊 */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4 bg-white dark:bg-slate-900">
        <div className="relative mb-6">
          <img src={contact?.avatar || `https://ui-avatars.com/api/?name=${name || '?'}&background=random`} className="w-32 h-32 rounded-[40px] object-cover border-4 border-white shadow-xl" alt="Avatar" />
        </div>
        <input className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center bg-transparent border-none focus:ring-0 p-0 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="輸入姓名..." />
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-sm w-full">
          <input className="bg-transparent border-none focus:ring-0 p-0 text-right flex-1 min-w-0" value={role} onChange={e => setRole(e.target.value)} placeholder="職稱" />
          <span className="text-slate-300">@</span>
          <input className="bg-transparent border-none focus:ring-0 p-0 text-left flex-1 min-w-0" value={company} onChange={e => setCompany(e.target.value)} placeholder="公司名稱" />
        </div>
      </div>

      {/* 分頁標籤 */}
      <div className="flex px-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-[60px] z-40">
        {['總覽', '互動紀錄'].map(tab => (
          <button key={tab} onClick={() => setActiveSubTab(tab)} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${activeSubTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>{tab}</button>
        ))}
      </div>

      {/* 主內容區 */}
      <div className="p-4">
        {activeSubTab === '總覽' ? renderOverview() : (
          <div className="flex flex-col gap-6 pt-4 pl-4 border-l-2 border-slate-100 ml-4">
            {interactions.length > 0 ? interactions.map(it => (
              <div key={it.id} className="relative">
                <div className="absolute -left-[29px] top-0 w-6 h-6 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">{it.type === 'meeting' ? 'restaurant' : 'call'}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-50">
                  <h5 className="font-bold text-sm mb-1">{it.title}</h5>
                  <p className="text-[10px] text-slate-400 mb-2">{it.date}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{it.description}</p>
                </div>
              </div>
            )) : <div className="text-center py-20 text-slate-300 text-sm">目前尚無互動紀錄</div>}
          </div>
        )}
      </div>

      {/* 底部導航 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 px-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button onClick={() => onNavigate(Screen.DASHBOARD)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>contacts</span>
          <span className="text-[11px] font-bold">聯絡人</span>
        </button>
        <button onClick={() => onNavigate(Screen.CHAT)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>smart_toy</span>
          <span className="text-[11px] font-medium">助理</span>
        </button>
        <button onClick={() => onNavigate(Screen.HISTORY)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>history</span>
          <span className="text-[11px] font-bold">History</span>
        </button>
        <button onClick={() => onNavigate(Screen.LOGIN)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>login</span>
          <span className="text-[11px] font-medium">登入</span>
        </button>
      </div>
    </div>
  );
};

export default ContactDetailScreen;
