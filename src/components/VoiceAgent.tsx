import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Phone, PhoneOff, MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRetellWebCall } from '../hooks/useRetellWebCall';
import { TranscriptEntry } from '../types/retell';
import { useAuth } from '../contexts/AuthContext';
import webhookService from '../services/webhookService';

interface VoiceAgentProps {
  agentId: string;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ agentId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    callStatus,
    transcript,
    startCall,
    endCall,
    clearTranscript
  } = useRetellWebCall({
    agentId,
    onCallStart: () => {
      console.log('Voice call started');
      setShowTranscript(true);
    },
    onCallEnd: () => {
      console.log('Voice call ended');
    },
    onError: (error) => {
      console.error('Voice call error:', error);
    }
  });

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleCallToggle = async () => {
    if (callStatus.isActive) {
      endCall();
    } else {
      await startCall();
      if (!isExpanded) {
        setIsExpanded(true);
        setIsMinimized(false);
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Floating button when minimized
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={() => {setIsMinimized(false); setIsExpanded(true);}}
          className={`
            relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-300 hover:scale-105
            ${callStatus.isActive 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
          
          {/* Call status indicator */}
          {callStatus.isActive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1"></div>
            </div>
          )}
        </motion.button>
      </motion.div>
    );
  }

  // Expanded voice agent interface
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <div>
              <h3 className="font-semibold text-sm">AI Business Advisor</h3>
              <p className="text-xs text-blue-100">
                {callStatus.isActive ? 'In Call' : 
                 callStatus.isConnecting ? 'Connecting...' : 
                 'Ready to help'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isExpanded && (
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="p-1 rounded hover:bg-blue-400"
                title={showTranscript ? 'Hide Transcript' : 'Show Transcript'}
              >
                {showTranscript ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-blue-400"
              title="Minimize"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Call Controls */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleCallToggle}
            disabled={callStatus.isConnecting}
            className={`
              relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 transform hover:scale-105
              focus:outline-none focus:ring-4 focus:ring-opacity-50
              ${callStatus.isActive 
                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300' 
                : 'bg-green-500 hover:bg-green-600 focus:ring-green-300'
              }
              ${callStatus.isConnecting ? 'animate-pulse' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {callStatus.isConnecting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : callStatus.isActive ? (
              <PhoneOff className="w-6 h-6 text-white" />
            ) : (
              <Phone className="w-6 h-6 text-white" />
            )}
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {callStatus.isConnecting ? 'Connecting...' :
               callStatus.isActive ? 'Tap to End Call' :
               'Tap to Start Consultation'}
            </p>
            <p className="text-xs text-gray-500">
              Get instant business advice and guidance
            </p>
          </div>
        </div>

        {/* Error Display */}
        {callStatus.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{callStatus.error}</p>
          </div>
        )}

        {/* Transcript */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Live Transcript</h4>
                {transcript.length > 0 && (
                  <button
                    onClick={clearTranscript}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div 
                ref={scrollRef}
                className="h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 space-y-2"
              >
                {transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p className="text-sm">Conversation will appear here...</p>
                  </div>
                ) : (
                  transcript.map((entry, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        entry.role === 'agent' 
                          ? 'bg-blue-100 text-blue-900' 
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {entry.role === 'agent' ? 'AI Advisor' : 'You'}
                        </span>
                        <span className="text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p>{entry.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Statistics */}
        {callStatus.isActive && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Live</span>
              </div>
            </div>
            {transcript.length > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Messages:</span>
                <span className="text-gray-900">{transcript.length}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceAgent;