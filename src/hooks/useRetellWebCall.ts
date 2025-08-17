import { useState, useRef, useCallback, useEffect } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import { 
  TranscriptEntry, 
  CallStatus, 
  UseRetellReturn 
} from '../types/retell';

interface UseRetellWebCallProps {
  agentId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onError?: (error: string) => void;
}

export const useRetellWebCall = ({
  agentId,
  onCallStart,
  onCallEnd,
  onTranscriptUpdate,
  onError
}: UseRetellWebCallProps): UseRetellReturn => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
    isConnected: false
  });

  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const retellClientRef = useRef<RetellWebClient | null>(null);

  // Initialize Retell client
  useEffect(() => {
    retellClientRef.current = new RetellWebClient();
    
    return () => {
      if (retellClientRef.current && callStatus.isActive) {
        retellClientRef.current.stopCall();
      }
    };
  }, []);

  // Setup event listeners
  useEffect(() => {
    const client = retellClientRef.current;
    if (!client) return;

    const handleCallStarted = () => {
      console.log('Call started');
      setCallStatus({
        isActive: true,
        isConnecting: false,
        isConnected: true
      });
      onCallStart?.();
    };

    const handleCallEnded = () => {
      console.log('Call ended');
      setCallStatus({
        isActive: false,
        isConnecting: false,
        isConnected: false
      });
      onCallEnd?.();
    };

    const handleError = (error: any) => {
      console.error('Retell client error:', error);
      const errorMessage = error.message || 'Voice call error occurred';
      setCallStatus({
        isActive: false,
        isConnecting: false,
        isConnected: false,
        error: errorMessage
      });
      onError?.(errorMessage);
    };

    const handleUpdate = (update: any) => {
      if (update.transcript && Array.isArray(update.transcript)) {
        const formattedTranscript: TranscriptEntry[] = update.transcript.map(
          (entry: any) => ({
            role: entry.role,
            content: entry.content,
            timestamp: Date.now()
          })
        );
        setTranscript(formattedTranscript);
        onTranscriptUpdate?.(formattedTranscript);
      }
    };

    // Register event listeners
    client.on('call_started', handleCallStarted);
    client.on('call_ended', handleCallEnded);
    client.on('error', handleError);
    client.on('update', handleUpdate);

    // Cleanup event listeners
    return () => {
      client.off('call_started', handleCallStarted);
      client.off('call_ended', handleCallEnded);
      client.off('error', handleError);
      client.off('update', handleUpdate);
    };
  }, [onCallStart, onCallEnd, onTranscriptUpdate, onError]);

  const createWebCall = async (agentId: string): Promise<string> => {
    try {
      const response = await fetch('https://api.retellai.com/v2/create-web-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_RETELL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: agentId,
          metadata: {
            session_type: 'business_consultation',
            timestamp: new Date().toISOString(),
            user_id: 'web_user_' + Date.now()
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Response:', errorData);
        throw new Error(`Failed to create web call: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error creating web call:', error);
      throw new Error('Failed to initialize voice call. Please check your API key and agent ID.');
    }
  };

  const startCall = useCallback(async () => {
    const client = retellClientRef.current;
    if (!client || callStatus.isActive || callStatus.isConnecting) {
      return;
    }

    try {
      setCallStatus({
        isActive: false,
        isConnecting: true,
        isConnected: false
      });

      // Get access token from Retell API
      const accessToken = await createWebCall(agentId);

      // Start the call with Retell client
      await client.startCall({
        accessToken,
        sampleRate: 24000,
        enableUpdate: true,
      });

    } catch (error) {
      console.error('Error starting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
      setCallStatus({
        isActive: false,
        isConnecting: false,
        isConnected: false,
        error: errorMessage
      });
      onError?.(errorMessage);
    }
  }, [agentId, callStatus.isActive, callStatus.isConnecting, onError]);

  const endCall = useCallback(() => {
    const client = retellClientRef.current;
    if (client && callStatus.isActive) {
      client.stopCall();
    }
  }, [callStatus.isActive]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
  }, []);

  return {
    callStatus,
    transcript,
    startCall,
    endCall,
    clearTranscript
  };
};