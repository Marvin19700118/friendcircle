# FriendCircle 技術棧

## 專案概述

FriendCircle（NetworkAI）是一款 AI 驅動的個人人脈管理應用程式，協助使用者記錄聯絡人資訊、互動紀錄，並透過 AI 助手提供社交建議。

---

## 前端（Frontend）

| 技術 | 版本 | 用途 |
|------|------|------|
| [React](https://react.dev/) | ^19.2.3 | UI 元件框架 |
| [TypeScript](https://www.typescriptlang.org/) | ~5.8.2 | 靜態型別語言 |
| [Vite](https://vitejs.dev/) | ^6.2.0 | 開發伺服器 / 建置工具 |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.4.4 | Utility-First CSS 框架 |
| [PostCSS](https://postcss.org/) | ^8.4.38 | CSS 後處理器 |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | ^10.4.19 | 自動補全 CSS 瀏覽器前綴 |

### 前端架構

```
/
├── App.tsx              # 根元件，管理路由與全域狀態
├── index.tsx            # 應用程式進入點
├── types.ts             # 全域型別定義（Contact、User、Screen 等）
├── components/          # 共用 UI 元件
│   ├── ErrorBoundary.tsx
│   ├── Input.tsx
│   └── Layout.tsx
├── screens/             # 頁面層級元件
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── ChatScreen.tsx
│   └── ContactDetailScreen.tsx
└── services/            # 外部服務整合層
    ├── authService.ts
    ├── dataService.ts
    ├── firebaseConfig.ts
    └── geminiService.ts
```

---

## 後端（Backend）

後端採用 **Firebase** 無伺服器架構，搭配 **Cloud Functions** 處理 AI 請求。

| 技術 | 版本 | 用途 |
|------|------|------|
| [Firebase Authentication](https://firebase.google.com/products/auth) | ^12.7.0 | 使用者身份驗證（Email/Password） |
| [Cloud Firestore](https://firebase.google.com/products/firestore) | ^12.7.0 | NoSQL 雲端資料庫，儲存聯絡人與互動紀錄 |
| [Firebase Storage](https://firebase.google.com/products/storage) | ^12.7.0 | 儲存使用者大頭照與活動照片 |
| [Firebase Hosting](https://firebase.google.com/products/hosting) | — | SPA 靜態網站託管，支援 HTML5 History 路由 |
| [Firebase Cloud Functions](https://firebase.google.com/products/functions) | ^7.0.2 | Node.js 20 無伺服器函式，作為 AI API 的安全代理層 |
| [firebase-admin](https://firebase.google.com/docs/admin/setup) | ^13.6.0 | 後端 Firebase Admin SDK |

### Cloud Functions 架構

```
functions/
├── src/
│   └── index.ts         # geminiProxy — 統一代理所有 Gemini AI 請求
├── tsconfig.json
└── package.json
```

---

## AI 整合

| 技術 | 版本 | 用途 |
|------|------|------|
| [Google Gemini AI](https://ai.google.dev/) (`@google/genai`) | ^1.34.0 | 前端 SDK（保留） |
| [Google Generative AI](https://ai.google.dev/) (`@google/generative-ai`) | ^0.21.0 | Cloud Functions 後端 SDK，實際呼叫 Gemini API |

### AI 功能列表

- **NetworkAI 聊天助手**：根據使用者人脈資料，以繁體中文提供人際網路建議
- **名片 OCR 辨識**：透過 Gemini Vision 解析名片圖片，自動填入聯絡人資訊
- **話題建議**：根據聯絡人資訊與過去互動，推薦下次見面的對話話題
- **個人檔案摘要**：解析 LinkedIn / Facebook 網址，生成人物側寫摘要

---

## 開發工具

| 工具 | 版本 | 用途 |
|------|------|------|
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | ^5.0.0 | Vite 的 React 快速刷新（HMR）外掛 |
| [@types/react](https://www.npmjs.com/package/@types/react) | ^19.2.7 | React TypeScript 型別定義 |
| [@types/react-dom](https://www.npmjs.com/package/@types/react-dom) | ^19.2.3 | React DOM TypeScript 型別定義 |
| [@types/node](https://www.npmjs.com/package/@types/node) | ^22.14.0 | Node.js TypeScript 型別定義 |
| [firebase-functions-test](https://firebase.google.com/docs/functions/unit-testing) | ^3.1.0 | Cloud Functions 單元測試工具 |
| [ESLint](https://eslint.org/) | — | Cloud Functions 程式碼規範檢查 |

---

## 部署與基礎設施

| 服務 | 說明 |
|------|------|
| **Firebase Hosting** | 前端 SPA 部署，`dist/` 目錄，所有路由重導向至 `index.html` |
| **Firebase Cloud Functions** | 部署於 `us-central1`，Node.js 20 執行環境 |
| **GitHub Pages** | 備用靜態托管（`homepage` 設定於 `package.json`） |
| **Firebase Emulator Suite** | 本地開發模擬 Auth、Firestore、Storage、Functions |

---

## 環境設定

前端透過 Vite 的 `.env` 機制注入 Firebase 設定：

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

後端 Cloud Functions 透過 Firebase 環境變數（或 Secret Manager）管理 Gemini API 金鑰。

---

## 常用指令

```bash
# 前端開發
npm run dev        # 啟動本地開發伺服器（port 3000）
npm run build      # 建置生產版本
npm run preview    # 預覽生產版本

# Cloud Functions
cd functions
npm run build      # 編譯 TypeScript
npm run deploy     # 部署至 Firebase
npm run logs       # 查看 Functions 執行日誌
```
