import React from 'react';
import { Shield, AlertCircle, CheckCircle, Clock, FileText, MessageSquare, Zap, Phone, MapPin, Navigation, UserCheck, TrendingUp, Train, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  complaints: any[];
  onAction: (tab: 'dashboard' | 'assistant' | 'form' | 'list' | 'officer' | 'account' | 'settings' | 'report' | 'stations') => void;
  userName: string | null;
  t: (key: any) => string;
}

export function Dashboard({ complaints, onAction, userName, t }: DashboardProps) {
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const inProgressCount = complaints.filter(c => c.status === 'in-progress').length;

  const chartData = [
    { name: t('pending'), value: pendingCount, color: '#f59e0b' },
    { name: t('inProgress'), value: inProgressCount, color: '#3b82f6' },
    { name: t('resolved'), value: resolvedCount, color: '#10b981' },
  ].filter(d => d.value > 0);

  // Default data if no complaints
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'No Data', value: 1, color: '#e5e7eb' }
  ];

  const services = [
    { id: 'assistant', icon: MessageSquare, label: t('aiAssistant'), desc: t('chatInAnyLanguage'), color: 'bg-blue-500' },
    { id: 'form', icon: FileText, label: t('fileReport'), desc: t('cyberFraudTheft'), color: 'bg-emerald-500' },
    { id: 'list', icon: Clock, label: t('myReports'), desc: t('trackYourReports'), color: 'bg-amber-500' },
    { id: 'stations', icon: Shield, label: t('nearbyPolice'), desc: t('findHelpLocally'), color: 'bg-indigo-500' },
  ];

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    received: { label: t('received'), color: 'bg-zinc-100 text-zinc-600', icon: Clock },
    pending: { label: t('pending'), color: 'bg-zinc-100 text-zinc-600', icon: Clock },
    assigned: { label: t('assigned'), color: 'bg-blue-100 text-blue-600', icon: UserCheck },
    'in-progress': { label: t('inProgress'), color: 'bg-blue-100 text-blue-600', icon: Activity },
    verified: { label: t('verified'), color: 'bg-amber-100 text-amber-600', icon: Shield },
    fir_drafted: { label: t('firDrafted'), color: 'bg-purple-100 text-purple-600', icon: FileText },
    resolved: { label: t('resolved'), color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-24">
      {/* Welcome Banner */}
      <div className="bg-zinc-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-zinc-200">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">{t('appName')}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/70">{t('tagline')}</span>
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-2">{t('welcome')}, {userName?.split(' ')[0]}</h2>
          <p className="text-zinc-400 text-sm max-w-md leading-relaxed mb-6">
            {t('safetyDesc')}
          </p>
        </div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute right-8 top-8 opacity-10">
          <Logo className="w-32 h-32 text-white" />
        </div>
      </div>

      {/* Active Investigations Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-6">{t('activeInvestigations')}</h3>
        <div className="space-y-4">
          {complaints.filter(c => c.status !== 'resolved').slice(0, 3).map((complaint) => (
            <div key={complaint.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900 tracking-tight">{complaint.incidentType}</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t('ref')}: {complaint.id.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Officer Info */}
                  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('assignedOfficer')}</p>
                      <p className="text-xs font-bold text-zinc-900">{complaint.assignedOfficer?.name || t('assigning')}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm",
                    (statusMap[complaint.status] || statusMap.received).color
                  )}>
                    {React.createElement((statusMap[complaint.status] || statusMap.received).icon, { size: 14 })}
                    {(statusMap[complaint.status] || statusMap.received).label}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                  <span>{t('investigationProgress')}</span>
                  <span>{complaint.status === 'received' ? '10%' : complaint.status === 'assigned' ? '30%' : complaint.status === 'in-progress' ? '60%' : '90%'}</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: complaint.status === 'received' ? '10%' : complaint.status === 'assigned' ? '30%' : complaint.status === 'in-progress' ? '60%' : '90%' }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
              </div>
            </div>
          ))}
          {complaints.filter(c => c.status !== 'resolved').length === 0 && (
            <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('noActiveInvestigations')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-600" />
            {t('reportStatus')}
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Shield className="text-emerald-600" size={40} />
          </div>
          <h3 className="text-xl font-black text-zinc-900 mb-2 tracking-tight">{t('safetyPriority')}</h3>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
            {t('safetyDesc')}
          </p>
        </div>
      </div>

      {/* Service Grid - Disha Style */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-6">{t('availableServices')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => onAction(service.id as any)}
              className={cn(
                "flex flex-col items-center p-8 bg-white rounded-[3rem] border border-zinc-100 shadow-sm transition-all text-center group relative overflow-hidden",
                "hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 active:scale-95"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3",
                service.color
              )}>
                <service.icon size={32} />
              </div>
              <h3 className="font-black text-zinc-900 text-base tracking-tight">{service.label}</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1.5">{service.desc}</p>
              <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Safety Tips - Extra Feature */}
      <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
          <Zap size={14} className="text-amber-500" />
          {t('safetyTips')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: t('cyberSafety'), text: t('cyberSafetyDesc') },
            { title: t('emergencyInfo'), text: t('emergencyInfoDesc') },
            { title: t('publicPlaces'), text: t('publicPlacesDesc') },
            { title: t('reporting'), text: t('reportingDesc') }
          ].map((tip, i) => (
            <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tight mb-1">{tip.title}</h4>
              <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Numbers */}
      <div className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
          <Phone size={14} className="text-red-500" />
          {t('emergencyNumbers')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: t('police'), icon: Shield },
            { label: t('fire'), icon: Zap },
            { label: t('ambulance'), icon: Activity },
            { label: t('womenHelpline'), icon: UserCheck },
            { label: t('childHelpline'), icon: UserCheck },
            { label: t('cyberCrime'), icon: AlertCircle }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                <item.icon size={16} />
              </div>
              <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
