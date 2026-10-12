import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, VisualizationRequest, VisualizationResponse } from '../types';
import {
  BarChart3,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

export const VisualizationLabPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [chartType, setChartType] = useState<VisualizationRequest['chart_type']>('histogram');
  const [xColumn, setXColumn] = useState<string>('');
  const [yColumn, setYColumn] = useState<string>('');
  const [hueColumn, setHueColumn] = useState<string>('');
  const [bins, setBins] = useState<number>(20);
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chartResponse, setChartResponse] = useState<VisualizationResponse | null>(null);
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

  const selectedDs = datasets.find((d) => d.id === selectedDatasetId);
  const columns = selectedDs ? Object.keys(selectedDs.column_metadata) : [];
  const numericColumns = selectedDs
    ? Object.entries(selectedDs.column_metadata)
        .filter(([_, meta]) => meta.is_numeric)
        .map(([name]) => name)
    : [];

  // Update default columns when dataset or chart type changes
  useEffect(() => {
    if (numericColumns.length > 0) {
      if (chartType === 'histogram' || chartType === 'box') {
        setXColumn(numericColumns[0]);
        setYColumn('');
      } else if (chartType === 'scatter' || chartType === 'line') {
        setXColumn(numericColumns[0]);
        setYColumn(numericColumns.length > 1 ? numericColumns[1] : numericColumns[0]);
      }
    } else if (columns.length > 0) {
      setXColumn(columns[0]);
    }
  }, [selectedDatasetId, chartType]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return;

    setLoading(true);
    setError(null);

    const payload: VisualizationRequest = {
      chart_type: chartType,
      x_column: xColumn || undefined,
      y_column: yColumn || undefined,
      hue_column: hueColumn || undefined,
      bins: chartType === 'histogram' ? bins : undefined,
      title: title || undefined,
    };

    try {
      const res = await api.post<VisualizationResponse>(
        `/datasets/${selectedDatasetId}/visualizations`,
        payload
      );
      setChartResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to render visualization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Matplotlib & Seaborn Visualization Lab</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate high-resolution backend charts with custom aesthetic themes and pedagogical interpretations.
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

      {/* Chart Selector Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { id: 'histogram', label: 'Histogram' },
          { id: 'bar', label: 'Countplot' },
          { id: 'box', label: 'Boxplot' },
          { id: 'scatter', label: 'Scatterplot' },
          { id: 'line', label: 'Line Chart' },
          { id: 'heatmap', label: 'Heatmap' },
          { id: 'pairplot', label: 'Pairplot Matrix' },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setChartType(c.id as any)}
            className={`p-3 rounded-xl border text-xs font-semibold transition ${
              chartType === c.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Controls & Display Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>Chart Parameters</span>
          </h3>

          {chartType !== 'heatmap' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">X-Axis Column</label>
              <select
                value={xColumn}
                onChange={(e) => setXColumn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
              >
                <option value="">-- Select Column --</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(chartType === 'scatter' || chartType === 'box' || chartType === 'line') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Y-Axis Column</label>
              <select
                value={yColumn}
                onChange={(e) => setYColumn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
              >
                <option value="">-- Optional / Secondary Column --</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(chartType === 'scatter' || chartType === 'pairplot') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hue / Category Grouping</label>
              <select
                value={hueColumn}
                onChange={(e) => setHueColumn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
              >
                <option value="">-- None --</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {chartType === 'histogram' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Histogram Bins: {bins}</label>
              <input
                type="range"
                min="5"
                max="60"
                value={bins}
                onChange={(e) => setBins(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Chart Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sepal Length Distribution"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedDatasetId}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{loading ? 'Rendering Plot in Python...' : 'Generate Visualization'}</span>
          </button>
        </form>

        {/* Chart Canvas & Educational Takeaways */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            {chartResponse ? (
              <div className="w-full flex flex-col items-center">
                <img
                  src={chartResponse.image_base64}
                  alt="Rendered Matplotlib Visualization"
                  className="rounded-xl max-w-full shadow-xs border border-slate-100"
                />
                <a
                  href={chartResponse.image_base64}
                  download={`chart_${chartType}.png`}
                  className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download High-Resolution PNG</span>
                </a>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-12">
                <ImageIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                Select chart parameters on the left and click "Generate Visualization".
              </div>
            )}
          </div>

          {/* Educational Insights Box */}
          {chartResponse && (
            <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 text-xs space-y-3">
              <div className="flex items-start space-x-2 text-blue-900">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <span className="font-bold">Pedagogical Concept Note:</span>
                  <p className="text-blue-800 mt-1 leading-relaxed">{chartResponse.educational_notes}</p>
                </div>
              </div>

              {chartResponse.suggested_questions.length > 0 && (
                <div className="pt-2 border-t border-blue-200/60">
                  <p className="font-bold text-blue-900 flex items-center space-x-1 mb-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                    <span>Inquiry Questions for Student Analysis:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {chartResponse.suggested_questions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
