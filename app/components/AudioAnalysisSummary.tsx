'use client';

import React from 'react';
import { AggregateAnalysis } from '@/app/utils/audioAnalyzer';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from './ui/progress';

interface AudioAnalysisSummaryProps {
  analysis: AggregateAnalysis;
}

const AudioAnalysisSummary: React.FC<AudioAnalysisSummaryProps> = ({ analysis }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (value: number) => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.4) return 'Fair';
    return 'Needs Improvement';
  };

  const metrics = [
    { label: 'Speaking Pace', value: analysis.averageMetrics.pace, color: 'bg-purple-500' },
    { label: 'Voice Variation', value: analysis.averageMetrics.variation, color: 'bg-pink-500' },
    { label: 'Energy Level', value: analysis.averageMetrics.energy, color: 'bg-orange-500' },
    { label: 'Voice Steadiness', value: analysis.averageMetrics.steadiness, color: 'bg-teal-500' },
    { label: 'Overall Confidence', value: analysis.overallConfidence, color: 'bg-blue-500' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interview Voice Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Speaking Time</h3>
            <p className="text-2xl">{formatTime(analysis.totalSpeakingTime)}</p>
            <p className="text-sm text-gray-500">
              Including {Math.round(analysis.silencePercentage)}% silence
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Speech Pattern</h3>
            <p className="text-2xl">{analysis.significantPauses}</p>
            <p className="text-sm text-gray-500">Significant pauses detected</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Voice Metrics</h3>
          {metrics.map(({ label, value, color }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between">
                <span>{label}</span>
                <span className="font-medium">{getPerformanceLevel(value)}</span>
              </div>
              <Progress value={value * 100} className={`h-2 ${color}`} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-500">Lowest Pitch</p>
            <p className="font-medium">{Math.round(analysis.pitchRange.min * 100)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Average Pitch</p>
            <p className="font-medium">{Math.round(analysis.pitchRange.average * 100)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Highest Pitch</p>
            <p className="font-medium">{Math.round(analysis.pitchRange.max * 100)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioAnalysisSummary; 