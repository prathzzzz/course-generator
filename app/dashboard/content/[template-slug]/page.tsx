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

  const GenerateAIContent = async (formData: any) => {
    setLoading(true);
    try {
      if (props.params["template-slug"] === "ai-mock-interview") {
        // Generate 5 questions for the interview
        const questions = [];
        for (let i = 0; i < 5; i++) {
          const result = await chatSession.sendMessage(
            JSON.stringify(formData) + ", " + selectedtemplate?.aiPrompt
          );
          const responseText = await result.response.text();
          questions.push(responseText);
        }
        setQuestions(questions);
        setAiOutput(questions[0]);
      } else {
        const selectedPrompt = selectedtemplate?.aiPrompt;
        const finalPrompt = JSON.stringify(formData) + ", " + selectedPrompt;

        const result = await chatSession.sendMessage(finalPrompt);
        const responseText = await result.response.text();
        console.log(responseText);
        setAiOutput(responseText);
        await SaveInDb(
          JSON.stringify(formData),
          selectedtemplate?.slug,
          responseText
        );
        // Update total usage
        setTotalUsage((prevUsage) => prevUsage + 1);
      }
    } catch (error) {
      console.error("Error generating AI content:", error);
      setAiOutput("An error occurred while generating content. Please try again.");
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

    const createdBy = user?.primaryEmailAddress?.emailAddress;
    if (!createdBy) {
      console.error("User email is undefined");
      return;
    }

    try {
      const result = await db.insert(AiOutput).values({
        formData: formData,
        templateSlug: slug,
        aiResponse: aiResp,
        createdBy: createdBy,
        createdAt: new Date().toISOString(),
      });
      console.log("Database insert result:", result);
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAiOutput(questions[currentQuestionIndex + 1]);
    }
  };

  const handleInterviewComplete = async (recordings: Blob[], answers: Array<{ question: string, answer: string }>) => {
    setRecordings(recordings);
    setLoading(true);
    
    try {
      // Generate feedback based on the interview questions and answers
      const feedbackPrompt = `
As an expert technical interviewer, provide detailed feedback for the following interview responses:

${answers.map((qa, index) => `
Question ${index + 1}: ${qa.question}
Candidate's Answer: ${qa.answer}
`).join('\n')}

Please provide comprehensive feedback in the following format:

Technical Accuracy:
- Evaluate the technical correctness
- Highlight specific technical concepts discussed
- Note any misconceptions or errors

Communication Skills:
- Assess clarity and structure
- Evaluate technical terminology usage
- Comment on explanation effectiveness

Problem-Solving Approach:
- Analyze methodology and thought process
- Evaluate solution design
- Comment on alternative approaches considered

Next Steps:
- Specific areas for improvement
- Recommended resources
- Practice suggestions

Overall Performance:
- General assessment
- Score out of 10
- Key strengths and weaknesses

Please provide specific, actionable feedback in each section.`;
      
      const result = await chatSession.sendMessage(feedbackPrompt);
      const feedbackText = await result.response.text();
      setFeedback(feedbackText);
      setAiOutput(feedbackText);
      
      // Save interview results to database
      await SaveInDb(
        JSON.stringify({
          questions: answers.map(a => a.question),
          answers: answers.map(a => a.answer)
        }),
        selectedtemplate?.slug,
        feedbackText
      );
      
    } catch (error) {
      console.error("Error generating feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <Link href="/dashboard">
        <Button>
          <ArrowLeft />
          Back
        </Button>
      </Link>
      <div className="grid grid-cols-1 gap-10 py-5">
        {!questions.length ? (
          <FormSection
            selectedTemplate={selectedtemplate}
            userFormInput={GenerateAIContent}
            loading={loading}
          />
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
