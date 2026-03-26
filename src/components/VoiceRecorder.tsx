import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete: (base64Audio: string, mimeType: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function VoiceRecorder({ onRecordingComplete, isProcessing, className }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to find a supported mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
        'audio/wav'
      ];
      
      let selectedMimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }

      const mediaRecorder = selectedMimeType 
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);
        
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          onRecordingComplete(base64Audio, mediaRecorder.mimeType);
        };
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={cn(
          "p-4 rounded-full transition-all duration-300 shadow-lg",
          isRecording 
            ? "bg-red-500 text-white animate-pulse" 
            : "bg-emerald-600 text-white hover:bg-emerald-700",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
        title={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={24} />
        ) : isRecording ? (
          <Square size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
      {isRecording && (
        <span className="text-xs font-bold text-red-500 animate-pulse uppercase tracking-widest">
          Recording...
        </span>
      )}
      {error && (
        <div className="flex items-center gap-1 text-red-500 text-[10px] font-medium">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
