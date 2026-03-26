import React from 'react';
import { Shield, Cpu, Network, CheckCircle, FileText, Download, Printer, Lock, Globe, Zap, UserCheck, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { Logo } from './Logo';

interface SystemReportProps {
  t: (key: any) => string;
}

export function SystemReport({ t }: SystemReportProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 print:p-0 print:m-0">
      {/* Header Actions */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-black text-zinc-900">{t('systemArchitectureReport')}</h2>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
        >
          <Printer size={18} />
          {t('exportAsPdf')}
        </button>
      </div>

      {/* The "PDF" Content */}
      <div className="bg-white p-12 rounded-[3rem] border border-zinc-200 shadow-2xl print:shadow-none print:border-none print:p-8">
        {/* Report Header */}
        <div className="flex justify-between items-start border-b-4 border-zinc-900 pb-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <Logo className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">{t('appName')}</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('tagline')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{t('generatedOn')}</p>
            <p className="text-sm font-bold text-zinc-900">{format(new Date(), 'PPP p')}</p>
          </div>
        </div>

        {/* Section 1: Initialization */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <Lock size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('initializationAuth')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-500" />
                {t('mAadhaarIntegration')}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {t('mAadhaarIntegrationDesc')}
              </p>
            </div>
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {t('biometricEncryption')}
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {t('uidaiVaultConnectivity')}
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {t('sessionTokenRotation')}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Processing Solution */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Cpu size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('aiProcessingExtraction')}</h2>
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-zinc-900 text-white rounded-[2rem] relative overflow-hidden">
              <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-5" />
              <p className="text-sm leading-relaxed opacity-90">
                {t('aiProcessingExtractionDesc')}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-zinc-100 rounded-2xl text-center">
                <Globe size={20} className="mx-auto mb-2 text-zinc-400" />
                <p className="text-[10px] font-black uppercase text-zinc-500">{t('multilingual')}</p>
              </div>
              <div className="p-4 border border-zinc-100 rounded-2xl text-center">
                <FileText size={20} className="mx-auto mb-2 text-zinc-400" />
                <p className="text-[10px] font-black uppercase text-zinc-500">{t('cctnsSchema')}</p>
              </div>
              <div className="p-4 border border-zinc-100 rounded-2xl text-center">
                <Zap size={20} className="mx-auto mb-2 text-zinc-400" />
                <p className="text-[10px] font-black uppercase text-zinc-500">{t('realTimeNlp')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Police Connectivity */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
              <Network size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('policeConnectivityRouting')}</h2>
          </div>
          <div className="bg-zinc-50 p-8 rounded-[2.5rem] border border-zinc-100">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <h4 className="text-sm font-bold text-zinc-900">{t('jurisdictionalRouting')}</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {t('jurisdictionalRoutingDesc')}
                </p>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <div className="h-2 bg-emerald-500 rounded-full w-full" />
                <div className="h-2 bg-emerald-500 rounded-full w-[80%]" />
                <div className="h-2 bg-zinc-200 rounded-full w-[60%]" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-2">{t('syncLatency')}: &lt; 200ms</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Case Solving Method */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
              <Scale size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('caseResolutionProtocol')}</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-zinc-200 rounded-3xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{t('investigationLifecycle')}</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {t('investigationLifecycleDesc')}
                </p>
              </div>
              <div className="p-6 border border-zinc-200 rounded-3xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">{t('resolutionMetrics')}</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  {t('resolutionMetricsDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <div className="mt-20 pt-12 border-t-2 border-zinc-100 text-center">
          <h3 className="text-lg font-black text-zinc-900 mb-4">{t('conclusionFutureScope')}</h3>
          <p className="text-sm text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            {t('conclusionFutureScopeDesc')}
          </p>
          <div className="mt-12 flex flex-col items-center">
            <div className="w-24 h-1 bg-zinc-900 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">{t('endOfReport')}</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 pt-8 border-t border-zinc-50 flex justify-between items-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
          <span>{t('systemId')}: SH-2026-X1</span>
          <span>{t('confidentialGovOnly')}</span>
        </div>
      </div>
    </div>
  );
}
