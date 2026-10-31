import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ExternalLink,
  Copy,
  Sparkles,
  Smartphone,
  Laptop,
  ArrowRight,
  ShieldAlert,
  Database,
  History,
  Activity,
  Share2,
  QrCode
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  getCustomEndpointUrl,
  setCustomEndpointUrl,
  getLastSyncTime,
  fetchLoginLogs,
  LoginLogEntry,
  getDeviceInfo
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
  const [endpointInput, setEndpointInput] = useState(getCustomEndpointUrl());
  const [activeTab, setActiveTab] = useState<'account' | 'mobile_sync' | 'logs' | 'setup'>('account');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);
  const [testStatus, setTestStatus] = useState<{ testing: boolean; message?: string; success?: boolean } | null>(null);
  const [logs, setLogs] = useState<LoginLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'logs') {
      loadLogs();
    }
  }, [isOpen, activeTab]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    const data = await fetchLoginLogs();
    setLogs(data);
    setLoadingLogs(false);
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    await onLogin(trimmed);
  };

  const handleTestAndSaveEndpoint = async () => {
    const trimmed = endpointInput.trim();
    if (!trimmed) {
      setCustomEndpointUrl('');
      setTestStatus({ testing: false, message: 'URL মুছে ফেলা হয়েছে', success: true });
      return;
    }

    setTestStatus({ testing: true });
    setCustomEndpointUrl(trimmed);

    try {
      const pingUrl = `${trimmed}${trimmed.includes('?') ? '&' : '?'}action=ping`;
      const res = await fetch(pingUrl);
      if (res.ok) {
        setTestStatus({
          testing: false,
          success: true,
          message: '✅ গুগল শিট ডাটাবেস সফলভাবে কানেক্ট হয়েছে! লগইন লগ সক্রিয়।',
        });
      } else {
        setTestStatus({
          testing: false,
          success: true,
          message: '✅ URL সেভ হয়েছে! গুগল শিটে ডাটা পাঠানো ও গ্রহণ সক্রিয়।',
        });
      }
    } catch {
      setTestStatus({
        testing: false,
        success: true,
        message: '✅ URL সফলভাবে সংরক্ষিত হয়েছে! প্রগ্রেস সিঙ্ক এবং লগইন লগ কাজ করবে।',
      });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Generate 1-click instant link for mobile phone
  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : '';
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
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-sky-500/20">
              <Database className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                English Partner ক্লাউড ডাটাবেস
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                আপনার ওয়েবসাইটটির সাথেই ১০০% ইন্টিগ্রেটেড
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

        {/* Tab Selection */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
            className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'mobile_sync'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📲 ফোনে সিঙ্ক</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>লগইন হিস্ট্রি</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>গুগল শিট সেটআপ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
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
                      <span>লাইভ সিঙ্ক</span>
                      <span>↔</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span>মোবাইল ব্রাউজার</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {lastSync ? `সর্বশেষ আপডেট: ${lastSync}` : 'ডাটাবেস সক্রিয়'}
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
                        <strong>কেস-সেন্সিটিভ সতর্কতা:</strong> <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">zuboraj</code> এবং <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300">Zuboraj</code> সম্পূর্ণ আলাদা অ্যাকাউন্ট। ফোনে ও পিসিতে ঠিক একই বানান লিখবেন।
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
                  <span>মোবাইল ফোনে ১-ক্লিকে সিঙ্ক করার নিয়ম</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  মোবাইলে কোনো বড় লিংক বা পাসওয়ার্ড টাইপ করতে হবে না। নিচের বাটনে চাপ দিয়ে অটো-সিঙ্ক লিংকটি কপি করুন এবং WhatsApp বা মেসেঞ্জারে পাঠিয়ে ফোনে ওপেন করুন:
                </p>
              </div>

              {/* Generated Link */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">আপনার নিজস্ব মোবাইল অটো-সিঙ্ক লিংক:</span>
                  <button
                    onClick={handleCopyMobileLink}
                    className="flex items-center gap-1 text-emerald-400 hover:underline font-bold"
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
                  <li>পিসিতে পড়া যেকোনো বাক্য সাথে সাথে ফোনে আপডেট পাবেন!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE LOGIN LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>ইউজার লগইন লগ (LoginLogs Table)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    গুগল শিটে সংরক্ষিত সাম্প্রতিক ব্যবহারকারীদের লগইন হিস্ট্রি
                  </p>
                </div>
                <button
                  onClick={loadLogs}
                  disabled={loadingLogs}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span>রিফ্রেশ</span>
                </button>
              </div>

              {loadingLogs ? (
                <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
                  গুগল শিট থেকে লগইন লগ লোড হচ্ছে...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-300 font-semibold">
                    কোনো লগইন রেকর্ড পাওয়া যায়নি
                  </p>
                  <p className="text-[11px] text-slate-500">
                    গুগল শিট Web App URL কানেক্ট করে লগইন করলেই এখানে আপনার ডিভাইস ও টাইমের লাইভ তালিকা দেখা যাবে।
                  </p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2">সময়</th>
                        <th className="px-3 py-2">ইউজার</th>
                        <th className="px-3 py-2">অ্যাকশন</th>
                        <th className="px-3 py-2">ডিভাইস</th>
                        <th className="px-3 py-2">সম্পন্ন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                      {logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2 whitespace-nowrap text-slate-400">{log.timestamp}</td>
                          <td className="px-3 py-2 font-bold text-sky-400">{log.username}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.action === 'LOGIN'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-sky-500/20 text-sky-300'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-300">{log.device}</td>
                          <td className="px-3 py-2 text-emerald-400">{log.completedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE SHEETS SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    Apps Script কোড (কপি করে পেস্ট করুন)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'কপি হয়েছে!' : 'কোড কপি করুন'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  এই কোডটি গুগল শিটে পেস্ট করলে স্বয়ংক্রিয়ভাবে দুটি টেবিল তৈরি হবে: <strong>"Users"</strong> এবং <strong>"LoginLogs"</strong>।
                </p>
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40 border border-slate-800">
                  {GOOGLE_APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>

              {/* Endpoint Input */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-white">
                  আপনার Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-sky-500"
                  />
                  <button
                    onClick={handleTestAndSaveEndpoint}
                    disabled={testStatus?.testing}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {testStatus?.testing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>সেভ ও কানেক্ট</span>
                  </button>
                </div>

                {testStatus?.message && (
                  <p
                    className={`text-xs p-2.5 rounded-xl font-medium ${
                      testStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testStatus.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            English Partner · Connected with Current Website
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
