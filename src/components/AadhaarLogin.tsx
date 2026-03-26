import React, { useState } from 'react';
import { Shield, Smartphone, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface AadhaarLoginProps {
  onVerify: (aadhaarData: any) => void;
  onCancel: () => void;
}

export function AadhaarLogin({ onVerify, onCancel }: AadhaarLoginProps) {
  const [step, setStep] = useState<'number' | 'otp' | 'success'>('number');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNumber.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setError(null);
    setIsLoading(true);
    
    // Simulate API call to mAadhaar Gateway
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setStep('otp');
    setOtpSentMessage(true);
    // Set a mock OTP hint
    setOtp('');
  };

  const handleResendOtp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setError(null);
      // In a real app, this would trigger a new SMS
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your registered mobile.');
      return;
    }
    setError(null);
    setIsLoading(true);

    // Simulate Verification with UIDAI/mAadhaar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response from mAadhaar
    const mockAadhaarData = {
      uid: `aadhaar_${aadhaarNumber}`,
      name: "Junaid Baig", // Simulated from Aadhaar
      aadhaarNumber: `XXXX-XXXX-${aadhaarNumber.slice(-4)}`,
      isVerified: true,
      aadhaarData: {
        dob: "1995-05-15",
        gender: "Male",
        address: "123 Police Colony, Hyderabad, Telangana, 500001"
      }
    };

    setIsLoading(false);
    setStep('success');
    
    // Delay slightly to show success state before callback
    setTimeout(() => {
      onVerify(mockAadhaarData);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
      {/* Demo Mode Banner */}
      <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black uppercase px-4 py-1 rotate-45 translate-x-4 translate-y-2 shadow-sm z-10">
        Demo Mode
      </div>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-50">
          <Shield className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">mAadhaar Verification</h2>
        <p className="text-zinc-500 text-sm mt-2">Secure identity verification for Sahaya AI Complain</p>
      </div>

      {step === 'number' && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
              Aadhaar Number
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 12-digit UID"
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-lg font-mono tracking-[0.2em]"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300">
                <Smartphone size={20} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
              <span className="uppercase tracking-widest block mb-1">Demo Notice:</span>
              This is a simulated environment. Clicking "Get OTP" will mock the SMS delivery process. No real Aadhaar data is accessed.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || aadhaarNumber.length !== 12}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Get OTP
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 text-zinc-400 font-bold text-xs uppercase tracking-widest hover:text-zinc-600 transition-colors"
          >
            Cancel and use Google
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {otpSentMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 size={14} />
              OTP Sent Successfully (Demo Mode)
            </div>
          )}
          <div className="text-center mb-4">
            <p className="text-sm text-zinc-600">
              OTP sent to mobile linked with <span className="font-bold text-zinc-900">XXXX-XXXX-{aadhaarNumber.slice(-4)}</span>
            </p>
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-2">
              Demo Mode: Use any 6 digits (e.g. 123456)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0 0 0 0 0 0"
              className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-center text-2xl font-black tracking-[0.5em]"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Verify & Login
                <CheckCircle2 size={18} />
              </>
            )}
          </button>

          <div className="flex justify-between items-center px-2">
            <button
              type="button"
              onClick={() => setStep('number')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
            >
              Change Number
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center py-8 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">Verified!</h3>
          <p className="text-zinc-500 text-sm">Identity confirmed via mAadhaar Gateway.</p>
          <div className="mt-8 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 inline-block text-left">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Authenticated As</p>
            <p className="text-sm font-black text-zinc-900">JUNAID BAIG</p>
            <p className="text-[10px] font-bold text-emerald-600">UID: XXXX-XXXX-{aadhaarNumber.slice(-4)}</p>
          </div>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-center gap-4 opacity-30 grayscale">
        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Aadhaar_Logo.svg/1200px-Aadhaar_Logo.svg.png" alt="Aadhaar" className="h-8" />
        <div className="h-6 w-px bg-zinc-300" />
        <span className="text-[10px] font-black uppercase tracking-widest">Digital India</span>
      </div>
    </div>
  );
}
