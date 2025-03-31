interface ToneMetrics {
  pace: number;        // Speaking pace (0-1)
  variation: number;   // Tonal variation (0-1)
  energy: number;      // Energy level (0-1)
  steadiness: number;  // Voice steadiness (0-1)
}

export interface ToneAnalysis {
  volume: number;      // Overall volume (0-1)
  pitch: number;       // Pitch presence (0-1)
  clarity: number;     // Clarity (0-1)
  confidence: number;  // Confidence (0-1)
  metrics: ToneMetrics;
  timestamp: number;
}

export interface AggregateAnalysis {
  averageMetrics: ToneMetrics;
  overallConfidence: number;
  totalSpeakingTime: number;
  silencePercentage: number;
  volumeVariation: number;
  pitchRange: {
    min: number;
    max: number;
    average: number;
  };
  significantPauses: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private onToneUpdate: (data: ToneAnalysis) => void;
  private previousAnalyses: ToneAnalysis[] = [];
  private analysisStartTime: number = 0;
  private totalSilenceTime: number = 0;
  private lastSoundTimestamp: number = 0;
  private silenceThreshold = 0.1;
  private significantPauses: number = 0;

  constructor(onToneUpdate: (data: ToneAnalysis) => void) {
    this.onToneUpdate = onToneUpdate;
  }

  async start(stream: MediaStream) {
    this.audioContext = new AudioContext();
    this.analyzer = this.audioContext.createAnalyser();
    this.analyzer.fftSize = 2048;
    
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyzer);
    
    this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    this.analysisStartTime = Date.now();
    this.analyze();
  }

  private analyze() {
    if (!this.analyzer || !this.dataArray) return;

    this.analyzer.getByteFrequencyData(this.dataArray);
    const analysis = this.calculateAnalysis(this.dataArray);
    
    this.previousAnalyses.push(analysis);
    if (this.previousAnalyses.length > 30) {
      this.previousAnalyses.shift();
    }

    this.onToneUpdate(analysis);
    requestAnimationFrame(() => this.analyze());
  }

  private calculateAnalysis(data: Uint8Array): ToneAnalysis {
    const volume = this.calculateVolume(data);
    const pitch = this.calculatePitch(data);
    const clarity = this.calculateClarity(data);
    const metrics = this.calculateMetrics(data, volume);

    if (volume > this.silenceThreshold) {
      this.lastSoundTimestamp = Date.now();
    } else {
      const silenceDuration = Date.now() - this.lastSoundTimestamp;
      if (silenceDuration > 1000) {
        this.totalSilenceTime += silenceDuration / 1000;
        this.significantPauses++;
      }
    }

    return {
      volume,
      pitch,
      clarity,
      confidence: (volume + clarity + metrics.steadiness) / 3,
      metrics,
      timestamp: Date.now()
    };
  }

  private calculateVolume(data: Uint8Array): number {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / (data.length * 255);
  }

  private calculatePitch(data: Uint8Array): number {
    const highFreqSum = data.slice(data.length / 2).reduce((acc, val) => acc + val, 0);
    return highFreqSum / (data.length * 255 / 2);
  }

  private calculateClarity(data: Uint8Array): number {
    const midFreqSum = data.slice(data.length / 4, data.length * 3 / 4)
      .reduce((acc, val) => acc + val, 0);
    return midFreqSum / (data.length * 255 / 2);
  }

  private calculateMetrics(data: Uint8Array, currentVolume: number): ToneMetrics {
    return {
      pace: this.calculatePace(),
      variation: this.calculateVariation(),
      energy: currentVolume * 1.2,
      steadiness: this.calculateSteadiness()
    };
  }

  private calculatePace(): number {
    if (this.previousAnalyses.length < 2) return 0.5;
    const changes = this.previousAnalyses.reduce((acc, curr, i, arr) => {
      if (i === 0) return acc;
      return acc + Math.abs(curr.volume - arr[i - 1].volume);
    }, 0);
    return Math.min(1, Math.max(0, 1 - (changes / this.previousAnalyses.length)));
  }

  private calculateVariation(): number {
    if (this.previousAnalyses.length < 2) return 0.5;
    const pitchChanges = this.previousAnalyses.reduce((acc, curr, i, arr) => {
      if (i === 0) return acc;
      return acc + Math.abs(curr.pitch - arr[i - 1].pitch);
    }, 0);
    return Math.min(1, pitchChanges / this.previousAnalyses.length);
  }

  private calculateSteadiness(): number {
    if (this.previousAnalyses.length < 2) return 0.5;
    const volumeVariation = this.previousAnalyses.reduce((acc, curr, i, arr) => {
      if (i === 0) return acc;
      return acc + Math.abs(curr.volume - arr[i - 1].volume);
    }, 0);
    return Math.min(1, Math.max(0, 1 - volumeVariation));
  }

  public getAggregateAnalysis(): AggregateAnalysis {
    const totalDuration = (Date.now() - this.analysisStartTime) / 1000;
    const count = this.previousAnalyses.length || 1;
    
    const metrics = this.previousAnalyses.reduce((acc, analysis) => ({
      pace: acc.pace + analysis.metrics.pace,
      variation: acc.variation + analysis.metrics.variation,
      energy: acc.energy + analysis.metrics.energy,
      steadiness: acc.steadiness + analysis.metrics.steadiness
    }), { pace: 0, variation: 0, energy: 0, steadiness: 0 });

    const averageMetrics = {
      pace: metrics.pace / count,
      variation: metrics.variation / count,
      energy: metrics.energy / count,
      steadiness: metrics.steadiness / count
    };

    const pitches = this.previousAnalyses.map(a => a.pitch);
    const pitchRange = {
      min: Math.min(...pitches),
      max: Math.max(...pitches),
      average: pitches.reduce((a, b) => a + b, 0) / count
    };

    const volumes = this.previousAnalyses.map(a => a.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / count;
    const volumeVariation = volumes.reduce((acc, vol) => 
      acc + Math.abs(vol - avgVolume), 0) / count;

    return {
      averageMetrics,
      overallConfidence: this.previousAnalyses.reduce((acc, a) => acc + a.confidence, 0) / count,
      totalSpeakingTime: totalDuration,
      silencePercentage: (this.totalSilenceTime / totalDuration) * 100,
      volumeVariation,
      pitchRange,
      significantPauses: this.significantPauses
    };
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyzer = null;
    this.dataArray = null;
  }
} 