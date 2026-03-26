import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Loader2, MapPin, Mic, ShieldAlert } from 'lucide-react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';

export function QuickSOS() {
  const [isActivating, setIsActivating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'locating' | 'recording' | 'complete' | 'error'>('idle');
  const [countdown, setCountdown] = useState(30);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const alertIdRef = useRef<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'recording' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && status === 'recording') {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const startSOS = async () => {
    if (isActivating) return;
    setIsActivating(true);
    setStatus('locating');
    setCountdown(30);

    try {
      // 1. Get Location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // 2. Create Initial Alert in Firestore
      const alertRef = await addDoc(collection(db, 'complaints'), {
        userId: auth.currentUser?.uid,
        incidentType: 'SOS ALERT',
        description: 'QUICK SOS ACTIVATED. Emergency situation reported.',
        location: `GPS: ${latitude}, ${longitude}`,
        latitude,
        longitude,
        status: 'pending',
        isSOS: true,
        createdAt: new Date().toISOString()
      });
      alertIdRef.current = alertRef.id;

      // 3. Start Audio Recording
      setStatus('recording');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
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
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Update Alert with Audio Evidence
          if (alertIdRef.current) {
            try {
              await updateDoc(doc(db, 'complaints', alertIdRef.current), {
                audioEvidence: base64Audio,
                audioMimeType: mediaRecorder.mimeType,
                description: 'QUICK SOS ACTIVATED. Emergency situation reported. Audio evidence attached.'
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, 'complaints');
            }
          }
          setStatus('complete');
          setIsActivating(false);
          setTimeout(() => setStatus('idle'), 5000);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("SOS Activation Failed", err);
      setStatus('error');
      setIsActivating(false);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={startSOS}
        disabled={isActivating && status !== 'recording'}
        className={cn(
          "w-full py-6 rounded-3xl font-black text-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-2xl relative overflow-hidden",
          status === 'idle' && "bg-red-600 text-white hover:bg-red-700 active:scale-95",
          status === 'locating' && "bg-amber-500 text-white cursor-wait",
          status === 'recording' && "bg-red-600 text-white animate-pulse",
          status === 'complete' && "bg-emerald-600 text-white",
          status === 'error' && "bg-zinc-800 text-white"
        )}
      >
        {status === 'idle' && (
          <>
            <ShieldAlert size={48} className="animate-bounce" />
            <span>QUICK SOS</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Tap for Emergency</span>
          </>
        )}

        {status === 'locating' && (
          <>
            <Loader2 size={48} className="animate-spin" />
            <span>LOCATING...</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Capturing GPS Coordinates</span>
          </>
        )}

        {status === 'recording' && (
          <>
            <Mic size={48} />
            <span>RECORDING EVIDENCE</span>
            <span className="text-4xl font-mono">{countdown}s</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Ambient Audio Capture Active</span>
          </>
        )}

        {status === 'complete' && (
          <>
            <MapPin size={48} />
            <span>ALERT SENT</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Police Notified with Location</span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle size={48} />
            <span>ERROR</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Check Permissions & Try Again</span>
          </>
        )}
      </button>
    </div>
  );
}
