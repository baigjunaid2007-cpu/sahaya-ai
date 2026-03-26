import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, RefreshCw, Mic, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { getAIResponse, Language, transcribeAudio } from '../services/geminiService';
import { VoiceRecorder } from './VoiceRecorder';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantProps {
  language: Language;
  onComplaintExtracted: (data: any) => void;
  t: (key: any) => string;
}

export function AIAssistant({ language, onComplaintExtracted, t }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t('aiAssistantWelcome') }]);
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const userMessage = textOverride || input.trim();
    if (!userMessage || isLoading) return;

    if (!textOverride) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      const response = await getAIResponse(userMessage, history, language);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: t('aiError') }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (base64Audio: string, mimeType: string) => {
    setIsLoading(true);
    let stage: 'transcription' | 'ai-response' = 'transcription';
    
    try {
      // First, transcribe the audio so the user can see what they said
      const transcription = await transcribeAudio({ data: base64Audio, mimeType }, language);
      
      if (!transcription || transcription.trim() === "") {
        setMessages(prev => [...prev, { role: 'assistant', content: t('emptyAudio') }]);
        setIsLoading(false);
        return;
      }

      const userMessage = transcription;
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      
      stage = 'ai-response';
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      // Send the transcription to the AI for a response
      const response = await getAIResponse(userMessage, history, language, { data: base64Audio, mimeType });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      console.error(`AI Voice Error (${stage}):`, error);
      
      let errorMessage = t('aiError');
      
      if (stage === 'transcription') {
        // Specific transcription errors
        if (error?.message?.includes('400')) {
          errorMessage = t('audioFormatError');
        } else if (error?.message?.includes('network') || !navigator.onLine) {
          errorMessage = "Network error: I'm having trouble connecting to the transcription service. Please check your internet connection.";
        } else {
          errorMessage = t('transcriptionError');
        }
      } else {
        // Specific AI response errors
        if (error?.message?.includes('network') || !navigator.onLine) {
          errorMessage = "Network error: I couldn't send your message to the AI. Please check your internet connection.";
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-[2.5rem] border border-zinc-200 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-zinc-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight">{t('aiAssistantTitle')}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest font-black text-zinc-400">{t('onlineMultilingual')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10">
            <Globe size={14} className="text-white/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {language === 'auto' ? t('auto') : language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : language === 'te' ? 'తెలుగు' : language === 'kn' ? 'ಕನ್ನಡ' : language === 'ta' ? 'தமிழ்' : 'മലയാളം'}
            </span>
          </div>
          <button 
            onClick={() => setMessages([{ role: 'assistant', content: t('aiAssistantWelcome') }])}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-zinc-50/30">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'user' ? "bg-zinc-900 text-white" : "bg-white text-emerald-600 border border-zinc-100"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={cn(
                "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white text-zinc-800 rounded-tl-none border border-zinc-100"
              )}>
                <div className="prose prose-sm prose-zinc max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              t('suggestionTheft'),
              t('suggestionHarassment'),
              t('suggestionLost'),
              t('suggestionTraffic')
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="px-4 py-2 bg-white border border-zinc-100 rounded-full text-xs font-semibold text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm">
              <Loader2 size={18} className="text-emerald-600 animate-spin" />
            </div>
            <div className="bg-white border border-zinc-100 p-4 rounded-3xl rounded-tl-none shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <VoiceRecorder 
            onRecordingComplete={handleVoiceRecording}
            isProcessing={isLoading}
          />
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-5 pr-14 py-4 bg-zinc-100 border-none rounded-[1.5rem] focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm font-medium"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-lg shadow-zinc-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
