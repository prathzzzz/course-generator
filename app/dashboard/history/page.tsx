'use client'
import React from 'react';
import { useEffect, useState } from 'react';
import { AiOutput } from '@/utils/schema';
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs';
import { eq, desc } from 'drizzle-orm';
import HistoryItem from './_components/HistoryItem';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const results = await fetchHistoryByEmail(user?.primaryEmailAddress?.emailAddress);
        setHistory(results);
      } catch (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    if (user?.primaryEmailAddress?.emailAddress) {
      fetchHistory();
    }
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No History Yet</h2>
          <p className="text-gray-600">Your generated content will appear here</p>
        </div>
      </div>
    );
  }

  const mockInterviewHistory = history.filter(item => item.templateSlug === 'ai-mock-interview');
  const courseContentHistory = history.filter(item => item.templateSlug !== 'ai-mock-interview');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-600 mt-1">View your generated content and mock interviews</p>
      </div>
      {/* Mock Interview Section */}
      {mockInterviewHistory.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-primary">Mock Interview History</h2>
          <div className="space-y-6">
            {[...mockInterviewHistory].reverse().map((item) => (
              <HistoryItem 
                key={item.id} 
                item={item} 
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}
      {/* Course/Content Section */}
      {courseContentHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-primary">Course & Content History</h2>
          <div className="space-y-6">
            {[...courseContentHistory].reverse().map((item) => (
              <HistoryItem 
                key={item.id} 
                item={item} 
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
