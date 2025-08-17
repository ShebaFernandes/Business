export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
}

export interface RetellCallConfig {
  accessToken: string;
  sampleRate: number;
  enableUpdate: boolean;
}

export interface TranscriptEntry {
  role: 'agent' | 'user';
  content: string;
  timestamp: number;
}

export interface CallStatus {
  isActive: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  error?: string;
}

export interface VoiceAgentProps {
  agentId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onError?: (error: string) => void;
}

export interface UseRetellReturn {
  callStatus: CallStatus;
  transcript: TranscriptEntry[];
  startCall: () => Promise<void>;
  endCall: () => void;
  clearTranscript: () => void;
}