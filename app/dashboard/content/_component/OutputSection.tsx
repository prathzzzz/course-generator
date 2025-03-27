import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PROPS {
  aiOutput: string;
}

function OutputSection({ aiOutput }: PROPS) {
  // Parse feedback sections
  const sections = {
    technicalAccuracy: '',
    communicationSkills: '',
    problemSolving: '',
    nextSteps: '',
    overallPerformance: ''
  };

  try {
    const lines = aiOutput.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      if (line.includes('Technical Accuracy:')) {
        currentSection = 'technicalAccuracy';
      } else if (line.includes('Communication Skills:')) {
        currentSection = 'communicationSkills';
      } else if (line.includes('Problem-Solving Approach:')) {
        currentSection = 'problemSolving';
      } else if (line.includes('Next Steps:')) {
        currentSection = 'nextSteps';
      } else if (line.includes('Overall Performance:')) {
        currentSection = 'overallPerformance';
      } else if (currentSection && line.trim()) {
        sections[currentSection] += line.trim() + '\n';
      }
    });
  } catch (error) {
    console.error('Error parsing feedback:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interview Feedback</h2>
          <p className="text-gray-600">Comprehensive analysis of your performance</p>
        </div>
      </div>

      <div className="grid gap-6">
        <FeedbackCard
          title="Technical Proficiency"
          content={sections.technicalAccuracy}
          icon={<CodeIcon />}
          borderColor="border-blue-500"
        />
        <FeedbackCard
          title="Communication"
          content={sections.communicationSkills}
          icon={<ChatIcon />}
          borderColor="border-green-500"
        />
        <FeedbackCard
          title="Problem-Solving"
          content={sections.problemSolving}
          icon={<BrainIcon />}
          borderColor="border-purple-500"
        />
        <FeedbackCard
          title="Areas for Improvement"
          content={sections.nextSteps}
          icon={<ChartIcon />}
          borderColor="border-orange-500"
        />
        <FeedbackCard
          title="Overall Assessment"
          content={sections.overallPerformance}
          icon={<StarIcon />}
          borderColor="border-yellow-500"
        />
      </div>
    </div>
  );
}

interface FeedbackCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  borderColor: string;
}

function FeedbackCard({ title, content, icon, borderColor }: FeedbackCardProps) {
  return (
    <Card className={cn("border-l-4", borderColor)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-gray-600">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="prose max-w-none">
          {content.split('\n').map((line, i) => (
            line.trim() && (
              <p key={i} className="text-gray-600 mb-2">
                {line.trim()}
              </p>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Icons components
const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const BrainIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default OutputSection;
