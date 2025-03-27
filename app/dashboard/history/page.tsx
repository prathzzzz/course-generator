'use client'
import React from 'react';
import { useEffect, useState } from 'react';
import { AiOutput } from '@/utils/schema';
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eq, desc } from 'drizzle-orm';
import dynamic from 'next/dynamic';

// Fix the dynamic import
const Viewer = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => mod.Viewer),
  { 
    ssr: false,
    loading: () => <div>Loading editor...</div>
  }
);

export interface HISTORY {
  id: number;
  formData: string;
  aiResponse: string;
  templateSlug: string;
  createdBy: string;
  createdAt: string;
}

const fetchHistoryByEmail = async (email: any) => {
  const data = await db.select().from(AiOutput).where(eq(AiOutput.createdBy, email)).orderBy(desc(AiOutput.createdAt)).execute();
  return data.map((item: any) => ({
    ...item,
    aiResponse: typeof item.aiResponse === 'string' 
      ? item.aiResponse 
      : JSON.stringify(item.aiResponse),
    formData: typeof item.formData === 'string'
      ? item.formData
      : JSON.stringify(item.formData)
  }));
};

const HistoryPage = () => {
  const { user } = useUser();
  const [history, setHistory] = useState<HISTORY[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const results = await fetchHistoryByEmail(user.primaryEmailAddress.emailAddress);
        setHistory(results);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    user && fetchHistory();
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">History</h1>
      <div className="space-y-4">
        {history.map((item) => {
          const aiResponse = typeof item.aiResponse === 'string' 
            ? item.aiResponse 
            : JSON.stringify(item.aiResponse);
            
          return (
            <div key={item.id} className="border p-4 rounded-lg shadow">
              <div className="mb-2">
                <strong>Date:</strong>{' '}
                {new Date(item.createdAt).toLocaleDateString()}
              </div>
              <div className="mb-2">
                <strong>Template:</strong> {item.templateSlug}
              </div>
              <div className="prose max-w-none">
                <strong>Response:</strong>
                <div className="mt-2 bg-white rounded-lg">
                  <Viewer 
                    initialValue={aiResponse}
                    height="400px"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button 
                  className='flex gap-2' 
                  onClick={() => handleCopy(aiResponse)}
                >
                  <Copy className='w-4 h-4' /> Copy Response
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedResponse(selectedResponse === aiResponse ? null : aiResponse)}
                >
                  {selectedResponse === aiResponse ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
              {selectedResponse === aiResponse && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Form Data:</h3>
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {JSON.parse(item.formData).questions?.map((q: string, i: number) => (
                      <div key={i} className="mb-2">
                        <strong>Question {i + 1}:</strong> {q}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPage;
