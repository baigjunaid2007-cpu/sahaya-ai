import React, { useState, useEffect } from 'react';
import { MapPin, Shield, ExternalLink, Loader2, Navigation, AlertCircle, ArrowRight, Phone, Clock, MessageSquare } from 'lucide-react';
import { findNearbyPoliceStations } from '../services/geminiService';
import { cn } from '../lib/utils';

interface NearbyPoliceStationsProps {
  t: (key: any) => string;
}

export function NearbyPoliceStations({ t }: NearbyPoliceStationsProps) {
  const [stations, setStations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [selectedStationIndex, setSelectedStationIndex] = useState(0);

  const handleFindStations = () => {
    setIsLoading(true);
    setError(null);
    setStations([]);
    setAiText(null);
    setSelectedStationIndex(0);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await findNearbyPoliceStations(latitude, longitude);
          setStations(result.stations);
          setAiText(result.text);
        } catch (err) {
          setError(t('failedToFetchStations'));
        } finally {
          setIsLoading(false);
        }
      }, (err) => {
        setError(t('locationPermissionDenied'));
        setIsLoading(false);
      });
    } else {
      setError(t('geolocationNotSupported'));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFindStations();
  }, []);

  const selectedStation = stations[selectedStationIndex];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Shield className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{t('nearbyPoliceStations')}</h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('nearbyStationsSubtitle')}</p>
            </div>
          </div>
          <button
            onClick={handleFindStations}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
            <span>{isLoading ? t('finding') : t('refreshLocation')}</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 mb-6">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List Section */}
          <div className="lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-zinc-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 rounded w-3/4" />
                      <div className="h-3 bg-zinc-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : stations.length > 0 ? (
              stations.map((station, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStationIndex(i)}
                  className={cn(
                    "w-full text-left p-6 rounded-3xl border transition-all group relative overflow-hidden",
                    selectedStationIndex === i 
                      ? "bg-emerald-50 border-emerald-200 shadow-md" 
                      : "bg-white border-zinc-200 hover:border-emerald-200 hover:bg-zinc-50"
                  )}
                >
                  <div className="flex gap-4 relative z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      selectedStationIndex === i 
                        ? "bg-emerald-600 text-white" 
                        : "bg-zinc-100 text-zinc-400 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                    )}>
                      <Shield size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-black mb-1 transition-colors",
                        selectedStationIndex === i ? "text-emerald-900" : "text-zinc-900"
                      )}>
                        {station.title}
                      </h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1 line-clamp-1">
                        <MapPin size={12} />
                        {station.address}
                      </p>
                    </div>
                  </div>
                  {selectedStationIndex === i && (
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-600" />
                  )}
                </button>
              ))
            ) : !isLoading && !error && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-zinc-200" size={32} />
                </div>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">{t('noStationsFound')}</p>
              </div>
            )}
          </div>

          {/* Map/Detail Section */}
          <div className="lg:col-span-7 space-y-6">
            {selectedStation ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="rounded-3xl overflow-hidden border border-zinc-200 h-80 shadow-inner relative group">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedStation.title + ' ' + selectedStation.address)}&output=embed`}
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest shadow-sm">
                    {t('liveMapView')}
                  </div>
                </div>

                <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-zinc-900 mb-2">{selectedStation.title}</h3>
                    <p className="text-zinc-500 flex items-center gap-2 font-medium">
                      <MapPin size={16} className="text-emerald-600" />
                      {selectedStation.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('status')}</p>
                        <p className="text-sm font-bold text-zinc-900">{t('open247')}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('emergency')}</p>
                        <p className="text-sm font-bold text-zinc-900">{t('dial100')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={selectedStation.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      <Navigation size={20} />
                      {t('getDirections')}
                    </a>
                    <a
                      href={`tel:100`}
                      className="flex-1 flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                      <Phone size={20} />
                      {t('callStation')}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-[2rem] border border-dashed border-zinc-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                  <MapPin className="text-zinc-200" size={40} />
                </div>
                <h3 className="text-lg font-black text-zinc-400 uppercase tracking-widest">{t('selectStationToView')}</h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {aiText && (
        <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                <MessageSquare className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-black tracking-tight">{t('aiAssistantInsight')}</h3>
            </div>
            <p className="text-emerald-50 text-lg font-medium leading-relaxed italic">
              "{aiText}"
            </p>
          </div>
          <Shield className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-10 rotate-12" />
        </div>
      )}

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-zinc-800 rounded-xl">
            <Navigation className="text-emerald-400" size={20} />
          </div>
          <h3 className="text-lg font-black tracking-tight">{t('whyThisMatters')}</h3>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {t('whyThisMattersDesc')}
        </p>
      </div>
    </div>
  );
}
