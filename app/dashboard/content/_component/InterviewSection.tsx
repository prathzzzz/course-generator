'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Camera, CameraOff, SkipForward, CheckCircle, Code2, Timer } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AudioAnalyzer, ToneAnalysis, AggregateAnalysis } from '@/app/utils/audioAnalyzer';
import AudioAnalysisSummary from '@/app/components/AudioAnalysisSummary';

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface InterviewSectionProps {
  aiOutput: string;
  onNextQuestion: () => void;
  onComplete: (recordings: Blob[], answers: Array<{ question: string, answer: string }>) => void;
}

const InterviewSection: React.FC<InterviewSectionProps> = ({
  aiOutput,
  onNextQuestion,
  onComplete
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [recordings, setRecordings] = useState<Blob[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [transcribedAnswer, setTranscribedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Array<{ question: string, answer: string }>>([]);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes per question
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState<AggregateAnalysis | null>(null);

  useEffect(() => {
    setupMedia();
    setupSpeechRecognition();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  useEffect(() => {
    // Split the question text into sections
    const sections = aiOutput.split('\n\n').map(section => {
      // Remove markdown
      section = section.replace(/\*\*/g, '');
      // Handle code blocks
      if (section.startsWith('```')) {
        return 'Below is the example.';
      }
      return section;
    });

    // Join sections and clean up the text for speech
    const speechText = sections
      .filter(section => section) // Remove empty sections
      .join('. ');

    // Create and configure the announcement
    const announcement = new SpeechSynthesisUtterance();
    announcement.text = `Question ${currentQuestion} of 5. ${speechText}`;
    announcement.rate = 0.9; // Slightly slower for better clarity
    announcement.pitch = 1;
    announcement.volume = 1;
    
    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();
    
    // Speak the announcement
    window.speechSynthesis.speak(announcement);
  }, [aiOutput, currentQuestion]);

  const setupSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscribedAnswer(prev => prev + finalTranscript);
        }
      };
      recognitionRef.current = recognition;
    }
  };

  async function setupMedia() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        // Initialize audio analyzer
        audioAnalyzerRef.current = new AudioAnalyzer((analysis) => {
          setToneAnalysis(analysis);
        });
        await audioAnalyzerRef.current.start(stream);

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setRecordings(prev => [...prev, blob]);
          chunksRef.current = [];
        };
        mediaRecorderRef.current.start();
        recognitionRef.current?.start();
        setIsRecording(true);
      }
    } else {
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const toggleCamera = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  const handleNextQuestion = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    }
    
    // Save current answer
    setAnswers(prev => [...prev, { 
      question: aiOutput,
      answer: transcribedAnswer 
    }]);
    
    setCurrentQuestion(prev => prev + 1);
    setTranscribedAnswer('');
    onNextQuestion();
  };

  const handleComplete = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    }
    
    // Get final analysis if available
    if (audioAnalyzerRef.current) {
      const analysis = audioAnalyzerRef.current.getAggregateAnalysis();
      setFinalAnalysis(analysis);
      setShowAnalysis(true);
    }
    
    // Save final answer before completing
    const finalAnswers = [
      ...answers,
      { question: aiOutput, answer: transcribedAnswer }
    ];
    
    onComplete(recordings, finalAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const ToneIndicator: React.FC<{ analysis: ToneAnalysis | null }> = ({ analysis }) => {
    if (!analysis) return null;

    const metrics = [
      { label: 'Volume', value: analysis.volume, color: 'bg-blue-500' },
      { label: 'Clarity', value: analysis.clarity, color: 'bg-green-500' },
      { label: 'Confidence', value: analysis.confidence, color: 'bg-yellow-500' },
      { label: 'Pace', value: analysis.metrics.pace, color: 'bg-purple-500' },
      { label: 'Variation', value: analysis.metrics.variation, color: 'bg-pink-500' },
      { label: 'Energy', value: analysis.metrics.energy, color: 'bg-orange-500' },
      { label: 'Steadiness', value: analysis.metrics.steadiness, color: 'bg-teal-500' },
    ];

    return (
      <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-4 text-white text-sm">
        <div className="flex flex-col gap-2">
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-20">{label}:</span>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-full transition-all duration-200`}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs">
                {Math.round(value * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {showAnalysis && finalAnalysis && (
        <AudioAnalysisSummary analysis={finalAnalysis} />
      )}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">
                Question {currentQuestion} of 5
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Time Remaining: {formatTime(timeLeft)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                isRecording ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
              )}>
                {isRecording ? "Recording" : "Ready"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Interview Question</h3>
              <div className="prose max-w-none space-y-4">
                {aiOutput.split('\n\n').map((section, i) => {
                  if (section.startsWith('**')) {
                    return (
                      <h4 key={i} className="text-md font-semibold text-gray-800 mt-6 mb-2">
                        {section.replace(/\*\*/g, '')}
                      </h4>
                    );
                  } else if (section.startsWith('```')) {
                    const code = section.replace(/```(json|html)\n/, '').replace(/```$/, '');
                    return (
                      <pre key={i} className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                        <code>{code}</code>
                      </pre>
                    );
                  }
                  return (
                    <p key={i} className="text-gray-700">
                      {section}
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Video Preview</h3>
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full text-white text-sm">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Recording
                    </div>
                  )}
                  {toneAnalysis && <ToneIndicator analysis={toneAnalysis} />}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your Answer</h3>
                <textarea
                  value={transcribedAnswer}
                  onChange={(e) => setTranscribedAnswer(e.target.value)}
                  className="w-full h-[calc(100%-2rem)] p-4 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start recording to see your answer transcribed here..."
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t">
          <div className="flex justify-between w-full">
            <div className="flex gap-4">
              <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>

              <Button
                onClick={toggleCamera}
                variant={isCameraOn ? "default" : "secondary"}
                className="flex items-center gap-2"
              >
                {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                {isCameraOn ? 'Camera On' : 'Camera Off'}
              </Button>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleNextQuestion}
                className="flex items-center gap-2"
                disabled={!transcribedAnswer.trim() || isRecording}
              >
                <SkipForward className="w-4 h-4" />
                Next Question
              </Button>

              <Button
                onClick={handleComplete}
                variant="secondary"
                className="flex items-center gap-2"
                disabled={!transcribedAnswer.trim() || isRecording}
              >
                <CheckCircle className="w-4 h-4" />
                Complete Interview
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InterviewSection;