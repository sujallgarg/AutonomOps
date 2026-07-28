import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Read API key dynamically on every request
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '').trim();

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        text: "Please set a valid GEMINI_API_KEY in .env.local and restart your server."
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format conversation history into Gemini format
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const systemInstruction = `You are AutonomOps — an intelligent AI developer assistant and software engineering front-office agent.
Your role is to assist developers, engineering leads, tech founders, and client teams with developer consultations, technical architecture sessions, API integration planning, code audits, and sprint scheduling.
Be technical, precise, polite, concise, and focused on software engineering and developer services.`;

    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemInstruction
          }
        });
        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini model [${modelName}] failed:`, err?.message || err);
        lastError = err;
      }
    }

    if (!responseText && lastError) {
      if (
        lastError?.status === 429 ||
        lastError?.message?.includes('429') ||
        lastError?.message?.includes('Quota exceeded') ||
        lastError?.message?.includes('RESOURCE_EXHAUSTED')
      ) {
        return NextResponse.json({
          text: "Google Gemini API Quota Exceeded (Error 429: RESOURCE_EXHAUSTED). The API key in .env.local has hit Google's free tier rate limit. Please create a new API key at https://aistudio.google.com/app/apikey or wait a few minutes before trying again."
        });
      }
      throw lastError;
    }

    return NextResponse.json({
      text: responseText || "I'm sorry, I couldn't generate a response. Please try again."
    });
  } catch (error: any) {
    console.error('Gemini Chat API Error:', error);
    return NextResponse.json({
      text: `Gemini API Error: ${error?.message || 'Failed to connect to Google Gemini AI.'}`
    });
  }
}
