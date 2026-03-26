import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LayoutDashboard, Shield, LogIn, LogOut, Plus, List, MessageSquare, User as UserIcon, Loader2, AlertCircle, Fingerprint, Settings, Bell, Globe, Lock, Eye, ChevronRight, CheckCircle, Home, Smartphone, Info, FileText, Train, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, storage, handleFirestoreError, OperationType } from './firebase';
import { AIAssistant } from './components/AIAssistant';
import { ComplaintForm } from './components/ComplaintForm';
import { ComplaintList } from './components/ComplaintList';
import { Dashboard } from './components/Dashboard';
import { OfficerView } from './components/OfficerView';
import { NearbyPoliceStations } from './components/NearbyPoliceStations';
import { TrackTravel } from './components/TrackTravel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Logo } from './components/Logo';
import { QuickSOS } from './components/QuickSOS';
import { AadhaarLogin } from './components/AadhaarLogin';
import { SystemReport } from './components/SystemReport';
import { Language } from './services/geminiService';
import { notificationService, NotificationData } from './services/notificationService';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { translations, TranslationKey } from './translations';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [onboardingStep, setOnboardingStep] = useState<'language' | 'welcome' | 'login' | 'profile' | 'completed'>('language');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assistant' | 'form' | 'list' | 'officer' | 'account' | 'settings' | 'report' | 'stations'>('dashboard');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAadhaarLogin, setShowAadhaarLogin] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', bio: '' });
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const t = (key: TranslationKey): string => {
    const lang = language === 'auto' ? 'en' : language;
    return translations[lang][key] || translations.en[key] || key;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch full profile from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profileData = userSnap.data();
          setUser({ ...currentUser, ...profileData });
          // If profile is incomplete and user is a citizen, show profile setup
          if (profileData.role === 'user' && (!profileData.phone || !profileData.bio)) {
            setEditFormData({
              name: profileData.name || currentUser.displayName || '',
              phone: profileData.phone || '',
              bio: profileData.bio || ''
            });
            setOnboardingStep('profile');
          } else {
            setOnboardingStep('completed');
          }
        } else {
          // Create basic profile if not exists
          const profile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email,
            role: 'user',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, profile);
          setUser({ ...currentUser, ...profile });
          setEditFormData({
            name: profile.name,
            phone: '',
            bio: ''
          });
          setOnboardingStep('profile');
        }
      } else {
        setUser(null);
        // If not logged in, start onboarding from language if not already in progress
        if (onboardingStep === 'completed') {
          setOnboardingStep('language');
        }
      }
      setIsAuthReady(true);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'complaints'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'complaints');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    // Request browser notification permission
    notificationService.requestPermission();

    // Listen for all notifications for this user/role
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all_officers']),
      where('role', '==', user.role),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationData));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.isRead).length);

      // Trigger browser notification for the latest one if it's new
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as NotificationData;
          // Only notify if it's not from the current user (though system usually creates these)
          notificationService.showBrowserNotification(data.title, data.message);
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Login was cancelled because the popup was closed. Please try again.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAuthError("Login request was cancelled. Please try again.");
      } else {
        setAuthError("An error occurred during login. Please try again.");
      }
    }
  };

  const handleAadhaarVerify = async (aadhaarData: any) => {
    setIsLoading(true);
    try {
      // In a real app, you'd use Firebase Custom Auth or link Aadhaar to a Firebase account.
      // For this MVP, we'll simulate a login by using a fixed UID or creating a session.
      // We'll use a mock UID based on the Aadhaar hash.
      const mockUid = `aadhaar_${aadhaarData.uid}`;
      
      const userRef = doc(db, 'users', mockUid);
      const userSnap = await getDoc(userRef);
      
      const profile = {
        uid: mockUid,
        name: aadhaarData.name,
        role: 'user',
        aadhaarNumber: aadhaarData.aadhaarNumber,
        isAadhaarVerified: true,
        aadhaarData: aadhaarData.aadhaarData,
        createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString()
      };

      await setDoc(userRef, profile);
      setUser(profile);
      setEditFormData({
        name: profile.name,
        phone: '',
        bio: ''
      });
      setOnboardingStep('profile');
    } catch (error) {
      console.error("Aadhaar login failed", error);
      setAuthError("Aadhaar verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates = {
        name: editFormData.name,
        phone: editFormData.phone,
        bio: editFormData.bio,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updates);
      setUser({ ...user, ...updates });
      setIsEditingProfile(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    setEditFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setIsEditingProfile(true);
  };

  const handleSubmitComplaint = async (data: any) => {
    if (!user) return;
    try {
      let videoUrl = null;
      let videoMimeType = null;

      if (data.videoFile) {
        const videoRef = ref(storage, `complaints/${user.uid}/${Date.now()}_${data.videoFile.name}`);
        const snapshot = await uploadBytes(videoRef, data.videoFile);
        videoUrl = await getDownloadURL(snapshot.ref);
        videoMimeType = data.videoFile.type;
      }

      const { videoFile, ...complaintData } = data;

      const docRef = await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        userId: user.uid,
        userName: user.name || user.displayName,
        userEmail: user.email,
        language,
        status: 'pending',
        videoUrl,
        videoMimeType,
        createdAt: new Date().toISOString()
      });

      // Create notification for officers
      await notificationService.createNotification({
        userId: 'all_officers',
        role: 'officer',
        title: 'New Complaint Filed',
        message: `A new ${data.incidentType} report has been filed by ${user.name || user.displayName}.`,
        type: 'new_complaint',
        complaintId: docRef.id
      });

      setActiveTab('list');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'complaints');
    }
  };

  const simulateOfficerLogin = async () => {
    setIsLoading(true);
    try {
      const mockUid = 'officer_123';
      const userRef = doc(db, 'users', mockUid);
      const profile = {
        uid: mockUid,
        name: 'Inspector Rajesh Kumar',
        email: 'rajesh.kumar@police.gov.in',
        role: 'officer',
        badgeNumber: 'POL-8829',
        isAadhaarVerified: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
      setUser(profile);
      setActiveTab('officer');
    } catch (error) {
      console.error("Officer login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    setOnboardingStep('completed');
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 overflow-hidden relative">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -left-1/4 w-full h-full bg-emerald-500/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.15, 0.1],
              rotate: [0, -90, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-blue-500/20 blur-[120px] rounded-full"
          />
        </div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center relative z-10"
        >
          <motion.div 
            animate={{ 
              boxShadow: ["0 0 0 0px rgba(16, 185, 129, 0)", "0 0 0 20px rgba(16, 185, 129, 0.1)", "0 0 0 0px rgba(16, 185, 129, 0)"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-28 h-28 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/40 mb-8"
          >
            <Logo className="w-16 h-16 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h1 className="text-4xl font-black tracking-tighter text-white mb-1">SAHAYA AI</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Multilingual Police Complaint Portal</p>
            <div className="flex items-center justify-center gap-3 text-emerald-400/50 font-bold text-[8px] uppercase tracking-[0.3em]">
              <Shield size={14} />
              <span>Securing Citizens</span>
            </div>
          </motion.div>

          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-emerald-500"
              />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Initializing Secure Portal</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
        {onboardingStep !== 'completed' && !user?.role && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <AnimatePresence mode="wait">
              {onboardingStep === 'language' && (
                <motion.div
                  key="language"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Globe className="text-emerald-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{t('selectLanguage')}</h2>
                    <p className="text-zinc-500 text-sm mt-2">Choose your preferred communication language</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { id: 'en', label: 'English', sub: 'Primary' },
                      { id: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                      { id: 'te', label: 'తెలుగు', sub: 'Telugu' },
                      { id: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
                      { id: 'ta', label: 'தமிழ்', sub: 'Tamil' },
                      { id: 'ml', label: 'മലയാളം', sub: 'Malayalam' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setLanguage(lang.id as Language);
                          setOnboardingStep('welcome');
                        }}
                        className="w-full flex items-center justify-between p-5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="text-left">
                          <p className="font-black text-zinc-900 group-hover:text-emerald-700">{lang.label}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang.sub}</p>
                        </div>
                        <ChevronRight className="text-zinc-300 group-hover:text-emerald-500" size={20} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {onboardingStep === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 text-center"
                >
                  <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                    <Logo className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-4">{t('welcomeToSahaya')}</h2>
                  <p className="text-zinc-600 mb-10 leading-relaxed">
                    {t('welcomeDesc')}
                  </p>
                  <button
                    onClick={() => setOnboardingStep('login')}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    {t('getStarted')}
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {onboardingStep === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md space-y-4"
                >
                  <AadhaarLogin 
                    onVerify={handleAadhaarVerify} 
                    onCancel={() => setOnboardingStep('language')} 
                  />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-zinc-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-zinc-50 px-2 text-zinc-400 font-black tracking-widest">Or</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const provider = new GoogleAuthProvider();
                      signInWithPopup(auth, provider);
                    }}
                    className="w-full py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    {t('continueWithGoogle')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {onboardingStep === 'profile' && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-white rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{t('setupProfile')}</h2>
                  <p className="text-zinc-500 text-sm">{t('setupProfileDesc')}</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                await handleUpdateProfile(e);
                setOnboardingStep('completed');
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('fullName')}</label>
                    <input 
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                      placeholder={t('enterYourName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('phoneNumber')}</label>
                    <input 
                      type="tel"
                      required
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                      placeholder="Enter 10-digit mobile"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('bio')}</label>
                  <textarea 
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium h-32 resize-none"
                    placeholder={t('tellUsAboutYourself')}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('finish')}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Header */}
        <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Logo className="w-12 h-12 shadow-lg shadow-emerald-200 rounded-xl" />
              <div className="text-left">
                <h1 className="text-xl font-black tracking-tight text-zinc-900 leading-none">SAHAYA AI</h1>
                <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600 mt-1">Multilingual Police Complaint Portal</p>
              </div>
            </button>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-6">
                  <div className="hidden md:flex items-center gap-1">
                    <button 
                      onClick={() => setActiveTab('account')}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                        activeTab === 'account' ? "bg-emerald-50 text-emerald-600" : "text-zinc-500 hover:bg-zinc-50"
                      )}
                    >
                      <UserIcon size={16} />
                      Account
                    </button>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                        activeTab === 'settings' ? "bg-emerald-50 text-emerald-600" : "text-zinc-500 hover:bg-zinc-50"
                      )}
                    >
                      <Settings size={16} />
                      {t('settings')}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 border-l border-zinc-100 pl-4 sm:pl-6">
                    <div className="relative">
                      <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={cn(
                          "p-2 rounded-xl transition-all relative",
                          showNotifications ? "bg-emerald-50 text-emerald-600" : "text-zinc-400 hover:bg-zinc-50"
                        )}
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white rounded-3xl border border-zinc-200 shadow-2xl z-[100] overflow-hidden"
                          >
                            <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">{t('notifications')}</h3>
                              <button 
                                onClick={() => {
                                  notifications.forEach(n => !n.isRead && notificationService.markAsRead(n.id!));
                                }}
                                className="text-[10px] font-bold text-emerald-600 hover:underline"
                              >
                                {t('markAllRead')}
                              </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
                              {notifications.length > 0 ? (
                                notifications.map((n) => (
                                  <div 
                                    key={n.id} 
                                    className={cn(
                                      "p-4 hover:bg-zinc-50 transition-colors cursor-pointer",
                                      !n.isRead && "bg-emerald-50/30"
                                    )}
                                    onClick={() => {
                                      notificationService.markAsRead(n.id!);
                                      setShowNotifications(false);
                                      // Potentially navigate to the complaint
                                      setActiveTab(user.role === 'officer' ? 'officer' : 'list');
                                    }}
                                  >
                                    <div className="flex gap-3">
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        n.type === 'new_complaint' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                                      )}>
                                        {n.type === 'new_complaint' ? <Plus size={14} /> : <CheckCircle size={14} />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-zinc-900 leading-tight mb-1">{n.title}</p>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">{n.message}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                                          {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-8 text-center">
                                  <p className="text-xs text-zinc-400">{t('noNotifications')}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 mr-2">
                    {(['en', 'hi', 'te', 'auto'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          language === lang 
                            ? "bg-white text-zinc-900 shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'hi' ? 'HI' : 'TE'}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                      <span className="text-sm font-bold text-zinc-900">{user.name || user.displayName}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">{user.role || t('user')}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-red-600"
                      title={t('logout')}
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 mr-2">
                    {(['en', 'hi', 'te', 'auto'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          language === lang 
                            ? "bg-white text-zinc-900 shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-600"
                        )}
                      >
                        {lang === 'auto' ? 'Auto' : lang === 'en' ? 'EN' : lang === 'hi' ? 'HI' : 'TE'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAadhaarLogin(true)}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all text-sm"
                  >
                    <Fingerprint size={16} />
                    {t('aadhaarLogin')}
                  </button>
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    <LogIn size={18} />
                    {t('login')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {!user ? (
              <div className="max-w-4xl mx-auto py-12">
                {showAadhaarLogin ? (
                  <AadhaarLogin 
                    onVerify={handleAadhaarVerify} 
                    onCancel={() => setShowAadhaarLogin(false)} 
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                      <Logo className="w-16 h-16" />
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 mb-4 tracking-tight">{t('appName')}</h2>
                    <p className="text-lg text-zinc-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                      {t('footerText')}
                    </p>

                    {authError && (
                      <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center justify-center gap-2">
                        <AlertCircle size={16} />
                        {authError}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={handleLogin}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                      >
                        <LogIn size={24} />
                        {t('continueWithGoogle')}
                      </button>
                    </div>

                    <div className="mt-12 pt-12 border-t border-zinc-200">
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mb-4">{t('internalAccess')}</p>
                      <button
                        onClick={simulateOfficerLogin}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-600 rounded-2xl font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm shadow-sm"
                      >
                        <Shield size={18} />
                        {t('officerPortalLogin')}
                      </button>
                    </div>
                    
                    <p className="mt-8 text-xs text-zinc-400 font-medium">
                      {t('aadhaarRecommendation')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar / Navigation */}
              <div className="lg:col-span-3 space-y-8">
                {/* Emergency Section */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4">Emergency</h3>
                  <QuickSOS />
                  <a href="tel:100" className="flex items-center justify-center gap-2 w-full py-3 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-colors">
                    <Shield size={16} />
                    Police 100
                  </a>
                </div>
                
                {/* Main Navigation */}
                <div className="space-y-3 hidden lg:block">
                  <nav className="space-y-1">
                    {user.role === 'officer' ? (
                      // Police Navigation
                      [
                        { id: 'dashboard', icon: Shield, label: t('commandCenter') },
                        { id: 'report', icon: FileText, label: t('systemReports') },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all",
                            activeTab === item.id 
                              ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                              : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
                          )}
                        >
                          <item.icon size={18} />
                          {item.label}
                        </button>
                      ))
                    ) : (
                      // Victim Navigation
                      [
                        { id: 'dashboard', icon: Home, label: t('home') },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id as any)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all",
                            activeTab === item.id 
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                              : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200"
                          )}
                        >
                          <item.icon size={18} />
                          {item.label}
                        </button>
                      ))
                    )}
                  </nav>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'dashboard' && (
                      user.role === 'officer' ? (
                        <div className="space-y-6">
                          <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-zinc-200 relative overflow-hidden">
                            <div className="relative z-10 flex items-center gap-6">
                              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <Logo className="w-10 h-10 text-white" />
                              </div>
                              <div>
                                <h2 className="text-3xl font-black mb-2">{t('officerCommandCenter')}</h2>
                                <p className="text-zinc-400 opacity-90 max-w-lg">
                                  {t('officerCommandCenterDesc')}
                                </p>
                              </div>
                            </div>
                            <Shield className="absolute -right-10 -bottom-10 w-64 h-64 text-white opacity-5 rotate-12" />
                          </div>
                          <OfficerView complaints={complaints} t={t} />
                        </div>
                      ) : (
                        <Dashboard 
                          complaints={complaints} 
                          userName={user.name || user.displayName} 
                          onAction={(tab) => setActiveTab(tab)} 
                          t={t}
                        />
                      )
                    )}

                    {activeTab === 'report' && (
                      <div className="max-w-4xl mx-auto">
                        <SystemReport t={t} />
                      </div>
                    )}

                    {activeTab === 'assistant' && user.role !== 'officer' && (
                      <div className="space-y-6">
                        <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100">
                          <h2 className="text-3xl font-black mb-2">{t('aiAssistantHeader')}</h2>
                          <p className="text-emerald-50 opacity-90">
                            {t('aiAssistantDesc')}
                          </p>
                        </div>
                        <AIAssistant 
                          language={language} 
                          onComplaintExtracted={(data) => {
                            // In a real app, we'd pre-fill the form
                            setActiveTab('form');
                          }} 
                          t={t}
                        />
                      </div>
                    )}

                    {activeTab === 'form' && user.role !== 'officer' && (
                      <ComplaintForm 
                        language={language} 
                        onSubmit={handleSubmitComplaint} 
                        t={t}
                      />
                    )}

                    {activeTab === 'list' && user.role !== 'officer' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-black text-zinc-900">{t('yourComplaints')}</h2>
                          <span className="px-3 py-1 bg-zinc-200 text-zinc-700 rounded-full text-xs font-bold">
                            {complaints.length} {t('total')}
                          </span>
                        </div>
                        <ComplaintList complaints={complaints} t={t} />
                      </div>
                    )}

                    {activeTab === 'stations' && user.role !== 'officer' && (
                      <NearbyPoliceStations t={t} />
                    )}

                    {activeTab === 'account' && (
                      <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-zinc-100 rounded-2xl text-zinc-600">
                                <UserIcon size={24} />
                              </div>
                              <h2 className="text-2xl font-black text-zinc-900">{t('yourProfile')}</h2>
                            </div>
                            {isEditingProfile && (
                              <button 
                                onClick={() => setIsEditingProfile(false)}
                                className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                              >
                                {t('cancel')}
                              </button>
                            )}
                          </div>

                          {isEditingProfile ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('fullName')}</label>
                                  <input 
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                                    placeholder={t('enterYourName')}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('phoneNumber')}</label>
                                  <input 
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                    className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                                    placeholder="+91 XXXXX XXXXX"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">{t('bio')}</label>
                                <textarea 
                                  value={editFormData.bio}
                                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                                  className="w-full px-5 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium h-32 resize-none"
                                  placeholder={t('tellUsAboutYourself')}
                                />
                              </div>
                              <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
                              >
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {t('saveChanges')}
                              </button>
                            </form>
                          ) : (
                            <div className="flex flex-col md:flex-row items-center gap-8 p-4">
                              <div className="relative">
                                <div className="w-32 h-32 bg-zinc-100 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                                  {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <UserIcon size={64} className="text-zinc-300" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-black text-zinc-900 mb-1">{user.name || user.displayName}</h3>
                                <p className="text-zinc-500 font-medium mb-4">{user.email}</p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                  <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-zinc-200">
                                    {user.role === 'officer' ? t('policeOfficer') : t('citizen')}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={startEditing}
                                className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                              >
                                {t('editProfile')}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                              <Bell size={14} className="text-emerald-600" />
                              {t('accountDetails')}
                            </h3>
                            <div className="space-y-5">
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm font-medium text-zinc-500">{t('memberSince')}</span>
                                <span className="text-sm font-bold text-zinc-900">{format(new Date(user.createdAt), 'PPP')}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm font-medium text-zinc-500">{t('phoneNumber')}</span>
                                <span className="text-sm font-bold text-zinc-900">{user.phone || t('notProvided')}</span>
                              </div>
                              <div className="flex justify-between items-center py-1">
                                <span className="text-sm font-medium text-zinc-500">{t('authProvider')}</span>
                                <span className="text-sm font-bold text-zinc-900 capitalize">{user.uid.startsWith('aadhaar_') ? 'mAadhaar' : 'Google'}</span>
                              </div>
                              {user.badgeNumber && (
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-sm font-medium text-zinc-500">{t('badgeNumber')}</span>
                                  <span className="text-sm font-bold text-zinc-900">{user.badgeNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                              <FileText size={14} className="text-emerald-600" />
                              {t('bio')}
                            </h3>
                            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 min-h-[120px]">
                              <p className="text-sm text-zinc-600 leading-relaxed italic">
                                {user.bio || t('noBio')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="p-3 bg-zinc-100 rounded-2xl text-zinc-600">
                            <Settings size={24} />
                          </div>
                          <h2 className="text-2xl font-black text-zinc-900">{t('portalSettings')}</h2>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
                          {[
                            { title: t('notifications'), desc: t('manageAlerts'), icon: Bell },
                            { title: t('languageRegion'), desc: t('setPortalLanguage'), icon: Globe },
                            { title: t('privacy'), desc: t('controlDataSharing'), icon: Lock },
                            { title: t('accessibility'), desc: t('adjustFontContrast'), icon: Eye },
                            { title: t('systemReport'), desc: t('architectureProtocol'), icon: FileText, tab: 'report' },
                          ].map((item, i) => (
                            <div 
                              key={i} 
                              onClick={() => item.tab && setActiveTab(item.tab as any)}
                              className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-zinc-50 rounded-xl text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                  <item.icon size={20} />
                                </div>
                                <div>
                                  <p className="font-bold text-zinc-900">{item.title}</p>
                                  <p className="text-xs text-zinc-500">{item.desc}</p>
                                </div>
                              </div>
                              <ChevronRight size={20} className="text-zinc-300 group-hover:text-emerald-600 transition-colors" />
                            </div>
                          ))}
                        </div>

                        <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                          <h3 className="text-sm font-black text-red-900 mb-2">{t('dangerZone')}</h3>
                          <p className="text-xs text-red-700 mb-4">{t('deleteAccountDesc')}</p>
                          <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all">
                            {t('deleteAccount')}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        <footer className="bg-white border-t border-zinc-200 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
              <Logo className="w-8 h-8" />
              <span className="font-bold tracking-widest text-xs uppercase">{t('appName')}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 mt-1">{t('tagline')}</span>
            </div>
            <p className="text-zinc-400 text-[10px] mt-4">
              &copy; 2026 {t('appName')}. {t('footerText')}
            </p>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        {user && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-4 py-2 flex items-center justify-center z-50 pb-safe">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                activeTab === 'dashboard' ? "text-emerald-600" : "text-zinc-400"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                activeTab === 'dashboard' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-zinc-100"
              )}>
                <Home size={24} className={cn(activeTab === 'dashboard' && "scale-110")} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">{t('home')}</span>
            </button>
          </nav>
        )}

      </div>
    </ErrorBoundary>
  );
}
