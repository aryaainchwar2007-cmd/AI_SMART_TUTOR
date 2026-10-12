import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BarChart3,
  BrainCircuit,
  Bot,
  ShieldCheck,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">AI Smart Tutor</span>
              <span className="text-xs text-slate-500 block">Data Exploration & Visualization Lab</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 mx-auto mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>University Mini-Project • B.Tech Computer Engineering</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight mb-6">
          Hands-On Data Science & Machine Learning with an{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            AI-Powered Smart Tutor
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Master Python, Pandas, NumPy, Matplotlib, Seaborn, exploratory data analysis, statistics, and scikit-learn models through interactive dataset experiments grounded in real computed facts.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 px-7 py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition"
          >
            <span>Launch Laboratory</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto text-base font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-7 py-3.5 rounded-xl transition"
          >
            Student Login
          </Link>
        </div>

        {/* Workflow Progression Strip */}
        <div className="mt-16 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-left">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Curriculum Workflow
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-medium text-slate-700 text-center">
            {['1. Upload & Inspect', '2. Clean & Impute', '3. Explore & Stats', '4. Matplotlib Plots', '5. Scikit-Learn ML', '6. AI Viva & Quiz', '7. Academic Report'].map((step, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">Real Python Backend</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              No simulated numbers. All missing value imputations, hypothesis tests, and charts run live in Python using FastAPI, Pandas, and SciPy.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">Leakage-Free ML Lab</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Build scikit-learn Pipelines and ColumnTransformers with train/test splits, feature importance extraction, and target leakage detection.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">Grounded AI Tutor</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ask questions across Guided, Direct, and Quiz modes. Answers are strictly conditioned on your computed dataset statistics without hallucination.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        © 2026 AI Smart Tutor — Data Exploration and Visualization Laboratory. Built for B.Tech Computer Engineering students.
      </footer>
    </div>
  );
};
