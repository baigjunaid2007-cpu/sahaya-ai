import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Shield, Loader2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { detectJurisdiction } from '../services/geminiService';
import { motion } from 'motion/react';

export function TrackTravel() {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [jurisdiction, setJurisdiction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = () => {
    setIsLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        try {
          const data = await detectJurisdiction(latitude, longitude);
          setJurisdiction(data);
        } catch (err) {
          setError("Failed to identify jurisdiction.");
        } finally {
          setIsLoading(false);
        }
      }, (err) => {
        setError("Location access denied.");
        setIsLoading(false);
      });
    } else {
      setError("Geolocation not supported.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500 rounded-2xl">
              <Navigation size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Travel Safety Monitor</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Real-time Jurisdiction Tracking</p>
            </div>
          </div>
          <p className="text-zinc-400 text-sm max-w-md">
            Sahaya AI monitors your current location to keep you informed about the local police jurisdiction you are currently in.
          </p>
        </div>
        <Navigation className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <MapPin size={14} className="text-purple-600" />
              Current Location
            </h3>
            <button 
              onClick={updateLocation}
              disabled={isLoading}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="text-purple-600 animate-spin mb-4" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Locating...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : location ? (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Coordinates</p>
                <p className="text-lg font-black text-zinc-900">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
              <div className="h-48 rounded-2xl overflow-hidden border border-zinc-200">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 px-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Tracking Active
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            <Shield size={14} className="text-purple-600" />
            Local Jurisdiction
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="text-purple-600 animate-spin mb-4" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Identifying...</p>
            </div>
          ) : jurisdiction ? (
            <div className="space-y-4">
              <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Police Station</p>
                <p className="text-xl font-black text-purple-900">{jurisdiction.stationName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">District</p>
                  <p className="text-sm font-bold text-zinc-900">{jurisdiction.district}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">State</p>
                  <p className="text-sm font-bold text-zinc-900">{jurisdiction.state}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-300">
              <Shield size={48} className="mb-4 opacity-20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No jurisdiction data</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
        <h3 className="text-lg font-black tracking-tight mb-4">Safety Protocols</h3>
        <div className="space-y-3">
          {[
            "Share your live location with trusted contacts.",
            "Keep your phone charged and emergency numbers on speed dial.",
            "Be aware of the nearest police station in your current area.",
            "In case of danger, use the Quick SOS feature immediately."
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-purple-200 transition-colors">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-[10px] font-black shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-zinc-600 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
