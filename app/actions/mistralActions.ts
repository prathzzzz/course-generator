'use server'

import { Mistral } from '@mistralai/mistralai';
import Logger from '@/utils/logger';

// Initialize Mistral client with API key from environment variable
const getMistralClient = () => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('Mistral API key is not configured');
  }
  return new Mistral({ apiKey });
};

export async function generateMistralResponse(messages: any[]) {
  try {
    const client = getMistralClient();
    Logger.debug('📤 Sending request to Mistral API');

    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 2048
    });

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('No response content from Mistral AI');
    }

    Logger.debug('✅ Received Mistral response', {
      contentLength: response.choices[0].message.content.length
    });

    return response.choices[0].message.content;
  } catch (error) {
    Logger.error('❌ Mistral AI Error:', error);
    throw new Error('Failed to generate response from Mistral AI');
  }
} 