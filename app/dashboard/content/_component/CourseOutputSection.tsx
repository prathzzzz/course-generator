import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface PROPS {
  aiOutput: string;
}

function CourseOutputSection({ aiOutput }: PROPS) {
  // Split the content into sections and filter out empty ones
  const sections = aiOutput.split('\n\n').filter(section => section.trim());

  const renderSection = (section: string, index: number) => {
    // Handle code blocks
    if (section.startsWith('```')) {
      const lines = section.split('\n');
      const language = lines[0].replace('```', '').trim();
      const code = lines.slice(1, -1).join('\n');
      
      return (
        <div key={index} className="my-4">
          <SyntaxHighlighter
            language={language || 'plaintext'}
            style={vscDarkPlus}
            className="rounded-lg"
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    // Handle headings
    if (section.startsWith('#')) {
      const level = section.match(/^#+/)?.[0].length || 1;
      const text = section.replace(/^#+\s*/, '');
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      
      return (
        <HeadingTag 
          key={index} 
          className={cn(
            "font-bold text-gray-900",
            level === 1 && "text-3xl mt-8 mb-4",
            level === 2 && "text-2xl mt-6 mb-3",
            level === 3 && "text-xl mt-4 mb-2"
          )}
        >
          {text}
        </HeadingTag>
      );
    }

    // Handle lists
    if (section.startsWith('- ') || section.startsWith('* ')) {
      const items = section.split('\n').filter(item => item.trim());
      return (
        <ul key={index} className="list-disc pl-6 my-4 space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-gray-700">
              {item.replace(/^[-*]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }

    // Regular text content
    return (
      <p key={index} className="text-gray-700 mb-4 leading-relaxed">
        {section}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Course Content</h2>
          <p className="text-gray-600">Detailed explanation with code examples</p>
        </div>
      </div>

      <div className="prose max-w-none">
        {sections.map((section, index) => renderSection(section, index))}
      </div>
    </div>
  );
}

export default CourseOutputSection; 