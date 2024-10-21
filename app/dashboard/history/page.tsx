'use client'
import { useEffect, useState } from 'react';
import { AiOutput } from '@/utils/schema';
import { db } from '@/utils/db';
import { useUser } from '@clerk/nextjs';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { eq, desc } from 'drizzle-orm';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

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
    aiResponse: item.aiResponse ?? '', // Convert null to empty string 
    formData: JSON.parse(item.formData || '{}'),
  }));
};

const HistoryPage = () => {
  const { user } = useUser();
  const [history, setHistory] = useState<HISTORY[]>([]);
  const fetchData = async (user: any) => {
    const data = await fetchHistoryByEmail(user.primaryEmailAddress.emailAddress);
    setHistory(data);
  };

  useEffect(() => {
    user && fetchData(user);
  }, [user]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">History</h1>
      {history.map((item) => (
        <div key={item.id} className="mb-8 p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">{item.templateSlug}</h2>
          <p className="text-sm text-gray-500 mb-4">Created on: {new Date(item.createdAt).toLocaleString()}</p>
          
          <h3 className="font-medium mb-2">User Input:</h3>
          <div className="bg-gray-100 p-3 rounded mb-4">
            {Object.entries(item.formData).map(([key, value]) => (
              <p key={key}><strong>{key}:</strong> {value as string}</p>
            ))}
          </div>

          <h3 className="font-medium mb-2">AI Response:</h3>
          <div className="bg-white border rounded">
            <Editor
              initialValue={item.aiResponse}
              height="1000px"
              initialEditType="markdown"
              useCommandShortcut={true}
              viewer={true}
            />
          </div>

          <Button className='flex gap-2 mt-4' onClick={() => handleCopy(item.aiResponse)}>
            <Copy className='w-4 h-4' /> Copy Response
          </Button>
        </div>
      ))}
    </div>
  );
};

export default HistoryPage;
