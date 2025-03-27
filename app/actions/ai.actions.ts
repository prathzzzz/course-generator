'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import Logger from '@/utils/logger';
// Temporary test import
import * as MistralSDK from '@mistralai/mistralai';
console.log('🔍 Direct import test:', {
  moduleType: typeof MistralSDK,
  keys: Object.keys(MistralSDK),
  default: MistralSDK.default,
  namedExports: {
    hasMistralClient: 'MistralClient' in MistralSDK,
    hasMistralAI: 'MistralAI' in MistralSDK
  }
});

export type AIProvider = 'mistral' | 'gemini';

async function getMistralClient(apiKey: string) {
  try {
    Logger.debug('🔍 Initializing Mistral client');
    return new Mistral({ apiKey });
  } catch (error: any) {
    Logger.error('❌ Failed to initialize Mistral client:', error);
    throw new Error(`Failed to initialize Mistral client: ${error.message}`);
  }
}

export async function generateAIResponse(
  messages: { role: string; content: string }[],
  provider: AIProvider = 'mistral'
) {
  Logger.info('🚀 Starting AI response generation', { provider, messageCount: messages.length });

  try {
    if (provider === 'mistral') {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) {
        throw new Error('Mistral API key is not configured');
      }

      const mistralClient = await getMistralClient(apiKey);
      Logger.debug('📤 Sending request to Mistral API');

      const currentMessage = messages[messages.length - 1];
      let messageContent;
      try {
        messageContent = JSON.parse(currentMessage.content);
      } catch (e) {
        messageContent = currentMessage.content;
      }
      
      let enhancedPrompt = currentMessage.content;
      if (messageContent.action === 'Generate technical interview questions') {
        enhancedPrompt = `You are an expert technical interviewer conducting an interview for a ${messageContent.role} position with ${messageContent.experience} years of experience, focusing on ${messageContent.topic}.

Generate 5 distinct technical interview questions. Format each question exactly as follows:

QUESTION {N}:
Context: [1-2 sentences setting up the real-world scenario]
Problem Statement: [Specific technical challenge or task]
Example/Expected Output: [Concrete example or expected result]
Key Requirements:
- [First key technical requirement or constraint]
- [Second key technical requirement or constraint]
Follow-up Question: [One deeper question to probe understanding]

Requirements for all questions:
- Questions should match ${messageContent.role} level
- Focus specifically on ${messageContent.topic}
- Complexity should be appropriate for ${messageContent.experience} years of experience
- Include both theoretical knowledge and practical application
- Keep each question concise but thorough
- Ensure questions are progressively more challenging
- Make sure questions cover different aspects of ${messageContent.topic}

Start directly with "QUESTION 1:" and separate each question with a blank line.`;
      }

      const response = await mistralClient.chat.complete({
        model: 'mistral-large-latest',
        messages: [
          ...messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      });

      if (!response?.choices?.[0]?.message?.content) {
        throw new Error('No response content from Mistral AI');
      }

      const content = response.choices[0].message.content;
      
      // Format the questions response
      if (messageContent.action === 'Generate technical interview questions') {
        const questions = content
          .split(/QUESTION \d+:/g)
          .filter(Boolean)
          .map(q => q.trim())
          .map(q => {
            const sections = q
              .split(/\n(?=Context:|Problem Statement:|Example\/Expected Output:|Key Requirements:|Follow-up Question:)/)
              .map(s => s.trim())
              .filter(Boolean)
              .join('\n\n');
            return sections;
          });

        return questions;
      }

      return content;
    } else {
      console.log('🔍 Using Gemini provider');
      const geminiClient = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      console.log('✅ Gemini client initialized');

      const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('📝 Preparing Gemini content generation');
      
      const currentMessage = messages[messages.length - 1];
      let messageContent;
      try {
        messageContent = JSON.parse(currentMessage.content);
      } catch (e) {
        messageContent = currentMessage.content;
      }

      // Use the same enhanced prompt for both providers
      let enhancedPrompt = currentMessage.content;
      
      // Check if this is a feedback request
      if (currentMessage.content.includes('provide detailed feedback for the following interview responses')) {
        enhancedPrompt = `${currentMessage.content}

Please ensure to format your response exactly with these section headers:
Technical Accuracy:
Communication Skills:
Problem-Solving Approach:
Next Steps:
Overall Performance:

Provide detailed feedback under each section.`;
      } else if (messageContent.action === 'Generate technical interview questions') {
        enhancedPrompt = `You are an expert technical interviewer conducting an interview for a ${messageContent.role} position with ${messageContent.experience} years of experience, focusing on ${messageContent.topic}.

Generate 5 distinct technical interview questions. Format each question exactly as follows:

QUESTION {N}:
Context: [1-2 sentences setting up the real-world scenario]
Problem Statement: [Specific technical challenge or task]
Example/Expected Output: [Concrete example or expected result]
Key Requirements:
- [First key technical requirement or constraint]
- [Second key technical requirement or constraint]
Follow-up Question: [One deeper question to probe understanding]

Requirements for all questions:
- Questions should match ${messageContent.role} level
- Focus specifically on ${messageContent.topic}
- Complexity should be appropriate for ${messageContent.experience} years of experience
- Include both theoretical knowledge and practical application
- Keep each question concise but thorough
- Ensure questions are progressively more challenging
- Make sure questions cover different aspects of ${messageContent.topic}

Start directly with "QUESTION 1:" and separate each question with a blank line.`;
      }
      
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const text = response.text();

      Logger.debug('✅ Gemini response received', {
        length: text.length,
        preview: text.substring(0, 100)
      });

      // Format feedback response
      if (currentMessage.content.includes('provide detailed feedback for the following interview responses')) {
        // Ensure the response has all required sections
        const sections = [
          'Technical Accuracy:',
          'Communication Skills:',
          'Problem-Solving Approach:',
          'Next Steps:',
          'Overall Performance:'
        ];
        
        let formattedText = text;
        
        // Add any missing sections
        sections.forEach(section => {
          if (!formattedText.includes(section)) {
            formattedText += `\n\n${section}\nNo specific feedback provided for this section.`;
          }
        });

        // Ensure sections are properly separated
        formattedText = formattedText
          .replace(/([A-Za-z\s]+):/g, '\n$1:')  // Add newline before each section
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .join('\n');

        return formattedText;
      }

      // Handle interview questions response
      if (messageContent.action === 'Generate technical interview questions') {
        const questions = text
          .split(/QUESTION \d+:/g)
          .filter(Boolean)
          .map(q => q.trim())
          .map(q => {
            const sections = q
              .split(/\n(?=Context:|Problem Statement:|Example\/Expected Output:|Key Requirements:|Follow-up Question:)/)
              .map(s => s.trim())
              .filter(Boolean)
              .join('\n\n');
            return sections;
          });

        return questions;
      }

      return text;
    }
  } catch (error: any) {
    Logger.error('❌ AI generation error:', {
      provider,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
} 