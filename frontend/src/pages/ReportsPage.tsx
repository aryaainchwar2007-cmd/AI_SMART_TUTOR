import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, AcademicReport } from '../types';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [report, setReport] = useState<AcademicReport | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return;

    setGenerating(true);
    setError(null);

    const payload = {
      include_cleaning: true,
      include_eda: true,
      include_visualizations: true,
      include_statistics: true,
      include_models: true,
      notes: studentNotes || undefined,
    };

    try {
      const rep = await api.post<AcademicReport>(
        `/datasets/${selectedDatasetId}/reports`,
        payload
      );
      setReport(rep);
    } catch (err: any) {
      setError(err.message || 'Failed to generate academic lab report.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Academic Laboratory Reports Generator</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Synthesize your dataset preprocessing, statistical findings, visualizations, and model evaluations into a structured academic report.
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

      {/* Generation Form */}
      <form onSubmit={handleGenerateReport} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Student Project Summary / Conclusion Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={studentNotes}
            onChange={(e) => setStudentNotes(e.target.value)}
            placeholder="Document key analytical findings, domain context, hypothesis test decisions, and next steps for your university submission..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={generating || !selectedDatasetId}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition cursor-pointer"
        >
          <FileText className="h-4 w-4" />
          <span>{generating ? 'Assembling Academic Report...' : 'Generate Lab Report'}</span>
        </button>
      </form>

      {/* Generated Report Display */}
      {report && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Official Lab Report
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Data Science Exploration Report: {report.dataset_name}
              </h3>
              <p className="text-xs text-slate-500">
                Student: {report.student_email} • Generated: {report.generated_at}
              </p>
            </div>

            <a
              href={`/api/v1/reports/${report.report_id}/download`}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON Report</span>
            </a>
          </div>

          {/* Section 1: Dataset Overview */}
          {report.sections.dataset_overview && (
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                <span>1. Dataset Architecture & Dimensions</span>
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Row Count</span>
                  <span className="font-bold text-slate-800">{report.sections.dataset_overview.rows}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Column Count</span>
                  <span className="font-bold text-slate-800">{report.sections.dataset_overview.columns}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Original Filename</span>
                  <span className="font-bold text-slate-800">{report.sections.dataset_overview.filename}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Machine Learning Models */}
          {report.sections.machine_learning_models && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <span className="h-2 w-2 bg-indigo-600 rounded-full"></span>
                <span>2. Supervised Machine Learning Evaluation</span>
              </h4>
              <div className="space-y-2 text-xs">
                {report.sections.machine_learning_models.map((m: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between font-bold text-slate-800 capitalize mb-1">
                      <span>{m.algorithm.replace('_', ' ')} ({m.task_type})</span>
                      <span className="text-slate-500 text-[11px] font-normal">Target: {m.target_column}</span>
                    </div>
                    <pre className="bg-white p-2.5 rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-mono text-slate-700">
                      {JSON.stringify(m.metrics, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Academic Conclusions & Limitations */}
          {report.sections.academic_conclusions && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <span className="h-2 w-2 bg-emerald-600 rounded-full"></span>
                <span>3. Academic Conclusions & Limitations</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {report.sections.academic_conclusions.computed_facts_vs_inferences}
              </p>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Methodological Limitations:</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {report.sections.academic_conclusions.limitations.map((lim: string, idx: number) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
