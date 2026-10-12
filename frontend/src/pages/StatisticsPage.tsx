import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, StatisticsResponse } from '../types';
import {
  Calculator,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';

export const StatisticsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [stats, setStats] = useState<StatisticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hypothesis test inputs
  const [testType, setTestType] = useState<string>('shapiro_wilk');
  const [col1, setCol1] = useState<string>('');
  const [col2, setCol2] = useState<string>('');
  const [runningTest, setRunningTest] = useState<boolean>(false);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await api.get<Dataset[]>('/datasets');
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDatasetId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch datasets');
      }
    };
    fetchDatasets();
  }, []);

  const selectedDs = datasets.find((d) => d.id === selectedDatasetId);
  const columns = selectedDs ? Object.keys(selectedDs.column_metadata) : [];
  const numericColumns = selectedDs
    ? Object.entries(selectedDs.column_metadata)
        .filter(([_, meta]) => meta.is_numeric)
        .map(([name]) => name)
    : [];

  useEffect(() => {
    if (numericColumns.length > 0) {
      setCol1(numericColumns[0]);
      setCol2(numericColumns.length > 1 ? numericColumns[1] : numericColumns[0]);
    } else if (columns.length > 0) {
      setCol1(columns[0]);
      setCol2(columns.length > 1 ? columns[1] : columns[0]);
    }
  }, [selectedDatasetId]);

  // Load basic statistics
  const fetchStats = async (hypothesisTest?: string) => {
    if (!selectedDatasetId) return;

    if (hypothesisTest) {
      setRunningTest(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const payload: any = {};
    if (hypothesisTest) {
      payload.hypothesis_test = hypothesisTest;
      payload.col1 = col1;
      payload.col2 = col2;
    }

    try {
      const res = await api.post<StatisticsResponse>(
        `/datasets/${selectedDatasetId}/statistics`,
        payload
      );
      setStats(res);
    } catch (err: any) {
      setError(err.message || 'Failed to compute statistical analysis.');
    } finally {
      setLoading(false);
      setRunningTest(false);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      fetchStats();
    }
  }, [selectedDatasetId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Statistical Analysis & Hypothesis Testing</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compute parametric & non-parametric statistics, distribution shape metrics, and run hypothesis tests with SciPy.
          </p>
        </div>

        {/* Dataset Selector */}
        {datasets.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Dataset:</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Causation Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
        <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold">Fundamental Data Science Principle:</span>
          <p className="mt-0.5 leading-relaxed">
            Correlation quantifies linear association, but does <strong>not</strong> prove causation. Hidden confounding variables or reverse causality may exist.
          </p>
        </div>
      </div>

      {/* Descriptive Statistics Table */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Parametric & Non-Parametric Summary Statistics</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Feature</th>
                  <th className="px-4 py-3">Mean</th>
                  <th className="px-4 py-3">Median</th>
                  <th className="px-4 py-3">Std Dev</th>
                  <th className="px-4 py-3">Variance</th>
                  <th className="px-4 py-3">IQR (Q3-Q1)</th>
                  <th className="px-4 py-3">Min / Max</th>
                  <th className="px-4 py-3">Skewness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {Object.entries(stats.descriptive_statistics).map(([col, s]) => {
                  const skewInfo = stats.skewness_kurtosis[col];
                  return (
                    <tr key={col} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-slate-900 font-sans">{col}</td>
                      <td className="px-4 py-3 text-slate-700">{s.mean}</td>
                      <td className="px-4 py-3 text-slate-700">{s.median}</td>
                      <td className="px-4 py-3 text-slate-700">{s.std_dev}</td>
                      <td className="px-4 py-3 text-slate-700">{s.variance}</td>
                      <td className="px-4 py-3 text-slate-700">{s.iqr}</td>
                      <td className="px-4 py-3 text-slate-700">[{s.min}, {s.max}]</td>
                      <td className="px-4 py-3 font-sans">
                        <span className="text-[11px] text-slate-600">
                          {skewInfo ? `${skewInfo.skewness} (${skewInfo.skew_interpretation})` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hypothesis Testing Workbench */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
            <FileCheck2 className="h-4 w-4 text-blue-600" />
            <span>Interactive Hypothesis Testing Workbench</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formulate null (H₀) and alternative (H₁) hypotheses and evaluate p-values at significance level α = 0.05.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Hypothesis Test</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            >
              <option value="shapiro_wilk">Shapiro-Wilk (Normality)</option>
              <option value="two_sample_ttest">Welch's Two-Sample t-Test</option>
              <option value="pearson">Pearson Linear Correlation Test</option>
              <option value="chi_square">Chi-Square Test (Independence)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Variable 1</label>
            <select
              value={col1}
              onChange={(e) => setCol1(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {(testType === 'two_sample_ttest' || testType === 'pearson' || testType === 'chi_square') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Variable 2</label>
              <select
                value={col2}
                onChange={(e) => setCol2(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <button
              onClick={() => fetchStats(testType)}
              disabled={runningTest}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 rounded-xl text-xs shadow-sm transition"
            >
              {runningTest ? 'Computing Test...' : 'Run Hypothesis Test'}
            </button>
          </div>
        </div>

        {/* Hypothesis Test Result Card */}
        {stats?.hypothesis_test_result && (
          <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
              <span className="font-bold text-sm text-blue-900">
                {stats.hypothesis_test_result.test_name}
              </span>
              <span className="px-2.5 py-1 rounded-full font-bold bg-white text-blue-800 border border-blue-300">
                Decision: {stats.hypothesis_test_result.decision}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">p-Value</span>
                <span className="text-base font-bold text-slate-900">{stats.hypothesis_test_result.p_value}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Threshold: α = 0.05</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Null Hypothesis (H₀)</span>
                <span className="text-slate-700 leading-tight block mt-0.5">{stats.hypothesis_test_result.null_hypothesis}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Alternative (H₁)</span>
                <span className="text-slate-700 leading-tight block mt-0.5">{stats.hypothesis_test_result.alternative_hypothesis}</span>
              </div>
            </div>

            {stats.hypothesis_test_result.assumptions && (
              <p className="text-[11px] text-blue-800">
                <strong>Assumptions:</strong> {stats.hypothesis_test_result.assumptions}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
