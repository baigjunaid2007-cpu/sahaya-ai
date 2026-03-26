import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc,
} from 'firebase/firestore';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  MessageSquare, 
  User, 
  MapPin, 
  Calendar,
  Shield,
  ExternalLink,
  MoreVertical,
  ArrowRight,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Video
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { notificationService } from '../services/notificationService';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Complaint {
  id: string;
  userId: string;
  incidentType: string;
  description: string;
  location: string;
  incidentDate: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  aiSummary?: string[];
  officerNotes?: string;
  userName?: string;
  userEmail?: string;
  videoUrl?: string;
  videoMimeType?: string;
}

interface OfficerViewProps {
  complaints: Complaint[];
  t: (key: any) => string;
}

export function OfficerView({ complaints: initialComplaints, t }: OfficerViewProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'resolved'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showDashboard, setShowDashboard] = useState(true);

  useEffect(() => {
    setComplaints(initialComplaints);
  }, [initialComplaints]);

  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filter === 'all' || c.status === filter;
    const matchesType = filterType === 'all' || c.incidentType === filterType;
    const matchesLocation = filterLocation === 'all' || c.location === filterLocation;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
                         c.incidentType.toLowerCase().includes(searchLower) || 
                         c.description.toLowerCase().includes(searchLower) ||
                         c.id.toLowerCase().includes(searchLower) ||
                         (c.userName && c.userName.toLowerCase().includes(searchLower)) ||
                         (c.userEmail && c.userEmail.toLowerCase().includes(searchLower));
                         
    return matchesStatus && matchesType && matchesLocation && matchesSearch;
  });

  const uniqueTypes = Array.from(new Set(complaints.map(c => c.incidentType))).sort();
  const uniqueLocations = Array.from(new Set(complaints.map(c => c.location))).sort();

  // Analytics Data
  const statusData = [
    { name: t('pending'), value: complaints.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: t('inProgress'), value: complaints.filter(c => c.status === 'in-progress').length, color: '#3b82f6' },
    { name: t('resolved'), value: complaints.filter(c => c.status === 'resolved').length, color: '#10b981' },
  ];

  const typeData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.incidentType] = (acc[c.incidentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'in-progress' | 'resolved') => {
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Create notification for user
      if (selectedComplaint) {
        await notificationService.createNotification({
          userId: selectedComplaint.userId,
          role: 'user',
          title: t('complaintStatusUpdated') || 'Complaint Status Updated',
          message: `${t('complaintDesc')} ${selectedComplaint.incidentType} ${t('status')} ${newStatus}.`,
          type: 'status_update',
          complaintId: id
        });
      }

      if (selectedComplaint?.id === id) {
        setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `complaints/${id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedComplaint || !noteInput.trim()) return;
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'complaints', selectedComplaint.id);
      await updateDoc(docRef, { 
        officerNotes: noteInput,
        updatedAt: new Date().toISOString()
      });
      setSelectedComplaint(prev => prev ? { ...prev, officerNotes: noteInput } : null);
      setNoteInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `complaints/${selectedComplaint.id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-12rem)]">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setShowDashboard(!showDashboard)}
          className={cn(
            "p-4 rounded-3xl border flex items-center gap-4 transition-all",
            showDashboard ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-zinc-200"
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", showDashboard ? "bg-zinc-800" : "bg-zinc-100")}>
            <BarChart3 size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{t('commandCenter')}</p>
            <p className="font-bold">{showDashboard ? t('hideDashboard') : t('showDashboard')}</p>
          </div>
        </button>

        <div className="bg-white p-4 rounded-3xl border border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('pending')}</p>
            <p className="text-xl font-black">{complaints.filter(c => c.status === 'pending').length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('inProgress')}</p>
            <p className="text-xl font-black">{complaints.filter(c => c.status === 'in-progress').length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-zinc-200 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('resolved')}</p>
            <p className="text-xl font-black">{complaints.filter(c => c.status === 'resolved').length}</p>
          </div>
        </div>
      </div>

      {showDashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <PieIcon size={14} className="text-emerald-600" />
              {t('reportStatus')}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <BarChart3 size={14} className="text-emerald-600" />
              {t('incidentType')}
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Sidebar: List of Complaints */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-zinc-900 flex items-center gap-2">
                <Shield size={18} className="text-emerald-600" />
                {t('activeInvestigations')}
              </h3>
              <span className="text-[10px] font-bold bg-zinc-100 px-2 py-1 rounded-full text-zinc-500">
                {filteredComplaints.length} {t('totalReports')}
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  <option value="all">{t('allTypes')}</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full pl-9 pr-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                >
                  <option value="all">{t('allLocations') || 'All Locations'}</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'pending', 'in-progress', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-all",
                    filter === f 
                      ? "bg-zinc-900 text-white border-zinc-900" 
                      : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {f === 'all' ? t('allTypes') : t(f as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredComplaints.length > 0 ? (
              filteredComplaints.map((complaint) => (
                <button
                  key={complaint.id}
                  onClick={() => setSelectedComplaint(complaint)}
                  className={cn(
                    "w-full p-4 text-left transition-all hover:bg-zinc-50 flex flex-col gap-2",
                    selectedComplaint?.id === complaint.id ? "bg-emerald-50/50 border-l-4 border-emerald-600" : "border-l-4 border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-zinc-400">#{complaint.id.slice(-6).toUpperCase()}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded border",
                      getStatusColor(complaint.status)
                    )}>
                      {t(complaint.status as any)}
                    </span>
                  </div>
                  <p className="font-bold text-zinc-900 text-sm truncate">{complaint.incidentType}</p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {format(new Date(complaint.createdAt), 'MMM d')}</span>
                    <span className="flex items-center gap-1 truncate"><MapPin size={12} /> {complaint.location}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm text-zinc-400">{t('noReportsFound')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Complaint Details */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          {selectedComplaint ? (
            <>
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center shadow-sm">
                    <Shield className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-black text-zinc-900 tracking-tight">{selectedComplaint.incidentType}</h2>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded border",
                        getStatusColor(selectedComplaint.status)
                      )}>
                        {t(selectedComplaint.status as any)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono">{t('ref')}: {selectedComplaint.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedComplaint.status}
                    onChange={(e) => handleUpdateStatus(selectedComplaint.id, e.target.value as any)}
                    disabled={isUpdating}
                    className="text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="in-progress">{t('inProgress')}</option>
                    <option value="resolved">{t('resolved')}</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* AI Summary Section */}
                {selectedComplaint.aiSummary && (
                  <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
                      <Zap size={14} />
                      {t('aiAssistantInsight')}
                    </h3>
                    <ul className="space-y-3">
                      {selectedComplaint.aiSummary.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-emerald-900 leading-relaxed">
                          <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
                            {i + 1}
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Core Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('incidentDetails')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500"><Calendar size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{t('incidentDate')}</p>
                          <p className="text-sm font-semibold text-zinc-900">{format(new Date(selectedComplaint.incidentDate), 'PPP p')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-zinc-100 rounded-lg text-zinc-500"><MapPin size={16} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{t('location')}</p>
                          <p className="text-sm font-semibold text-zinc-900">{selectedComplaint.location}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('reporterInfo')}</h3>
                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="w-10 h-10 bg-white rounded-full border border-zinc-200 flex items-center justify-center">
                        <User size={20} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{selectedComplaint.userName || t('anonymousUser')}</p>
                        <p className="text-[10px] text-zinc-500">{selectedComplaint.userEmail || t('noEmailProvided')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Description */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('description')}</h3>
                  <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Video Evidence */}
                {selectedComplaint.videoUrl && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('videoEvidence')}</h3>
                    <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                      <video 
                        src={selectedComplaint.videoUrl} 
                        controls 
                        className="w-full max-h-96 rounded-2xl bg-black shadow-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Video size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{t('evidenceFileAttached')}</span>
                        </div>
                        <a 
                          href={selectedComplaint.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          {t('openInNewTab')} <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Officer Notes */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('officerInvestigationNotes')}</h3>
                  {selectedComplaint.officerNotes ? (
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-sm text-blue-900 leading-relaxed italic">
                      {selectedComplaint.officerNotes}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">{t('noNotesAdded')}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <textarea 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder={t('addNotePlaceholder')}
                      className="flex-1 p-4 bg-white border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none h-24"
                    />
                  </div>
                  <button 
                    onClick={handleAddNote}
                    disabled={isUpdating || !noteInput.trim()}
                    className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs hover:bg-zinc-800 transition-all disabled:opacity-50"
                  >
                    {t('updateStatus')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                <Shield size={48} />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900">{t('selectReportToView')}</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                  {t('selectReportDesc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Zap = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
