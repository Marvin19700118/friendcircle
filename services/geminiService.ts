
import { GoogleGenAI, Type } from "@google/genai";
import { Message, Contact, Interaction } from "../types";

// 嘗試從環境變數取得 API Key (Vite 使用 import.meta.env，但也相容 process.env 定義)
const apiKey = import.meta.env?.GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY || (process as any).env?.API_KEY;

// 如果沒有 API Key，我們會創建一個 Mock 的客戶端或在呼叫時拋出錯誤，避免 App 啟動時白屏
const createAIClient = () => {
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null; // 回傳 null 表示未初始化
  }
  return new GoogleGenAI({ apiKey });
}

const aiClient = createAIClient();
const getAIModels = () => {
  if (!aiClient) throw new Error("API Key must be set in .env to use AI features.");
  return aiClient.models;
}

export const getNetworkingAdvice = async (chatHistory: Message[], userInput: string) => {
  try {
    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash", // Updated to latest stable model name if applicable, or keep flash
      contents: chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })).concat([{ role: 'user', parts: [{ text: userInput }] }]),
      config: {
        systemInstruction: `You are NetworkAI, a world-class personal networking assistant. 
        Your goal is to help users build meaningful professional relationships, manage their contacts, 
        and provide strategies for networking events, follow-ups, and career growth.
        Always be professional, supportive, and provide actionable advice in Traditional Chinese (Taiwan).`,
        temperature: 0.7,
      },
    });

    return response.text || "對不起，我現在無法提供建議。請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "發生錯誤，請檢查您的網路連線或稍後再試。";
  }
};

export const extractContactFromCard = async (base64Image: string, mimeType: string) => {
  try {
    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: mimeType,
              },
            },
            {
              text: "Extract contact information from this business card. Return the name, role/title, company name, phone number, and email address.",
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            company: { type: Type.STRING },
            phone: { type: Type.STRING },
            email: { type: Type.STRING },
          },
          required: ["name", "role", "company", "phone", "email"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
};

export const getSuggestedTopics = async (contact: Partial<Contact>, interactions: Interaction[]) => {
  try {
    const prompt = `
      請根據以下聯絡人資訊與過去的互動紀錄，建議 3 個在下次見面時可以聊的話題。
      
      聯絡人資訊：
      姓名：${contact.name}
      職稱：${contact.role}
      公司：${contact.company}
      筆記：${contact.notes}
      
      過去互動紀錄：
      ${interactions.map(it => `- ${it.date} [${it.type}] ${it.title}: ${it.description}`).join('\n')}
      
      請提供具體、有溫度且能展現「我有記住上次談話內容」的話題建議。
    `;

    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "你是一位精通社交心理學的 AI 助手。請以繁體中文回答，並以 JSON 陣列格式回傳，每個元素包含 'topic' (話題內容) 與 'reason' (建議理由)。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["topic", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Suggested Topics Error:", error);
    return [];
  }
};
