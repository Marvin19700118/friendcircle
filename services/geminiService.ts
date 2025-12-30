
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

export const getNetworkingAdvice = async (chatHistory: Message[], userInput: string, allContacts: Contact[]) => {
  try {
    // 建立聯絡人資料上下文 (簡化版以節省 Token)
    const contextData = allContacts.map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      company: c.company,
      tags: c.tags,
      notes: c.notes,
      lastInteraction: c.interactions?.[0] ? `${c.interactions[0].date} (${c.interactions[0].title})` : 'None'
    }));

    const systemPrompt = `
      You are NetworkAI, a personal networking assistant.
      
      **Current Date**: ${new Date().toLocaleDateString()}
      
      **Your Knowledge Base (User's Contacts)**: 
      ${JSON.stringify(contextData)}
      
      **Strict Rules**:
      1. You must answer questions **ONLY** based on the contact data provided above. Do not invent or hallucinate contacts.
      2. If the user asks about someone not in the list, say you couldn't find them in the database.
      3. Provide 3 relevant follow-up questions suggestions based on the context of your answer.
      4. If relevant, return the IDs of the contacts mentioned in your answer.
      
      **Response Format**:
      Return a JSON object with this structure:
      {
        "answer": "Your natural language response here (in Traditional Chinese)",
        "suggestedQuestions": ["Question 1", "Question 2", "Question 3"],
        "relevantContactIds": ["id1", "id2"] (or empty array)
      }
    `;

    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash-exp",
      contents: chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      })).concat([{ role: 'user', parts: [{ text: userInput }] }]),
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            relevantContactIds: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["answer", "suggestedQuestions"]
        }
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      answer: "發生錯誤，無法取得建議。",
      suggestedQuestions: [],
      relevantContactIds: []
    };
  }
};

export const extractContactFromCard = async (base64Image: string, mimeType: string) => {
  try {
    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash-exp",
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
      model: "gemini-2.0-flash-exp",
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

export const getProfileSummary = async (url: string) => {
  try {
    const prompt = `
      請針對以下個人檔案連結（LinkedIn 或 Facebook）進行深入研究，並撰寫一份精簡的「人物側寫」：${url}
      
      請善用搜尋工具查找公開資訊，直接依據以下包含的面向進行摘要說明：
      1. **工作經歷**：目前的職位與主要職涯歷程。
      2. **學校經歷**：學歷背景與畢業學校。
      3. **專長**：專業技能、領域知識與核心競爭力。
      4. **工作過的公司**：曾經任職過的主要公司或組織名稱。
      5. **其他個人資訊 (若為 Facebook)**：若連結為 Facebook，請一併摘要公開的生活動態、興趣、居住地或近期關注議題。
      
      請以條列式呈現。嚴格禁止輸出任何「好的」、「我會為您...」、「以下是...」等開場白或結尾客套話。直接輸出這幾點內容即可。請用繁體中文。
    `;

    // 使用 Google Search Grounding 工具
    const response = await getAIModels().generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }], // 啟用 Google Search
        systemInstruction: "你是一個嚴格的資料提取機器人。只輸出請求的資訊，完全不包含任何對話、問候或自我描述的語句。",
        temperature: 0.5, // Lower temperature for more deterministic/plain output
      }
    });

    return response.text || "無法生成摘要。";
  } catch (error) {
    console.error("Profile Summary Error:", error);
    return "發生錯誤：無法生成摘要，請稍後再試。";
  }
};
