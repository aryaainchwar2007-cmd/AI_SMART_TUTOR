import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, DatasetPreview, DatasetSummary } from '../types';
import {
  Database,
  Upload,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const DatasetExplorerPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DatasetPreview | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load datasets on mount
  const fetchDatasets = async () => {
    try {
      const data = await api.get<Dataset[]>('/datasets');
      setDatasets(data);
      if (data.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch datasets.');
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // Fetch preview & summary when selected dataset or page changes
  useEffect(() => {
    if (!selectedDatasetId) {
      setPreview(null);
      setSummary(null);
      return;
    }

    const loadDatasetDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prevData, summaryData] = await Promise.all([
          api.get<DatasetPreview>(`/datasets/${selectedDatasetId}/preview?page=${page}&page_size=10`),
          api.get<DatasetSummary>(`/datasets/${selectedDatasetId}/summary`),
        ]);
        setPreview(prevData);
        setSummary(summaryData);
      } catch (err: any) {
        setError(err.message || 'Failed to inspect dataset details.');
      } finally {
        setLoading(false);
      }
    };

    loadDatasetDetails();
  }, [selectedDatasetId, page]);

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const newDataset = await api.post<Dataset>('/datasets', formData);
      setSuccessMsg(`Successfully uploaded dataset "${newDataset.name}"!`);
      await fetchDatasets();
      setSelectedDatasetId(newDataset.id);
      setPage(1);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete handler
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/datasets/${id}`);
      setSuccessMsg(`Dataset "${name}" was deleted.`);
      const remaining = datasets.filter((d) => d.id !== id);
      setDatasets(remaining);
      setSelectedDatasetId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete dataset.');
    }
  };

  const selectedDs = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <div className="space-y-6">
      {/* Header and Upload Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Dataset Explorer & Inspector</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV or JSON files to validate row structures, datatypes, missing values, and outliers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition">
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Processing File...' : 'Upload CSV / JSON'}</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-700 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dataset Selection Tabs */}
      {datasets.length > 0 ? (
        <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
          {datasets.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDatasetId(d.id);
                setPage(1);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedDatasetId === d.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>{d.name}</span>
              <span className="opacity-75 text-[10px]">({d.row_count} rows)</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
          <Database className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Datasets Available</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Upload your lab dataset (CSV or JSON format) using the button above to begin exploratory data analysis.
          </p>
        </div>
      )}

      {/* Dataset Details & Overview Grid */}
      {selectedDs && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Total Rows</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.row_count}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Columns</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.column_count}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 uppercase font-semibold">Duplicate Rows</span>
            <p className={`text-xl font-bold mt-1 ${summary.duplicate_rows > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.duplicate_rows}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Actions</span>
              <p className="text-xs text-slate-600 mt-1 truncate">{selectedDs.original_filename}</p>
            </div>
            <button
              onClick={() => handleDelete(selectedDs.id, selectedDs.name)}
              title="Delete dataset"
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Column Schema & Missing Values Table */}
      {selectedDs && summary && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Column Metadata & Missing Values</h3>
            <span className="text-xs text-slate-500">{summary.column_count} features detected</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Column Name</th>
                  <th className="px-6 py-3">Data Type</th>
                  <th className="px-6 py-3">Missing Values</th>
                  <th className="px-6 py-3">Outliers (IQR)</th>
                  <th className="px-6 py-3">Sample Values / Distinct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(selectedDs.column_metadata).map(([colName, meta]) => {
                  const missingCount = summary.missing_values[colName] ?? 0;
                  const outlierCount = summary.potential_outliers[colName] ?? 0;
                  return (
                    <tr key={colName} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-3 font-semibold text-slate-900">{colName}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {meta.dtype}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {missingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[11px]">
                            {missingCount} missing ({((missingCount / selectedDs.row_count) * 100).toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">0 (Complete)</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {meta.is_numeric ? (
                          outlierCount > 0 ? (
                            <span className="text-amber-700 font-medium">{outlierCount} flagged</span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )
                        ) : (
                          <span className="text-slate-400">N/A (Categorical)</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {meta.sample_values ? meta.sample_values.join(', ') : `${meta.unique_count} distinct`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginated Dataset Records Table Preview */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span>Interactive Dataset Preview</span>
            </h3>
            <span className="text-xs text-slate-500">
              Showing rows {(preview.page - 1) * preview.page_size + 1} -{' '}
              {Math.min(preview.page * preview.page_size, preview.total_rows)} of {preview.total_rows}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-slate-400">#</th>
                  {preview.columns.map((c) => (
                    <th key={c} className="px-4 py-3 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {preview.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-400">
                      {(preview.page - 1) * preview.page_size + idx + 1}
                    </td>
                    {preview.columns.map((c) => (
                      <td key={c} className="px-4 py-2.5 whitespace-nowrap text-slate-700">
                        {row[c] !== null && row[c] !== undefined ? String(row[c]) : (
                          <span className="text-amber-500 italic">null</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {preview.page} of {Math.ceil(preview.total_rows / preview.page_size)}
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={preview.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={preview.page >= Math.ceil(preview.total_rows / preview.page_size)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-white transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
