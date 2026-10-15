import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Conversation, Message, Dataset } from '../types';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  GraduationCap,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Code2,
  Key,
  Zap,
  X,
  Check,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ProviderStatus {
  provider: string;
  model: string;
  has_api_key: boolean;
  masked_key: string;
  is_live: boolean;
}

export const AITutorPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [mode, setMode] = useState<'guided' | 'direct' | 'quiz'>('guided');
  const [inputContent, setInputContent] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gemini Provider State
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations, datasets, and provider status on mount
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [convData, dsData, pStatus] = await Promise.all([
          api.get<Conversation[]>('/conversations'),
          api.get<Dataset[]>('/datasets'),
          api.get<ProviderStatus>('/conversations/provider/status').catch(() => null),
        ]);
        setConversations(convData);
        setDatasets(dsData);
        if (pStatus) {
          setProviderStatus(pStatus);
          setSelectedModel(pStatus.model || 'gemini-1.5-flash');
        }
        if (convData.length > 0) {
          setActiveConvId(convData[0].id);
        } else {
          // Auto create initial conversation
          handleNewConversation();
        }
        if (dsData.length > 0) {
          setSelectedDatasetId(dsData[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations.');
      }
    };
    fetchInitial();
  }, []);

  const handleSaveProviderConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingConfig(true);
    setConfigError(null);
    setConfigSuccess(null);
    try {
      const res = await api.post<any>('/conversations/provider/configure', {
        api_key: apiKeyInput.trim(),
        model: selectedModel,
        provider: 'gemini',
      });
      setConfigSuccess('Successfully connected to Google Gemini!');
      setProviderStatus({
        provider: res.provider,
        model: res.model,
        has_api_key: true,
        masked_key: `${apiKeyInput.trim().slice(0, 4)}...${apiKeyInput.trim().slice(-4)}`,
        is_live: true,
      });
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess(null);
        setApiKeyInput('');
      }, 1200);
    } catch (err: any) {
      setConfigError(err.message || 'Failed to configure Gemini provider.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const msgs = await api.get<Message[]>(`/conversations/${activeConvId}/messages`);
        setMessages(msgs);
      } catch (err: any) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [activeConvId]);

  const handleNewConversation = async () => {
    try {
      const conv = await api.post<Conversation>('/conversations', {
        title: `Study Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
      setConversations([conv, ...conversations]);
      setActiveConvId(conv.id);
      setMessages([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create conversation');
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this study session?')) return;

    try {
      await api.delete(`/conversations/${id}`);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeConvId || sending) return;

    const userText = inputContent.trim();
    setInputContent('');
    setSending(true);
    setError(null);

    // Optimistically render user message
    const tempUserMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConvId,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const assistantMsg = await api.post<Message>(
        `/conversations/${activeConvId}/messages`,
        {
          content: userText,
          mode: mode,
          dataset_id: selectedDatasetId || undefined,
        }
      );
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to receive tutor response.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4 font-sans">
      {/* Left Sidebar: Conversations & Grounding Controls */}
      <div className="w-full md:w-72 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Study Sessions</span>
          <button
            onClick={handleNewConversation}
            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
            title="New Conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Grounding Context Selector */}
        <div className="py-3 border-b border-slate-200 space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-500">Dataset Grounding Context</label>
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          >
            <option value="">-- No Dataset (General Q&A) --</option>
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.row_count} rows)
              </option>
            ))}
          </select>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition ${
                activeConvId === c.id
                  ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="truncate pr-2">
                <p className="truncate">{c.title}</p>
                <p className="text-[10px] text-slate-400 font-normal">
                  {new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(c.id, e)}
                className="text-slate-400 hover:text-red-500 p-1 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs overflow-hidden">
        {/* Chat Header & Mode Ribbon */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">AI Smart Tutor</h3>
              <p className="text-[11px] text-slate-500">
                University Data Science & Machine Learning Teaching Assistant
              </p>
            </div>
          </div>

          {/* Provider Status & Teaching Modes Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {providerStatus?.is_live ? (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-100 shadow-xs transition"
                title="Google Gemini AI is active! Click to view or change settings."
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gemini Live ({providerStatus.model})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowConfigModal(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 rounded-xl text-xs font-semibold shadow-xs transition"
                title="Currently in static offline mode. Click to connect your free Gemini API key!"
              >
                <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                <span>Connect Gemini API Key</span>
              </button>
            )}

            <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs">
              {[
                { id: 'guided', label: 'Guided Socratic', icon: BookOpen },
                { id: 'direct', label: 'Direct Code & Math', icon: Code2 },
                { id: 'quiz', label: 'Viva & Quiz Mode', icon: GraduationCap },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    mode === m.id
                      ? 'bg-white text-blue-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 max-w-md mx-auto py-12">
              <GraduationCap className="h-12 w-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">Start Your Study Session</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Ask questions about your uploaded dataset, debug Matplotlib code, understand p-values, or request viva practice questions.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 w-full text-left text-xs">
                <button
                  onClick={() => setInputContent('Can you generate 3 viva questions on preventing data leakage?')}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:border-blue-500 transition"
                >
                  "Viva questions on data leakage"
                </button>
                <button
                  onClick={() => setInputContent('How should I interpret a high Pearson correlation versus causation?')}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:border-blue-500 transition"
                >
                  "Correlation vs causation explained"
                </button>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role !== 'user' && (
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                <span
                  className={`block text-[9px] mt-1.5 ${
                    m.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-2">
                <div className="animate-bounce h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                <div className="animate-bounce delay-100 h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                <div className="animate-bounce delay-200 h-1.5 w-1.5 bg-blue-600 rounded-full"></div>
                <span className="text-[11px] text-slate-500 ml-1">Analyzing and drafting tutor guidance...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center space-x-3">
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder={`Ask a question in ${mode} mode...`}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={sending || !inputContent.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl shadow-sm transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Google Gemini Live AI</h3>
                  <p className="text-xs text-slate-500">Enable dynamic, generative tutoring</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
              <p className="font-semibold flex items-center text-blue-950">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-600 shrink-0" />
                How to make your chatbot dynamic:
              </p>
              <p className="text-slate-600 leading-relaxed">
                Connect your <b>free Google Gemini API key</b> to unlock real-time code explanations, Socratic hints, and interactive viva questions tailored directly to your datasets.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-700 font-bold hover:underline pt-1 text-[11px]"
              >
                <span>Get a free key from Google AI Studio</span>
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>

            {configSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{configSuccess}</span>
              </div>
            )}

            {configError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{configError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProviderConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder={
                    providerStatus?.has_api_key
                      ? `Active: ${providerStatus.masked_key}`
                      : 'Paste AIzaSy... key here'
                  }
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Gemini Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Recommended)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multi-turn)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingConfig || !apiKeyInput.trim()}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{savingConfig ? 'Connecting...' : 'Activate Live Gemini'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
