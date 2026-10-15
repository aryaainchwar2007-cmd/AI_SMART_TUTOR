import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import {
  Database,
  BrainCircuit,
  Bot,
  Activity,
  Plus,
  ArrowRight,
  Sparkles,
  BarChart3,
  CheckCircle,
  Clock,
  Code2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.get<DashboardStats>('/progress/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold tracking-wide uppercase inline-block mb-3">
            Academic Laboratory Workspace
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">Student Learning Dashboard</h1>
          <p className="text-blue-100 text-sm mt-2 leading-relaxed">
            Explore datasets, clean missing data, run hypothesis tests, train leakage-free scikit-learn models, and consult your grounded AI Tutor.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/datasets"
              className="inline-flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-xl text-sm shadow hover:bg-blue-50 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Dataset</span>
            </Link>
            <Link
              to="/learning"
              className="inline-flex items-center space-x-2 bg-indigo-600/80 hover:bg-indigo-600 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Code2 className="h-4 w-4" />
              <span>Learn Python Code</span>
            </Link>
            <Link
              to="/tutor"
              className="inline-flex items-center space-x-2 bg-blue-600/60 hover:bg-blue-600 border border-white/20 text-white font-semibold px-4 py-2 rounded-xl text-sm transition"
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI Tutor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">My Datasets</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.dataset_count ?? 0}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Trained Models</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.model_count ?? 0}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Analysis Runs</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.analysis_count ?? 0}</h3>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tutor Sessions</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.conversation_count ?? 0}</h3>
          </div>
        </div>
      </div>

      {/* Quick Launch Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/cleaning"
          className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500 hover:shadow-md transition"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1 flex items-center justify-between">
            <span>Data Cleaning Lab</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Perform median/mean imputation, remove duplicate observations, and filter distribution outliers.
          </p>
        </Link>

        <Link
          to="/visualization"
          className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-500 hover:shadow-md transition"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1 flex items-center justify-between">
            <span>Visualization Lab</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generate publication-grade Matplotlib and Seaborn charts: histograms, boxplots, heatmaps, and pairplots.
          </p>
        </Link>

        <Link
          to="/ml-lab"
          className="group p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1 flex items-center justify-between">
            <span>Machine Learning Lab</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Train Random Forest & Linear models with ColumnTransformer preprocessors and test-set generalization.
          </p>
        </Link>
      </div>

      {/* Recent Datasets & Trained Models Tables */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Datasets */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span>Recent Datasets</span>
            </h3>
            <Link to="/datasets" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          {stats?.recent_datasets && stats.recent_datasets.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_datasets.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{d.name}</p>
                    <p className="text-slate-500">
                      {d.rows} rows • {d.cols} columns
                    </p>
                  </div>
                  <Link
                    to={`/datasets`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Inspect →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No datasets uploaded yet. Upload your first CSV or JSON dataset.
            </div>
          )}
        </div>

        {/* Recent Models */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <BrainCircuit className="h-4 w-4 text-indigo-600" />
              <span>Recently Trained Models</span>
            </h3>
            <Link to="/ml-lab" className="text-xs font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>
          {stats?.recent_models && stats.recent_models.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_models.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100"
                >
                  <div>
                    <p className="font-semibold text-slate-800 capitalize">
                      {m.algorithm.replace('_', ' ')}
                    </p>
                    <p className="text-slate-500">
                      Target: <span className="font-medium text-slate-700">{m.target}</span> • {m.task_type}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Trained
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No models trained yet. Visit the Machine Learning Lab to train your first model.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
