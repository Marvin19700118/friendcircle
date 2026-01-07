
import React, { useState, useRef, useEffect } from 'react';
import { Contact, Screen, Interaction, LogEntry } from '../types';
import { extractContactFromCard, getSuggestedTopics, getProfileSummary } from '../services/geminiService';
import { addContact, updateContact, deleteContact, subscribeToTags, addTag } from '../services/dataService';

interface ContactDetailScreenProps {
  contact: Contact | null;
  userId?: string;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onAddLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

interface AISuggestion {
  topic: string;
  reason: string;
}

const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({ contact, userId, onBack, onNavigate, onAddLog }) => {
  const isNew = !contact;
  const [activeSubTab, setActiveSubTab] = useState('總覽');

  // 基本資料狀態
  const [name, setName] = useState(contact?.name || '');
  const [role, setRole] = useState(contact?.role || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [birthday, setBirthday] = useState(contact?.birthday || '');
  const [linkedin, setLinkedin] = useState(contact?.linkedin || '');
  const [facebook, setFacebook] = useState(contact?.facebook || '');
  const [notes, setNotes] = useState(contact?.notes || (isNew ? '' : ''));
  const [isGeneratingSummary, setIsGeneratingSummary] = useState({ linkedin: false, facebook: false });

  // 照片狀態 (最多 5 張)
  const [photos, setPhotos] = useState<string[]>(contact?.photos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 社交圈標籤
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [dynamicTags, setDynamicTags] = useState<string[]>([]);
  const [showAddCircleInput, setShowAddCircleInput] = useState(false);
  const [newCircleValue, setNewCircleValue] = useState('');

  useEffect(() => {
    if (userId) {
      const unsubscribe = subscribeToTags(userId, (tags) => {
        setDynamicTags(tags.map(t => t.name));
      });
      return () => unsubscribe();
    }
  }, [userId]);

  // Merge default circles with dynamic tags
  const allCircles = React.useMemo(() => {
    const defaults = ['廠商', '客戶', '家人', 'VIP'];
    // Use Set to avoid duplicates
    return Array.from(new Set([...defaults, ...dynamicTags]));
  }, [dynamicTags]);

  // AI 建議話題
  const [suggestedTopics, setSuggestedTopics] = useState<AISuggestion[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  // 名片掃描器狀態
  const [showScanner, setShowScanner] = useState(false);
  const [cardImage, setCardImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  // 互動紀錄狀態
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState<{
    type: 'meeting' | 'call' | 'email';
    date: string;
    title: string;
    description: string;
  }>({ type: 'meeting', date: new Date().toISOString().split('T')[0], title: '', description: '' });

  // 互動紀錄
  const [interactions, setInteractions] = useState<Interaction[]>(contact?.interactions || []);

  const saveNewInteraction = () => {
    if (!newInteraction.title || !newInteraction.date) return alert("請輸入標題與日期");
    const interaction: Interaction = {
      id: Date.now().toString(),
      ...newInteraction,
      timeLabel: '剛剛'
    };
    setInteractions([interaction, ...interactions]);
    setShowAddInteraction(false);
    setNewInteraction({ type: 'meeting', date: new Date().toISOString().split('T')[0], title: '', description: '' });

    // Auto save or just update state? The user must click "Save" on top right to persist to DB.
    // We can add a toast or alert here to remind user to save.
  };
  const handleCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setCardImage(result);
      handleOcr(result);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  // 互動紀錄宣告已移至上方，此處刪除重複宣告

  // 儲存邏輯
  // 儲存核心邏輯
  const performSave = async (silent: boolean = false): Promise<boolean> => {
    if (!userId) {
      if (!silent) alert("錯誤：無法識別使用者身分 (User ID missing)");
      return false;
    }

    // 檢查必要欄位
    if (!name.trim()) {
      // 如果是自動儲存且為新聯絡人，若沒名字則視為放棄新增，直接回傳 true (允許離開)
      if (silent && isNew) return true;
      if (!silent) alert("請輸入姓名");
      return false;
    }

    try {
      const contactData = {
        name,
        role,
        company,
        phone,
        email,
        birthday,
        linkedin,
        facebook,
        notes,
        tags,
        photos,
        interactions,
        avatar: contact?.avatar || null,
        initials: name ? name.charAt(0).toUpperCase() : '?',
        updatedAt: new Date().toISOString()
      };

      if (isNew) {
        await addContact(userId, contactData);
        if (!silent) {
          onAddLog({
            action: '新增聯絡人',
            contactName: name || '未命名',
            type: 'create',
            details: `成功將 ${name} 加入您的通訊錄。`
          });
        }
      } else {
        await updateContact(userId, contact.id, contactData);
        if (!silent) {
          onAddLog({
            action: '更新聯絡資訊',
            contactName: name || '未命名',
            type: 'update',
            details: `修改了 ${name} 的詳細資料。`
          });
        }
      }
      return true;
    } catch (e: any) {
      console.error("Save failed:", e);
      if (!silent) {
        let errorMessage = "儲存失敗";
        if (e.code === 'permission-denied') errorMessage = "權限不足";
        else if (e.message) errorMessage = `儲存錯誤: ${e.message}`;
        alert(errorMessage);
      }
      return false;
    }
  };

  const handleSaveContact = async () => {
    const success = await performSave(false);
    if (success) {
      // alert("儲存成功！"); // Manual save usually implies exit or stay? The original code exited.
      onBack();
    }
  };

  const handleBack = async () => {
    await performSave(true); // Auto-save silently
    onBack();
  };

  const handleNavigationWrapper = async (targetScreen: Screen) => {
    await performSave(true); // Auto-save silently
    onNavigate(targetScreen);
  };

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewCircle = async () => {
    const trimmed = newCircleValue.trim();
    if (trimmed && userId) {
      // 如果是全新的標籤（不在預設也不在 Firestore 中），則同步到 Firestore
      const defaults = ['廠商', '客戶', '家人', 'VIP'];
      if (!defaults.includes(trimmed) && !dynamicTags.includes(trimmed)) {
        try {
          await addTag(userId, { name: trimmed, icon: 'label' });
        } catch (error) {
          console.error("Error adding tag:", error);
        }
      }

      // 將標籤加入當前聯絡人
      if (!tags.includes(trimmed)) setTags(prev => [...prev, trimmed]);

      setNewCircleValue('');
      setShowAddCircleInput(false);
    }
  };

  const handleDelete = async () => {
    if (!contact || !userId) return;

    if (window.confirm(`確定要刪除聯絡人 ${name} 嗎？此動作無法復原。`)) {
      try {
        await deleteContact(userId, contact.id);
        onAddLog({
          action: '刪除聯絡人',
          contactName: name,
          type: 'delete',
          details: `已將 ${name} 從聯絡人清單中移除。`
        });
        onBack();
      } catch (error) {
        console.error("Delete failed:", error);
        alert("刪除失敗，請稍後再試");
      }
    }
  };

  // 圖片壓縮輔助函式
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // 壓縮品質 0.7
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - photos.length;
    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);

    // 顯示 Loading 或提示處理中 (這裡簡化，直接處理)
    try {
      const compressedImages = await Promise.all(filesToProcess.map(file => compressImage(file)));
      setPhotos(prev => {
        const newPhotos = [...prev, ...compressedImages].slice(0, 5);
        onAddLog({
          action: '上傳活動照片',
          contactName: name || '未命名',
          type: 'photo',
          details: `為 ${name || '未命名'} 上傳了 ${compressedImages.length} 張新照片。`
        });
        return newPhotos;
      });
    } catch (error) {
      console.error("Image compression failed:", error);
      alert("圖片處理失敗，請試著上傳較小的圖片。");
    }
    // Reset file input
    e.target.value = '';
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

  const generateSummary = async (type: 'linkedin' | 'facebook') => {
    const url = type === 'linkedin' ? linkedin : facebook;
    if (!url) return alert(`請先輸入 ${type === 'linkedin' ? 'LinkedIn' : 'Facebook'} 網址`);

    setIsGeneratingSummary(prev => ({ ...prev, [type]: true }));
    try {
      const summary = await getProfileSummary(url);
      const title = type === 'linkedin' ? 'LinkedIn 摘要' : 'Facebook 摘要';
      setNotes(prev => prev ? `${prev}\n\n【${title}】\n${summary}` : `【${title}】\n${summary}`);
      onAddLog({
        action: 'AI 摘要生成',
        contactName: name,
        type: 'interaction',
        details: `已將 ${title} 加入備註。`
      });
    } catch (err) {
      console.error(err);
      alert('摘要生成失敗');
    } finally {
      setIsGeneratingSummary(prev => ({ ...prev, [type]: false }));
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
      // handleOcr(dataUrl); // Removed auto-OCR
    }
  };

  const handleOcr = async (img: string) => {
    if (!img) return;
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
      alert("識別失敗，請重試或手動輸入");
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
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              hidden
              ref={cardInputRef}
              onChange={handleCardUpload}
            />
            <button onClick={() => cardInputRef.current?.click()} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">上傳照片</button>
            <button onClick={() => setShowScanner(true)} className="text-[11px] font-bold text-primary px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">啟動相機</button>
          </div>
        </div>
        <div className="aspect-[1.6/1] border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden relative group">
          {cardImage ? <img src={cardImage} className="w-full h-full object-contain" /> : <span className="material-symbols-outlined text-slate-200 text-4xl">add_a_photo</span>}
          {cardImage && (
            <>
              <button
                onClick={() => { setCardImage(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                title="移除圖片"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              {/* 識別按鈕 (懸浮於圖片中央或下方) */}
              {!isScanning && (
                <button
                  onClick={() => cardImage && handleOcr(cardImage)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">document_scanner</span>
                  開始識別
                </button>
              )}
            </>
          )}
        </div>
        {isScanning && <div className="mt-3 text-center text-xs text-primary font-bold animate-pulse flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          AI 正在辨識名片資訊...
        </div>}
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
          {allCircles.map(c => (
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">生日</label>
            <input type="date" className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 dark:text-white focus:ring-0" value={birthday} onChange={e => setBirthday(e.target.value)} />
          </div>
          <div className="p-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
              LinkedIn
              <button
                onClick={() => generateSummary('linkedin')}
                disabled={isGeneratingSummary.linkedin}
                className="flex items-center gap-1 text-[10px] text-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px]">{isGeneratingSummary.linkedin ? 'hourglass_empty' : 'auto_awesome'}</span>
                {isGeneratingSummary.linkedin ? '分析中...' : 'AI 摘要'}
              </button>
            </label>
            <input
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 dark:text-white focus:ring-0 placeholder:text-slate-300"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="p-4 flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
              Facebook
              <button
                onClick={() => generateSummary('facebook')}
                disabled={isGeneratingSummary.facebook}
                className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[12px]">{isGeneratingSummary.facebook ? 'hourglass_empty' : 'auto_awesome'}</span>
                {isGeneratingSummary.facebook ? '分析中...' : 'AI 摘要'}
              </button>
            </label>
            <input
              className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 dark:text-white focus:ring-0 placeholder:text-slate-300"
              value={facebook}
              onChange={e => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
            />
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
        <button onClick={handleBack} className="text-slate-800 dark:text-white"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{isNew ? '新增聯絡人' : '編輯資料'}</h1>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="text-rose-500 font-bold p-2 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          )}
          <button onClick={handleSaveContact} className="text-primary font-bold text-sm px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">儲存</button>
        </div>
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
          <div className="flex flex-col gap-6 pt-4">
            {/* 新增互動按鈕或表單 */}
            {!showAddInteraction ? (
              <button
                onClick={() => setShowAddInteraction(true)}
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined">add_circle</span>
                新增互動紀錄
              </button>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
                <h5 className="font-bold text-slate-800 dark:text-white mb-3">新增互動</h5>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['meeting', 'call', 'email'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setNewInteraction({ ...newInteraction, type: t })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${newInteraction.type === t ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100'}`}
                      >
                        {t === 'meeting' ? '見面' : t === 'call' ? '通話' : '郵件'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                    value={newInteraction.date}
                    onChange={e => setNewInteraction({ ...newInteraction, date: e.target.value })}
                  />
                  <input
                    placeholder="標題 (例如：早餐會、專案討論)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 text-sm"
                    value={newInteraction.title}
                    onChange={e => setNewInteraction({ ...newInteraction, title: e.target.value })}
                  />
                  <textarea
                    placeholder="詳細內容..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 text-sm min-h-[80px]"
                    value={newInteraction.description}
                    onChange={e => setNewInteraction({ ...newInteraction, description: e.target.value })}
                  />
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowAddInteraction(false)} className="flex-1 py-2 text-slate-500 font-bold text-xs">取消</button>
                    <button onClick={saveNewInteraction} className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/30">確認新增</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6 pl-4 border-l-2 border-slate-100 ml-4">
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
              )) : <div className="text-center py-10 text-slate-300 text-sm">目前尚無互動紀錄</div>}
            </div>
          </div>
        )}
      </div>

      {/* 底部導航 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around py-2.5 px-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button onClick={() => handleNavigationWrapper(Screen.DASHBOARD)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>contacts</span>
          <span className="text-[11px] font-bold">聯絡人</span>
        </button>
        <button onClick={() => handleNavigationWrapper(Screen.CHAT)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>smart_toy</span>
          <span className="text-[11px] font-medium">助理</span>
        </button>
        <button onClick={() => handleNavigationWrapper(Screen.HISTORY)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>history</span>
          <span className="text-[11px] font-bold">History</span>
        </button>
        <button onClick={() => handleNavigationWrapper(Screen.LOGIN)} className="flex flex-col items-center gap-1 min-w-[64px] text-slate-400">
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>login</span>
          <span className="text-[11px] font-medium">登入</span>
        </button>
      </div>
    </div>
  );
};

export default ContactDetailScreen;
