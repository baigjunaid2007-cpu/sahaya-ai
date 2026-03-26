import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Calendar, FileText, AlertCircle, Loader2, Mic, Navigation, Video, X, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { Language, transcribeAudio, detectJurisdiction } from '../services/geminiService';
import { VoiceRecorder } from './VoiceRecorder';

interface ComplaintFormProps {
  language: Language;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  t: (key: any) => string;
}

export function ComplaintForm({ language, initialData, onSubmit, t }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    incidentType: initialData?.incidentType || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    coordinates: initialData?.coordinates || null as { lat: number, lng: number } | null,
    jurisdiction: initialData?.jurisdiction || '',
    incidentDate: initialData?.incidentDate || new Date().toISOString().slice(0, 16),
    isAnonymous: false,
    videoFile: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'cyber_fraud', label: t('cyberFraud') },
    { id: 'theft', label: t('theft') },
    { id: 'harassment', label: t('harassment') },
    { id: 'missing_person', label: t('missingPerson') },
    { id: 'traffic', label: t('trafficViolation') },
    { id: 'lost_found', label: t('lostFound') },
    { id: 'nuisance', label: t('publicNuisance') },
    { id: 'other', label: t('other') }
  ];

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const jurisdictionData = await detectJurisdiction(latitude, longitude);
        setFormData(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude },
          jurisdiction: `${jurisdictionData.stationName}, ${jurisdictionData.district}`,
          location: prev.location || `${jurisdictionData.district}, ${jurisdictionData.state}`
        }));
        setIsDetectingLocation(false);
      }, (error) => {
        console.error("Geolocation Error:", error);
        setIsDetectingLocation(false);
      });
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsDetectingLocation(false);
    }
  };

  const handleVoiceRecording = async (base64Audio: string, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const transcription = await transcribeAudio({ data: base64Audio, mimeType }, language);
      if (transcription && transcription.trim() !== "") {
        setFormData(prev => ({
          ...prev,
          description: prev.description ? `${prev.description}\n${transcription}` : transcription
        }));
      }
    } catch (error) {
      console.error("Transcription Error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Video size must be less than 10MB");
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      console.error("Submission Error:", err);
      let message = "Failed to file complaint. Please check your connection and try again.";
      if (err.message && err.message.startsWith('{')) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error && parsed.error.includes('insufficient permissions')) {
            message = "Security validation failed. Please ensure all fields are correctly filled.";
          }
        } catch (e) {}
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <ShieldCheck className="text-emerald-600" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900">{t('title')}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
          <Globe size={14} className="text-zinc-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
            {language === 'auto' ? t('auto') : language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : language === 'te' ? 'తెలుగు' : language === 'kn' ? 'ಕನ್ನಡ' : language === 'ta' ? 'தமிழ்' : 'മലയാളം'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
            <AlertCircle size={16} className="text-zinc-400" />
            {t('type')}
          </label>
          <select
            required
            value={formData.incidentType}
            onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.label}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              {t('desc')}
            </label>
            <VoiceRecorder 
              onRecordingComplete={handleVoiceRecording}
              isProcessing={isTranscribing}
              className="scale-75 origin-right"
            />
          </div>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
            placeholder={t('describePlaceholder')}
          />
          {isTranscribing && (
            <p className="text-[10px] text-emerald-600 font-bold animate-pulse mt-1">
              {t('transcribing')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-zinc-700 flex items-center gap-2">
                <MapPin size={16} className="text-zinc-400" />
                {t('loc')}
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700 disabled:opacity-50"
              >
                {isDetectingLocation ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                {t('detectLoc')}
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder={t('areaLandmark')}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
              <Calendar size={16} className="text-zinc-400" />
              {t('date')}
            </label>
            <input
              type="datetime-local"
              required
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        {formData.jurisdiction && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <ShieldCheck className="text-emerald-600" size={16} />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t('jurisdiction')}</span>
              <span className="block text-sm font-bold text-zinc-900">{formData.jurisdiction}</span>
            </div>
          </div>
        )}

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-3xl">
          <label className="block text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
            <Video size={16} className="text-zinc-400" />
            {t('videoEvidence')}
          </label>
          
          {!formData.videoFile ? (
            <div className="relative group">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="p-8 border-2 border-dashed border-zinc-300 rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-emerald-400 group-hover:bg-emerald-50 transition-all">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  <Video size={24} className="text-zinc-400 group-hover:text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-zinc-600">{t('videoDesc')}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{t('videoFormats')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Video size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 truncate max-w-[200px]">{formData.videoFile.name}</p>
                  <p className="text-[10px] text-zinc-400 font-bold">{(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, videoFile: null }))}
                className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-xl transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="block font-bold text-red-900">{t('anonymous')}</span>
              <span className="block text-xs text-red-700 opacity-80">{t('anonymousDesc')}</span>
            </div>
          </label>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </button>
    </form>
  );
}
