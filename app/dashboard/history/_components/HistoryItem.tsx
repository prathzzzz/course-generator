import React from 'react';
import { Copy, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HistoryItemProps {
  item: {
    id: number;
    formData: string;
    aiResponse: string;
    templateSlug: string;
    createdBy: string;
    createdAt: string;
  };
  onCopy: (text: string) => void;
}

function HistoryItem({ item, onCopy }: HistoryItemProps) {
  const formData = JSON.parse(item.formData);
  const isMockInterview = item.templateSlug === 'ai-mock-interview';
  const isCourseContent = item.templateSlug === 'generate-dsa-course';
  const pdfRef = React.useRef<HTMLDivElement>(null);

  // Helper for inline code style
  const InlineCode = (props: any) => (
    <code
      className="px-1 py-0.5 rounded bg-gray-100 text-sm font-mono text-gray-800 border border-gray-200"
      {...props}
    />
  );

  // Helper for code blocks
  const CodeBlock = ({children, className, ...props}: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return (
      <SyntaxHighlighter
        style={vscDarkPlus as any}
        language={match ? match[1] : ''}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  };

  // Helper to highlight negative phrases in a string (for use in markdown text nodes)
  const highlightNegativePhrases = (text: string) => {
    const negativePatterns = [
      /needs improvement/i,
      /extremely poor/i,
      /incorrect/i,
      /should/i,
      /could be better/i,
      /missing/i,
      /lacking/i,
      /not correct/i,
      /not accurate/i,
      /mistake/i,
      /error/i,
      /wrong/i,
      /improve/i,
      /try again/i,
      /unsatisfactory/i
    ];
    // Highlight each negative phrase in the text
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    const lower = text.toLowerCase();
    let matchFound = false;
    for (let i = 0; i < negativePatterns.length; i++) {
      let match;
      while ((match = negativePatterns[i].exec(text)) !== null) {
        matchFound = true;
        const start = match.index;
        const end = start + match[0].length;
        if (start > lastIndex) {
          result.push(text.slice(lastIndex, start));
        }
        result.push(
          <span key={start} className="text-red-600 font-semibold">{text.slice(start, end)}</span>
        );
        lastIndex = end;
      }
    }
    if (!matchFound) return text;
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }
    return result;
  };

  // Preprocess feedback to add newlines before/after section headers for markdown
  const preprocessFeedbackMarkdown = (text: string) => {
    // Add a newline before and after each section header like ** Section:**
    return text.replace(/(\*\*\s*[^*]+:\*\*)/g, '\n$1\n');
  };

  // Helper to highlight negative sentences in a paragraph
  const highlightNegativeSentences = (text: string) => {
    const negativePatterns = [
      /needs improvement/i,
      /extremely poor/i,
      /incorrect/i,
      /should/i,
      /could be better/i,
      /missing/i,
      /lacking/i,
      /not correct/i,
      /not accurate/i,
      /mistake/i,
      /error/i,
      /wrong/i,
      /improve/i,
      /try again/i,
      /unsatisfactory/i
    ];
    // Split into sentences (simple split on period, exclamation, question mark)
    const sentences = text.split(/([.!?]\s+)/g);
    return sentences.map((sentence, idx) => {
      const isNegative = negativePatterns.some(pattern => pattern.test(sentence));
      return isNegative ? (
        <span key={idx} className="text-red-600 font-semibold">{sentence}</span>
      ) : (
        <span key={idx}>{sentence}</span>
      );
    });
  };

  // Helper to highlight negative feedback sections and collect them for TTS
  const getHighlightedFeedback = (text: string) => {
    const negativePatterns = [
      /needs improvement/i,
      /extremely poor/i,
      /incorrect/i,
      /should/i,
      /could be better/i,
      /missing/i,
      /lacking/i,
      /not correct/i,
      /not accurate/i,
      /mistake/i,
      /error/i,
      /wrong/i,
      /improve/i,
      /try again/i,
      /unsatisfactory/i
    ];
    // Split by double newlines (markdown paragraphs/sections)
    const sections = text.split(/\n\s*\n/);
    const highlighted: React.ReactNode[] = [];
    const negativeLines: string[] = [];
    sections.forEach((section, idx) => {
      const isNegative = negativePatterns.some(pattern => pattern.test(section));
      if (isNegative) {
        highlighted.push(
          <div key={idx} className="text-red-600 font-semibold">
            <ReactMarkdown
              components={{
                strong: ({children}) => <strong className="text-red-700">{children}</strong>,
                code: (props) => <code className="px-1 py-0.5 rounded bg-red-100 text-sm font-mono text-red-700 border border-red-200" {...props} />
              }}
            >{section}</ReactMarkdown>
          </div>
        );
        negativeLines.push(section);
      } else {
        highlighted.push(
          <div key={idx}>
            <ReactMarkdown
              components={{
                code: (props) => <code className="px-1 py-0.5 rounded bg-gray-100 text-sm font-mono text-gray-800 border border-gray-200" {...props} />
              }}
            >{section}</ReactMarkdown>
          </div>
        );
      }
    });
    return { highlighted, negativeLines };
  };

  // Speaker feature: read negative feedback aloud
  const speakNegativeFeedback = (negativeLines: string[]) => {
    if (!negativeLines.length) return;
    const utterance = new window.SpeechSynthesisUtterance(negativeLines.join(' '));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // PDF download handler (using jsPDF html method for pagination)
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    pdfRef.current.style.display = 'block';
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for render
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    await pdf.html(pdfRef.current, {
      margin: [32, 32, 32, 32],
      autoPaging: 'text',
      html2canvas: { scale: 1 },
      callback: (doc) => {
        doc.save(`mock-interview-report-${item.id}.pdf`);
        pdfRef.current!.style.display = 'none';
      }
    });
  };

  const renderContent = () => {
    if (isMockInterview) {
      const feedback = item.aiResponse && typeof item.aiResponse === 'string' ? item.aiResponse : '';
      // Speaker: collect all negative sentences
      const negativePatterns = [
        /needs improvement/i,
        /extremely poor/i,
        /incorrect/i,
        /should/i,
        /could be better/i,
        /missing/i,
        /lacking/i,
        /not correct/i,
        /not accurate/i,
        /mistake/i,
        /error/i,
        /wrong/i,
        /improve/i,
        /try again/i,
        /unsatisfactory/i
      ];
      const negativeSentences = feedback.split(/([.!?]\s+)/g).filter(sentence => negativePatterns.some(pattern => pattern.test(sentence)));
      return (
        <div className="prose max-w-none">
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Interview Questions</h3>
              <Button variant="outline" onClick={handleDownloadPDF} title="Download PDF Report">
                Download PDF
              </Button>
            </div>
            {formData.questions?.map((q: string, i: number) => (
              <div key={i} className="mb-6">
                <h4 className="font-medium text-gray-900">Question {i + 1}</h4>
                <div className="mt-2 text-gray-700">
                  <ReactMarkdown
                    children={q}
                    components={{
                      code(props) {
                        const {className, children, ...rest} = props;
                        const isInline = (props as any).inline;
                        return isInline
                          ? <InlineCode {...rest}>{children}</InlineCode>
                          : <CodeBlock className={className}>{children}</CodeBlock>;
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            {feedback && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-800">AI Feedback:</h4>
                  {negativeSentences.length > 0 && (
                    <button
                      title="Listen to highlighted feedback"
                      className="p-1 rounded hover:bg-gray-200 transition"
                      onClick={() => speakNegativeFeedback(negativeSentences)}
                    >
                      <Volume2 className="w-5 h-5 text-primary" />
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded space-y-1">
                  <ReactMarkdown
                    children={preprocessFeedbackMarkdown(feedback)}
                    components={{
                      code: (props) => <code className="px-1 py-0.5 rounded bg-gray-100 text-sm font-mono text-gray-800 border border-gray-200" {...props} />,
                      strong: ({children}) => <strong>{children}</strong>,
                      p: ({children}) => {
                        let text = '';
                        if (Array.isArray(children)) {
                          text = children.join('');
                        } else if (typeof children === 'string') {
                          text = children;
                        }
                        return <p>{highlightNegativeSentences(text)}</p>;
                      },
                      li: ({children}) => {
                        let text = '';
                        if (Array.isArray(children)) {
                          text = children.join('');
                        } else if (typeof children === 'string') {
                          text = children;
                        }
                        return <li>{highlightNegativeSentences(text)}</li>;
                      }
                    }}
                  />
                </div>
              </div>
            )}
            {/* Hidden PDF export version */}
            <div
              ref={pdfRef}
              style={{
                display: 'none',
                background: 'white',
                color: '#222',
                padding: '24pt',
                width: '100%',
                fontFamily: 'Segoe UI, Arial, sans-serif',
                fontSize: '9pt',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                lineHeight: 1.5
              }}
            >
              <h1 style={{ fontSize: '12pt', fontWeight: 700, margin: '0 0 12pt 0' }}>Mock Interview Report</h1>
              <div style={{ fontSize: '8pt', marginBottom: '6pt', color: '#666' }}>Date: {new Date(item.createdAt).toLocaleString()}</div>
              <hr style={{ margin: '8pt 0 12pt', border: 0, borderTop: '1px solid #eee' }} />
              <h2 style={{ fontSize: '10pt', fontWeight: 600, margin: '8pt 0 6pt', color: '#2d3a4a' }}>Questions & Answers</h2>
              {formData.questions?.map((q: string, i: number) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2, color: '#1a202c' }}>Q{i + 1}: <span style={{ fontWeight: 400 }}>{q}</span></div>
                  {formData.answers && formData.answers[i] && (
                    <div
                      style={{
                        marginLeft: 12,
                        marginTop: 4,
                        background: '#f3f6fa',
                        borderLeft: '4px solid #4f8cff',
                        padding: '8px 12px',
                        borderRadius: 6,
                        color: '#222',
                        fontWeight: 500,
                        fontSize: 13,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                      }}
                    >
                      Your Answer: {formData.answers[i]}
                    </div>
                  )}
                </div>
              ))}
              <h2 style={{ fontSize: '10pt', fontWeight: 600, margin: '18pt 0 6pt', color: '#2d3a4a' }}>AI Feedback</h2>
              <div>
                {(() => {
                  // Preprocess feedback for markdown
                  const feedback = preprocessFeedbackMarkdown(item.aiResponse);
                  // Split into paragraphs for highlighting
                  return feedback.split(/\n\n+/).map((para, idx) => {
                    // Highlight negative sentences
                    const html = highlightNegativeSentences(para).map((node, i) => {
                      if (typeof node === 'string') return node;
                      // For red spans, use inline style for PDF
                      return React.cloneElement(node as any, { style: { color: 'red', fontWeight: 600 }, key: i });
                    });
                    return <div key={idx} style={{ marginBottom: 8, fontSize: 13 }}>{html}</div>;
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isCourseContent) {
      return (
        <div className="prose max-w-none">
          <ReactMarkdown
            children={item.aiResponse}
            components={{
              code(props) {
                const {className, children, ...rest} = props;
                const isInline = (props as any).inline;
                return isInline
                  ? <InlineCode {...rest}>{children}</InlineCode>
                  : <CodeBlock className={className}>{children}</CodeBlock>;
              }
            }}
          />
        </div>
      );
    }

    // Default rendering for other content types
    return (
      <div className="prose max-w-none">
        <div className="bg-white rounded-lg p-4">
          <pre className="whitespace-pre-wrap">{item.aiResponse}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="border p-4 rounded-lg shadow bg-white">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <h3 className="text-lg font-semibold mt-1">
              {isMockInterview ? 'Mock Interview' : 
               isCourseContent ? 'DSA Course Content' : 
               'Generated Content'}
            </h3>
          </div>
          <Button 
            className="flex gap-2" 
            onClick={() => onCopy(item.aiResponse)}
          >
            <Copy className="w-4 h-4" /> Copy Content
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

export default HistoryItem; 