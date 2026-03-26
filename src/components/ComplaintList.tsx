import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, CheckCircle, AlertCircle, Info, ShieldAlert, Play, Pause, FileText, User, ChevronRight, Calendar, Bell, Zap, Activity, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineEvent {
  status: string;
  timestamp: string;
  note: string;
}

interface Reminder {
  type: string;
  date: string;
  description: string;
}

interface Complaint {
  id: string;
  incidentType: string;
  description: string;
  location: string;
  jurisdiction?: string;
  incidentDate: string;
  status: 'received' | 'assigned' | 'verified' | 'fir_drafted' | 'resolved';
  aiSummary?: string[];
  assignedOfficer?: {
    name: string;
    rank: string;
    badge: string;
  };
  timeline?: TimelineEvent[];
  reminders?: Reminder[];
  createdAt: string;
  isAnonymous?: boolean;
  isSOS?: boolean;
  audioEvidence?: string;
  audioMimeType?: string;
  videoUrl?: string;
  videoMimeType?: string;
}

interface ComplaintListProps {
  complaints: Complaint[];
  t: (key: any) => string;
}

export function ComplaintList({ complaints, t }: ComplaintListProps) {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const filteredComplaints = filterStatus === 'all' 
    ? complaints 
    : complaints.filter(c => c.status === filterStatus);

  const toggleAudio = (id: string, base64: string, mimeType: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(`data:${mimeType};base64,${base64}`);
      audioRef.current = audio;
      audio.play();
      setPlayingId(id);
      audio.onended = () => setPlayingId(null);
    }
  };

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    received: { label: t('received'), color: 'bg-zinc-100 text-zinc-600', icon: Clock },
    pending: { label: t('pending'), color: 'bg-zinc-100 text-zinc-600', icon: Clock },
    assigned: { label: t('assigned'), color: 'bg-blue-100 text-blue-600', icon: User },
    'in-progress': { label: t('investigating'), color: 'bg-blue-100 text-blue-600', icon: Activity },
    verified: { label: t('verified'), color: 'bg-amber-100 text-amber-600', icon: ShieldAlert },
    fir_drafted: { label: t('firDrafted'), color: 'bg-purple-100 text-purple-600', icon: FileText },
    resolved: { label: t('resolved'), color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'pending', 'assigned', 'in-progress', 'resolved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm",
              filterStatus === status 
                ? "bg-zinc-900 text-white border-zinc-900" 
                : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
            )}
          >
            {status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-zinc-200 shadow-sm">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-zinc-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900">{t('noComplaints')}</h3>
          <p className="text-zinc-500">{t('fileNew')}</p>
        </div>
      ) : (
        filteredComplaints.map((complaint) => (
        <div key={complaint.id} className={cn(
          "bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden",
          complaint.isSOS ? "border-red-200 bg-red-50/30" : "border-zinc-200"
        )}>
          <div className="p-6">
            {complaint.isAnonymous && (
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
                {t('panicMode')}
              </div>
            )}
            {complaint.isSOS && (
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm flex items-center gap-1">
                <ShieldAlert size={10} />
                {t('sosAlert')}
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "text-xl font-black tracking-tight",
                    complaint.isSOS ? "text-red-600" : "text-zinc-900"
                  )}>{complaint.incidentType}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase tracking-tighter">{t('cctnsReady')}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(complaint.incidentDate), 'PPp')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {complaint.location}
                  </span>
                  {complaint.jurisdiction && (
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <ShieldAlert size={12} />
                      {complaint.jurisdiction}
                    </span>
                  )}
                </div>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm",
                (statusMap[complaint.status] || statusMap.received).color
              )}>
                {React.createElement((statusMap[complaint.status] || statusMap.received).icon, { size: 12 })}
                {(statusMap[complaint.status] || statusMap.received).label}
              </div>
            </div>

            {/* AI Summary - Officer's Co-pilot */}
            {complaint.aiSummary && complaint.aiSummary.length > 0 && (
              <div className="mb-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                  <Zap size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('aiSummary')}</span>
                </div>
                <ul className="space-y-1.5">
                  {complaint.aiSummary.map((bullet, i) => (
                    <li key={i} className="text-xs text-zinc-700 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-zinc-600 text-sm mb-4 leading-relaxed italic">
              "{complaint.description}"
            </p>

            <div className="flex flex-wrap items-center gap-3">
                  {complaint.audioEvidence && (
                <button
                  onClick={() => toggleAudio(complaint.id, complaint.audioEvidence!, complaint.audioMimeType!)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-colors"
                >
                  {playingId === complaint.id ? <Pause size={14} /> : <Play size={14} />}
                  {playingId === complaint.id ? t('pauseEvidence') : t('playEvidence')}
                </button>
              )}

              {complaint.videoUrl && (
                <a
                  href={complaint.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-colors"
                >
                  <Video size={14} />
                  {t('viewVideoEvidence')}
                </a>
              )}
              
              <button
                onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
              >
                {expandedId === complaint.id ? t('hideDetails') : t('trackStatus')}
                <ChevronRight size={14} className={cn("transition-transform", expandedId === complaint.id && "rotate-90")} />
              </button>
            </div>

            {/* Expanded Tracking Timeline - Uber Style */}
            {expandedId === complaint.id && (
              <div className="mt-6 pt-6 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Timeline */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Investigation Timeline</h4>
                    <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                      {(complaint.timeline || [
                        { status: 'received', timestamp: complaint.createdAt, note: 'Complaint successfully logged in CCTNS.' }
                      ]).map((event, i) => (
                        <div key={i} className="relative">
                          <div className={cn(
                            "absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm",
                            i === 0 ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-zinc-300"
                          )} />
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-1">{event.status.replace('_', ' ')}</p>
                          <p className="text-[10px] text-zinc-400 mb-1">{format(new Date(event.timestamp), 'PPp')}</p>
                          <p className="text-xs text-zinc-600 leading-relaxed">{event.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Officer & Reminders */}
                  <div className="space-y-6">
                    {/* Assigned Officer */}
                    <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-2">
                        <User size={14} />
                        {t('assignedOfficer')}
                      </h4>
                      {complaint.assignedOfficer ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <User className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900">{complaint.assignedOfficer.name}</p>
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">
                              {complaint.assignedOfficer.rank} • Badge #{complaint.assignedOfficer.badge}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-blue-700 opacity-70">Officer assignment in progress...</p>
                      )}
                    </div>

                    {/* Legal Reminders */}
                    <div className="p-5 bg-purple-50 rounded-3xl border border-purple-100">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-3 flex items-center gap-2">
                        <Bell size={14} />
                        {t('legalReminders')}
                      </h4>
                      {complaint.reminders && complaint.reminders.length > 0 ? (
                        <div className="space-y-3">
                          {complaint.reminders.map((reminder, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Calendar size={14} className="text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-zinc-900">{reminder.description}</p>
                                <p className="text-[10px] text-purple-600 font-bold">{format(new Date(reminder.date), 'PPP')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-purple-700 opacity-70">No upcoming court dates or document requests.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span>Ref: {complaint.id.slice(0, 8)}</span>
            <span>Filed {format(new Date(complaint.createdAt), 'PP')}</span>
          </div>
        </div>
      ))
    )}
    </div>
  );
}
