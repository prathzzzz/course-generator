'use server'

import { Mistral } from '@mistralai/mistralai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Logger from './logger';

export type AIProvider = 'mistral' | 'gemini';

export async function generateAIResponse(
  messages: { role: string; content: string }[],
  provider: AIProvider = 'mistral'
) {
  Logger.info(`Generating AI response using ${provider}`, { messages });

  try {
    if (provider === 'mistral') {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        throw new Error('Mistral API key is not configured');
      }

      try {
        const mistralClient = new Mistral({ apiKey });
        Logger.debug('Mistral client initialized');

        const response = await mistralClient.chat.complete({
          model: 'mistral-large-latest',
          messages: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        });

        if (!response?.choices?.[0]?.message?.content) {
          throw new Error('No response content from Mistral AI');
        }

        return response.choices[0].message.content;
      } catch (mistralError) {
        Logger.error('Mistral client error', { error: mistralError });
        throw new Error(`Mistral API error: ${mistralError.message}`);
      }
    } else {
      const geminiClient = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      const text = response.text();

      Logger.debug('Gemini API response', { text });
      
      return text;
    }
  } catch (error) {
    Logger.error(`${provider} AI Error`, { error });
    throw error;
  }
} 