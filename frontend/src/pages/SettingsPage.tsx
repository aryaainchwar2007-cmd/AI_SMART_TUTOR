import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Settings,
  Lock,
  Shield,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LogOut,
  Zap,
  Check,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Gemini Key settings state
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [savingKey, setSavingKey] = useState(false);
  const [providerStatus, setProviderStatus] = useState<any>(null);

  React.useEffect(() => {
    api.get<any>('/conversations/provider/status')
      .then((data) => {
        setProviderStatus(data);
        if (data.model) setGeminiModel(data.model);
      })
      .catch(() => null);
  }, []);

  const handleGeminiKeyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    setSavingKey(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post<any>('/conversations/provider/configure', {
        api_key: geminiKey.trim(),
        model: geminiModel,
        provider: 'gemini',
      });
      setSuccess('Google Gemini AI activated successfully! AI Tutor is now live.');
      setProviderStatus({
        provider: res.provider,
        model: res.model,
        has_api_key: true,
        masked_key: `${geminiKey.trim().slice(0, 4)}...${geminiKey.trim().slice(-4)}`,
        is_live: true,
      });
      setGeminiKey('');
    } catch (err: any) {
      setError(err.message || 'Failed to update Gemini settings.');
    } finally {
      setSavingKey(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setChanging(true);

    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setSuccess('Password changed successfully! Active sessions have been rotated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <span>Student Account Settings & Security</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your university laboratory profile credentials and review privacy policies.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-700 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-blue-600" />
          <span>Profile Information</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block uppercase">University Email</span>
            <span className="font-bold text-slate-900 text-sm block mt-0.5">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase">Role</span>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              {user?.role || 'student'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase">Enrolled On</span>
            <span className="text-slate-700 block mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase">Account Status</span>
            <span className="text-emerald-600 font-semibold block mt-0.5">Active & Verified</span>
          </div>
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
          <KeyRound className="h-4 w-4 text-blue-600" />
          <span>Security & Password Management (Argon2id)</span>
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={changing}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>{changing ? 'Updating Security Credentials...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* AI Tutor Provider Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" />
            <span>AI Tutor Provider & Google Gemini Integration</span>
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              providerStatus?.is_live
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {providerStatus?.is_live ? `Live (${providerStatus.model})` : 'Offline Mock Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The AI Tutor connects with Google Gemini to generate dynamic, Socratic explanations and customized code suggestions.
          You can get a free API key from{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-bold hover:underline inline-flex items-center"
          >
            <span>Google AI Studio</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
          .
        </p>

        <form onSubmit={handleGeminiKeyUpdate} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder={
                providerStatus?.has_api_key
                  ? `Active Key: ${providerStatus.masked_key}`
                  : 'Paste AIzaSy... key'
              }
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Model Selection</label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Recommended)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multi-turn)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={savingKey || !geminiKey.trim()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{savingKey ? 'Connecting...' : 'Save & Activate Gemini'}</span>
          </button>
        </form>
      </div>

      {/* Data Retention & Privacy Settings */}
      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center space-x-2">
          <Shield className="h-4 w-4 text-slate-700" />
          <span>Academic Data Retention & Privacy Notice</span>
        </h4>
        <p className="leading-relaxed">
          In accordance with the university computer engineering laboratory curriculum, student datasets and machine learning model artifacts are stored in private server directories outside the public web root.
        </p>
        <p className="leading-relaxed">
          Students retain strict ownership over their datasets. You may delete any dataset or conversation at any time from the explorer interface, which permanently purges the underlying disk storage and database records.
        </p>
      </div>
    </div>
  );
};
