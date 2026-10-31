import React, { useState } from 'react';
import {
  X,
  User,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Copy,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldAlert,
  Database,
  Cloud
} from 'lucide-react';
import {
  getLastSyncTime,
  getDeviceInfo,
  getCustomEndpointUrl
} from '../services/cloudSync';

interface UserSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string | null;
  onLogin: (username: string) => Promise<void>;
  onLogout: () => void;
  onForceSync: () => Promise<void>;
  isSyncing: boolean;
}

export const UserSyncModal: React.FC<UserSyncModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
  onLogin,
  onLogout,
  onForceSync,
  isSyncing,
}) => {
  const [usernameInput, setUsernameInput] = useState(currentUsername || '');
  const [activeTab, setActiveTab] = useState<'account' | 'mobile_sync'>('account');
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    await onLogin(trimmed);
  };

  // Generate 1-click instant link for mobile phone
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://english-partner-bd.netlify.app';
  const currentEndpoint = getCustomEndpointUrl();
  const mobileAutoSyncUrl = currentUsername && currentEndpoint
    ? `${siteOrigin}/?sync=${encodeURIComponent(currentEndpoint)}&u=${encodeURIComponent(currentUsername)}`
    : currentUsername
    ? `${siteOrigin}/?u=${encodeURIComponent(currentUsername)}`
    : `${siteOrigin}`;

  const handleCopyMobileLink = () => {
    navigator.clipboard.writeText(mobileAutoSyncUrl);
    setCopiedMobileLink(true);
    setTimeout(() => setCopiedMobileLink(false), 3000);
  };

  const lastSync = getLastSyncTime();
  const currentDevice = getDeviceInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20">
              <Cloud className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ক্লাউড প্রগ্রেস সিঙ্ক
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  PC ↔ Phone
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                পিসি ও মোবাইলে আপনার প্রগ্রেস সিঙ্ক রাখুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean 2-Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ইউজার একাউন্ট</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_sync')}
            className={`flex-1 py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'mobile_sync'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📲 ফোনে সিঙ্ক</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TAB 1: USER ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              {currentUsername ? (
                <div className="p-5 rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-900 border border-sky-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-black text-xl">
                        {currentUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">{currentUsername}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            লগইন সক্রিয়
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ডিভাইস: <span className="text-sky-300 font-mono">{currentDevice}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onForceSync}
                      disabled={isSyncing}
                      className="p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                      title="এখনই ক্লাউড থেকে আপডেট করুন"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
                      <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'সিঙ্ক করুন'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-sky-400" />
                      <span>PC ব্রাউজার</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <span>↔</span>
                      <span>স্বয়ংক্রিয় সিঙ্ক</span>
                      <span>↔</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>মোবাইল ফোন</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {lastSync ? `সর্বশেষ আপডেট: ${lastSync}` : 'ক্লাউড কানেক্টেড'}
                    </span>
                    <button
                      onClick={onLogout}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>লগআউট / পরিবর্তন</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                    <label className="block text-xs sm:text-sm font-bold text-white">
                      আপনার নাম / ইউজারনেম লিখুন:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="e.g. zuboraj বা Rafijur"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white placeholder-slate-500 text-sm font-mono tracking-wide"
                      />
                      <div className="absolute right-3 top-3.5 text-slate-400 text-xs font-medium">
                        <User className="w-4 h-4 inline" />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-300">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <span>
                        <strong>কেস-সেন্সিটিভ সতর্কতা:</strong> <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">zuboraj</code> এবং <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">Zuboraj</code> সম্পূর্ণ আলাদা অ্যাকাউন্ট। পিসিতে ও ফোনে হুবহু একই নাম লিখবেন।
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>লগইন করুন ও প্রগ্রেস সিঙ্ক করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: 1-CLICK INSTANT PHONE SYNC */}
          {activeTab === 'mobile_sync' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>মোবাইল ফোনে ১-ক্লিকে সিঙ্ক করার লিংক</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  মোবাইলে কোনো ইউজারনেম টাইপ করতে হবে না। নিচের বাটনে চাপ দিয়ে অটো-সিঙ্ক লিংকটি কপি করুন এবং WhatsApp বা মেসেঞ্জারে পাঠিয়ে ফোনে ওপেন করুন:
                </p>
              </div>

              {/* Generated Link Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">আপনার নিজস্ব মোবাইল অটো-সিঙ্ক লিংক:</span>
                  <button
                    onClick={handleCopyMobileLink}
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    {copiedMobileLink ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedMobileLink ? 'লিংক কপি হয়েছে!' : 'লিংক কপি করুন'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 break-all select-all">
                  {mobileAutoSyncUrl}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5 text-slate-300">
                <p className="font-bold text-white">ফোনে কীভাবে কাজ করবে?</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px]">
                  <li>এই লিংকটি আপনার ফোনের ব্রাউজারে খুলুন।</li>
                  <li>আপনার ফোন স্বয়ংক্রিয়ভাবে <strong className="text-emerald-400">{currentUsername || 'ইউজার'}</strong> হিসেবে লগইন হয়ে যাবে।</li>
                  <li>পিসিতে পড়া যেকোনো বাক্য সাথে সাথে ফোনে আপডেট দেখতে পাবেন!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            English Partner · Cloud Database Live
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
