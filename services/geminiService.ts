import { Message, Contact, Interaction } from "../types";

const FUNCTION_URL = "https://us-central1-aifriendcircle-63093.cloudfunctions.net/geminiProxy";

const callGeminiProxy = async (action: string, payload: any) => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const getNetworkingAdvice = async (chatHistory: Message[], userInput: string, allContacts: Contact[]) => {
  try {
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

    const result = await callGeminiProxy("getNetworkingAdvice", {
      chatHistory,
      userInput,
      systemPrompt
    });

    return result;
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
    const result = await callGeminiProxy("extractContactFromCard", {
      base64Data: base64Image.split(',')[1],
      mimeType: mimeType,
      prompt: "Extract contact information from this business card. Return a JSON object with: name, role/title, company name, phone number, and email address."
    });

    return result;
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

    const result = await callGeminiProxy("getSuggestedTopics", {
      prompt,
      systemInstruction: "你是一位精通社交心理學的 AI 助手。請以繁體中文回答，並以 JSON 陣列格式回傳，每個元素包含 'topic' (話題內容) 與 'reason' (建議理由)。"
    });

    return result;
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

    const result = await callGeminiProxy("getProfileSummary", {
      prompt,
      systemInstruction: "你是一個嚴格的資料提取機器人。只輸出請求的資訊，完全不包含任何對話、問候或自我描述的語句。"
    });

    return result || "無法生成摘要。";
  } catch (error) {
    console.error("Profile Summary Error:", error);
    return "發生錯誤：無法生成摘要，請稍後再試。";
  }
};
