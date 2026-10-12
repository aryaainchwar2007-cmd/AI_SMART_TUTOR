import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, CleanDataRequest, CleanDataResponse, DatasetSummary } from '../types';
import {
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';

export const CleaningLabPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [cleaning, setCleaning] = useState<boolean>(false);
  const [result, setResult] = useState<CleanDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form Configuration State
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(true);
  const [numericStrategy, setNumericStrategy] = useState<'none' | 'mean' | 'median' | 'drop'>('median');
  const [categoricalStrategy, setCategoricalStrategy] = useState<'none' | 'mode' | 'drop'>('mode');
  const [removeOutliers, setRemoveOutliers] = useState<boolean>(false);
  const [outlierMethod, setOutlierMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [saveAsNew, setSaveAsNew] = useState<boolean>(true);
  const [newDatasetName, setNewDatasetName] = useState<string>('');

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await api.get<Dataset[]>('/datasets');
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDatasetId(data[0].id);
          setNewDatasetName(`${data[0].name} (Cleaned)`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch datasets');
      }
    };
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const loadSummary = async () => {
      setLoadingSummary(true);
      setError(null);
      setResult(null);
      try {
        const s = await api.get<DatasetSummary>(`/datasets/${selectedDatasetId}/summary`);
        setSummary(s);
        setNewDatasetName(`${s.name} (Cleaned)`);
      } catch (err: any) {
        setError(err.message || 'Failed to load dataset summary');
      } finally {
        setLoadingSummary(false);
      }
    };
    loadSummary();
  }, [selectedDatasetId]);

  const handleClean = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return;

    if (!saveAsNew && !window.confirm('Cleaning in-place will modify the original dataset values. Proceed?')) {
      return;
    }

    setCleaning(true);
    setError(null);
    setResult(null);

    const payload: CleanDataRequest = {
      drop_duplicates: dropDuplicates,
      missing_numeric_strategy: numericStrategy,
      missing_categorical_strategy: categoricalStrategy,
      remove_outliers: removeOutliers,
      outlier_method: outlierMethod,
      save_as_new: saveAsNew,
      new_dataset_name: saveAsNew ? newDatasetName : undefined,
    };

    try {
      const res = await api.post<CleanDataResponse>(`/datasets/${selectedDatasetId}/clean`, payload);
      setResult(res);
      // Refresh datasets list if saved as new
      if (saveAsNew) {
        const updatedList = await api.get<Dataset[]>('/datasets');
        setDatasets(updatedList);
      }
    } catch (err: any) {
      setError(err.message || 'Data cleaning operation failed.');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span>Data Cleaning & Preprocessing Laboratory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Detect missing values, handle duplicates, filter distribution outliers, and track cleaning records.
          </p>
        </div>

        {/* Dataset Selector */}
        {datasets.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Dataset:</label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.row_count} rows)
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

      {/* Dataset Health Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Missing Cells</span>
            <p className="text-xl font-bold mt-1 text-slate-900">
              {Object.values(summary.missing_values).reduce((a, b) => a + b, 0)} total
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Across {Object.values(summary.missing_values).filter((v) => v > 0).length} columns
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Duplicate Rows</span>
            <p className={`text-xl font-bold mt-1 ${summary.duplicate_rows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.duplicate_rows}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Identical duplicate observations</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-semibold uppercase">Potential Outliers</span>
            <p className="text-xl font-bold mt-1 text-slate-900">
              {Object.values(summary.potential_outliers).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Points beyond 1.5 × IQR whiskers</p>
          </div>
        </div>
      )}

      {/* Configuration Form & Execution */}
      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleClean} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>Configure Cleaning Operations</span>
          </h3>

          {/* Deduplication */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Duplicate Rows Removal</p>
              <p className="text-xs text-slate-500">Drop redundant observations while preserving the first occurrence</p>
            </div>
            <input
              type="checkbox"
              checked={dropDuplicates}
              onChange={(e) => setDropDuplicates(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300"
            />
          </div>

          {/* Numeric Imputation Strategy */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Numeric Missing Value Strategy
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'median', label: 'Median Impute', desc: 'Robust to outliers' },
                { id: 'mean', label: 'Mean Impute', desc: 'Standard average' },
                { id: 'drop', label: 'Drop Rows', desc: 'Remove incomplete rows' },
                { id: 'none', label: 'Do Nothing', desc: 'Preserve NaN' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setNumericStrategy(opt.id as any)}
                  className={`p-3 text-left rounded-xl border text-xs transition ${
                    numericStrategy === opt.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p>{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Categorical Imputation Strategy */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Categorical Missing Value Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'mode', label: 'Mode (Most Frequent)', desc: 'Top category' },
                { id: 'drop', label: 'Drop Rows', desc: 'Remove incomplete' },
                { id: 'none', label: 'Do Nothing', desc: 'Preserve nulls' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setCategoricalStrategy(opt.id as any)}
                  className={`p-3 text-left rounded-xl border text-xs transition ${
                    categoricalStrategy === opt.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p>{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Outlier Filtering */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Filter Distribution Outliers</p>
                <p className="text-xs text-slate-500">Remove statistical anomalies beyond standard dispersion thresholds</p>
              </div>
              <input
                type="checkbox"
                checked={removeOutliers}
                onChange={(e) => setRemoveOutliers(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>

            {removeOutliers && (
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-600">Method:</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="outlierMethod"
                    value="iqr"
                    checked={outlierMethod === 'iqr'}
                    onChange={() => setOutlierMethod('iqr')}
                  />
                  <span>1.5 × IQR Rule (Interquartile Range)</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="outlierMethod"
                    value="zscore"
                    checked={outlierMethod === 'zscore'}
                    onChange={() => setOutlierMethod('zscore')}
                  />
                  <span>Z-Score (|z| &gt; 3.0)</span>
                </label>
              </div>
            )}
          </div>

          {/* Preservation Mode */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-950">Preserve Original Dataset</p>
                <p className="text-xs text-blue-700">Recommended: Save cleaned output as a new dataset</p>
              </div>
              <input
                type="checkbox"
                checked={saveAsNew}
                onChange={(e) => setSaveAsNew(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
            </div>

            {saveAsNew && (
              <input
                type="text"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                placeholder="Cleaned Dataset Name"
                className="w-full px-3 py-2 bg-white rounded-lg border border-blue-300 text-xs text-slate-800 focus:outline-none"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={cleaning || !selectedDatasetId}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{cleaning ? 'Executing Cleaning Operations...' : 'Run Cleaning Pipeline'}</span>
          </button>
        </form>

        {/* Before and After Summary Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Before & After Results</span>
            </h3>

            {result ? (
              <div className="mt-4 space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>{result.summary_message}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Original Row Count:</span>
                    <span className="font-semibold text-slate-800">{result.original_row_count}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Cleaned Row Count:</span>
                    <span className="font-semibold text-slate-800">{result.cleaned_row_count}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Duplicates Removed:</span>
                    <span className="font-semibold text-amber-600">{result.duplicates_removed}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Outliers Filtered:</span>
                    <span className="font-semibold text-amber-600">{result.outliers_removed}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Columns Imputed:</span>
                    <span className="font-semibold text-blue-600">{Object.keys(result.missing_imputed).length}</span>
                  </div>
                </div>

                {Object.keys(result.missing_imputed).length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Imputation Details</p>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                      {Object.entries(result.missing_imputed).map(([col, meta]: any) => (
                        <div key={col} className="flex justify-between text-slate-600">
                          <span className="font-medium text-slate-800">{col}</span>
                          <span>{meta.strategy} ({meta.value ?? `${meta.dropped_rows} dropped`})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Configure your pipeline on the left and click "Run Cleaning Pipeline" to view before-and-after metrics.
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 text-xs text-slate-400">
            All operations are executed server-side in Python using Pandas and recorded in the audit log.
          </div>
        </div>
      </div>
    </div>
  );
};
