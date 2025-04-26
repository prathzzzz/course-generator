"use client";
import React, { useContext, useState } from "react";
import FormSection from "../_component/FormSection";
import OutputSection from "../_component/OutputSection";
import { TEMPLATE } from "../../_components/TemplateListSection";
import Templates from "@/app/(data)/Templates";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { chatSession } from "@/utils/AiModel";
import { db } from "@/utils/db";
import { AiOutput } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import { TotalUsageContext } from "@/app/(context)/TotalUsageContext";
import InterviewSection from "../_component/InterviewSection";
import { generateAIResponse, AIProvider } from '@/app/actions/ai.actions';
import Logger from '@/utils/logger';
import CourseOutputSection from "../_component/CourseOutputSection";

interface PROPS {
  params: {
    "template-slug": string;
  };
}

function CreateNewContent(props: PROPS) {
  const selectedtemplate: TEMPLATE | undefined = Templates?.find(
    (item) => item.slug == props.params["template-slug"]
  );
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>("");
  const { user } = useUser();
  const { totalUsage, setTotalUsage } = useContext(TotalUsageContext);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<AIProvider>('mistral');
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const GenerateAIContent = async (formData: any) => {
    setLoading(true);
    setInitialFormData(formData);
    
    Logger.info('Starting content generation', { 
      template: props.params["template-slug"],
      provider: aiProvider,
      formData,
      userId: user?.id,
      userEmail: user?.emailAddresses?.[0]?.emailAddress
    });

    try {
      if (props.params["template-slug"] === "ai-mock-interview") {
        const prompt = JSON.stringify({
          role: formData.role,
          topic: formData.topic,
          experience: formData.experience,
          action: 'Generate technical interview questions'
        });
        
        Logger.debug('Sending interview prompt', { prompt });
        
        const response = await generateAIResponse([{
          role: 'user',
          content: prompt
        }], aiProvider);

        if (!response || !Array.isArray(response) || response.length === 0) {
          throw new Error('No valid questions received from AI service');
        }

        setQuestions(response);
        setAiOutput(response[0]);
        setCurrentQuestionIndex(0);
      } else {
        const prompt = `${selectedtemplate?.aiPrompt} ${JSON.stringify(formData)}`;
        Logger.debug('Sending content generation prompt', { prompt });
        
        const response = await generateAIResponse([{
          role: 'user',
          content: prompt
        }], aiProvider);

        if (response) {
          Logger.debug('Received AI response', { 
            responseLength: response.length,
            preview: response.substring(0, 100) + '...'
          });
          
          setAiOutput(response);
          await SaveInDb(JSON.stringify(formData), props.params["template-slug"], response);
        }
      }
    } catch (error: any) {
      Logger.error('Content generation error', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        template: props.params["template-slug"],
        provider: aiProvider,
        formData
      });
      setAiOutput(`An error occurred: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const SaveInDb = async (
    formData: string,
    slug: string | undefined,
    aiResp: string
  ) => {
    if (!slug) {
      console.error("Template slug is undefined");
      return;
    }

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      console.error("User email not found");
      return;
    }

    try {
      // Ensure we're saving strings
      const processedAiResp = typeof aiResp === 'string' ? aiResp : JSON.stringify(aiResp);
      const processedFormData = typeof formData === 'string' ? formData : JSON.stringify(formData);

      console.log('Saving to DB:', {
        formData: processedFormData,
        templateSlug: slug,
        aiResponse: processedAiResp,
        createdBy: user.emailAddresses[0].emailAddress
      });

      await db.insert(AiOutput).values({
        formData: processedFormData,
        templateSlug: slug,
        aiResponse: processedAiResp,
        createdBy: user.emailAddresses[0].emailAddress
      });
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        const nextIndex = prev + 1;
        setAiOutput(questions[nextIndex]);
        return nextIndex;
      });
    }
  };

  const handleInterviewComplete = async (recordings: Blob[], answers: Array<{ question: string, answer: string }>) => {
    setRecordings(recordings);
    setLoading(true);
    
    try {
      const feedbackPrompt = `
        As an expert technical interviewer, provide detailed feedback for the following interview responses:
        ${answers.map((qa, index) => `
        Question ${index + 1}: ${qa.question}
        Candidate's Answer: ${qa.answer}
        `).join('\n')}
        
        Please provide comprehensive feedback in the following format:
        Technical Accuracy:
        Communication Skills:
        Problem-Solving Approach:
        Next Steps:
        Overall Performance:`;

      const feedback = await generateAIResponse([{
        role: 'user',
        content: feedbackPrompt
      }], aiProvider);
      
      setFeedback(feedback);
      setAiOutput(feedback);
      
      await SaveInDb(
        JSON.stringify({
          questions: answers.map(a => a.question),
          answers: answers.map(a => a.answer)
        }),
        selectedtemplate?.slug,
        feedback
      );
      
    } catch (error) {
      console.error("Error generating feedback:", error);
      setAiOutput("An error occurred while generating feedback.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <Link href="/dashboard">
          <Button>
            <ArrowLeft />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">AI Provider:</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AIProvider)}
            className="border rounded px-3 py-1"
          >
            <option value="mistral">Mistral AI</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-10 py-5">
        {!questions.length ? (
          <>
            <FormSection
              selectedTemplate={selectedtemplate}
              userFormInput={GenerateAIContent}
              loading={loading}
            />
            {aiOutput && (
              <div className="col-span-2">
                {props.params["template-slug"] === "ai-mock-interview" ? (
                  <OutputSection aiOutput={aiOutput} />
                ) : (
                  <CourseOutputSection aiOutput={aiOutput} />
                )}
              </div>
            )}
          </>
        ) : feedback ? (
          <div className="col-span-2">
            <OutputSection aiOutput={aiOutput} />
          </div>
        ) : (
          <InterviewSection
            aiOutput={aiOutput}
            onNextQuestion={handleNextQuestion}
            onComplete={handleInterviewComplete}
          />
        )}
      </div>
    </div>
  );
}

export default CreateNewContent;
