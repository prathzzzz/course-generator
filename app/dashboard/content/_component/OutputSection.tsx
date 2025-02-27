import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, MessageSquare, Brain, TrendingUp, AlertCircle, Award } from 'lucide-react';

interface PROPS {
  aiOutput: string;
}

function OutputSection({aiOutput}: PROPS) {
  const sections = aiOutput.split('\n\n').reduce((acc: any, section) => {
    // Remove asterisks and numbers from the start of lines
    const cleanSection = section.replace(/^\d+\.\s*\*+\s*/gm, '').replace(/\*+/g, '');

    if (cleanSection.toLowerCase().includes('technical accuracy:')) {
      acc.technical = cleanSection.replace(/technical accuracy:/i, '').trim();
    } else if (cleanSection.toLowerCase().includes('communication skills:')) {
      acc.communication = cleanSection.replace(/communication skills:/i, '').trim();
    } else if (cleanSection.toLowerCase().includes('problem-solving approach:')) {
      acc.problemSolving = cleanSection.replace(/problem-solving approach:/i, '').trim();
    } else if (cleanSection.toLowerCase().includes('next steps:')) {
      // Handle bullet points for next steps
      const steps = cleanSection.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\*\s+/, '').trim())
        .join('\n');
      acc.nextSteps = steps.replace(/next steps:/i, '').trim();
    } else if (cleanSection.toLowerCase().includes('overall performance:')) {
      acc.overall = cleanSection.replace(/overall performance:/i, '').trim();
    }
    return acc;
  }, {});

  // Ensure all sections have content
  const defaultMessage = "No feedback provided for this section.";
  sections.technical = sections.technical || defaultMessage;
  sections.communication = sections.communication || defaultMessage;
  sections.problemSolving = sections.problemSolving || defaultMessage;
  sections.nextSteps = sections.nextSteps || defaultMessage;
  sections.overall = sections.overall || defaultMessage;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl text-blue-800 flex items-center gap-3">
            <Award className="w-8 h-8" />
            Interview Feedback
          </CardTitle>
          <CardDescription className="text-base text-blue-600/80">
            Comprehensive analysis of your performance
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800">Technical Proficiency</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-blue">
              {sections.technical?.split('\n').map((point: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed">{point}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="text-green-800">Communication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-green">
              {sections.communication?.split('\n').map((point: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed">{point}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-purple-800">Problem-Solving</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-purple">
              {sections.problemSolving?.split('\n').map((point: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed">{point}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800">Areas for Improvement</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-orange">
              {sections.nextSteps?.split('\n').map((point: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed">{point}</p>
              ))}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                <span className="text-indigo-800">Overall Assessment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-indigo">
              {sections.overall?.split('\n').map((point: string, i: number) => (
                <p key={i} className="text-gray-700 leading-relaxed">{point}</p>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default OutputSection;
