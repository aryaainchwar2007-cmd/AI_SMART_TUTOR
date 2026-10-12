import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Dataset, MLModelRecord } from '../types';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Send,
  Zap,
  Layers,
  Sparkles,
} from 'lucide-react';

export const MLLabPage: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [models, setModels] = useState<MLModelRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [training, setTraining] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<MLModelRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Training form configuration
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [taskType, setTaskType] = useState<'classification' | 'regression'>('classification');
  const [algorithm, setAlgorithm] = useState<'random_forest' | 'linear_baseline'>('random_forest');
  const [testSize, setTestSize] = useState<number>(0.2);

  // Prediction test form state
  const [predictInputs, setPredictInputs] = useState<Record<string, any>>({});
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState<boolean>(false);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [dsData, modelData] = await Promise.all([
          api.get<Dataset[]>('/datasets'),
          api.get<MLModelRecord[]>('/models'),
        ]);
        setDatasets(dsData);
        setModels(modelData);
        if (dsData.length > 0) {
          setSelectedDatasetId(dsData[0].id);
        }
        if (modelData.length > 0) {
          setSelectedModel(modelData[0]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize ML lab data');
      }
    };
    fetchInitial();
  }, []);

  const selectedDs = datasets.find((d) => d.id === selectedDatasetId);
  const columns = selectedDs ? Object.keys(selectedDs.column_metadata) : [];

  // Initialize target and features when dataset changes
  useEffect(() => {
    if (columns.length > 0) {
      const lastCol = columns[columns.length - 1];
      setTargetColumn(lastCol);
      setSelectedFeatures(columns.slice(0, columns.length - 1));
    }
  }, [selectedDatasetId]);

  const toggleFeature = (col: string) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId || !targetColumn || selectedFeatures.length === 0) return;

    setTraining(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      target_column: targetColumn,
      feature_columns: selectedFeatures,
      task_type: taskType,
      algorithm: algorithm,
      test_size: testSize,
      random_state: 42,
    };

    try {
      const trained = await api.post<MLModelRecord>(
        `/datasets/${selectedDatasetId}/models/train`,
        payload
      );
      setSuccessMsg(`Successfully trained model (${trained.algorithm})!`);
      setSelectedModel(trained);
      const updatedModels = await api.get<MLModelRecord[]>('/models');
      setModels(updatedModels);
    } catch (err: any) {
      setError(err.message || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    setPredicting(true);
    setError(null);
    try {
      const res = await api.post<any>(`/models/${selectedModel.id}/predict`, {
        inputs: [predictInputs],
      });
      setPredictionResult(res.predictions[0]);
    } catch (err: any) {
      setError(err.message || 'Prediction inference failed.');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
            <span>Supervised Machine Learning Laboratory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Train scikit-learn Pipelines with ColumnTransformer, prevent data leakage, inspect evaluation metrics, and test predictions.
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

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3 text-emerald-700 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Training Form & Results */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Model Configuration Form */}
        <form onSubmit={handleTrain} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span>Configure Training Pipeline</span>
          </h3>

          {/* Task Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Machine Learning Task</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('classification')}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  taskType === 'classification'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Classification
              </button>
              <button
                type="button"
                onClick={() => setTaskType('regression')}
                className={`py-2 text-xs font-semibold rounded-xl border transition ${
                  taskType === 'regression'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Regression
              </button>
            </div>
          </div>

          {/* Target Column */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Variable (y)</label>
            <select
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Feature Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Features (X) ({selectedFeatures.length} selected)
            </label>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
              {columns
                .filter((c) => c !== targetColumn)
                .map((col) => (
                  <label key={col} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer p-1 rounded hover:bg-white">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(col)}
                      onChange={() => toggleFeature(col)}
                      className="rounded text-indigo-600 border-slate-300"
                    />
                    <span>{col}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Algorithm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none"
            >
              <option value="random_forest">Random Forest (100 Trees)</option>
              <option value="linear_baseline">
                {taskType === 'classification' ? 'Logistic Regression (Baseline)' : 'Linear Regression (Baseline)'}
              </option>
            </select>
          </div>

          {/* Test Split Ratio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Test Split: {Math.round(testSize * 100)}% (Train: {Math.round((1 - testSize) * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <button
            type="submit"
            disabled={training || selectedFeatures.length === 0}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>{training ? 'Training Pipeline in Python...' : 'Train Model Pipeline'}</span>
          </button>
        </form>

        {/* Model Evaluation & Performance Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedModel ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    {selectedModel.task_type}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1 capitalize">
                    {selectedModel.algorithm.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-slate-500">Target variable: {selectedModel.target_column}</p>
                </div>
                <span className="text-xs text-slate-400">
                  Trained: {new Date(selectedModel.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Target Leakage Warning Notice */}
              {selectedModel.leakage_warnings && selectedModel.leakage_warnings.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center space-x-1 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Potential Target Leakage Detected:</span>
                  </div>
                  {selectedModel.leakage_warnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {/* Evaluation Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {selectedModel.task_type === 'classification' ? (
                  <>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Accuracy</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {((selectedModel.metrics.accuracy ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Precision</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedModel.metrics.precision ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">Recall</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedModel.metrics.recall ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">F1-Score</span>
                      <p className="text-xl font-bold text-indigo-600 mt-0.5">
                        {selectedModel.metrics.f1_score ?? 0}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">R² Score</span>
                      <p className="text-xl font-bold text-indigo-600 mt-0.5">
                        {selectedModel.metrics.r2_score ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">MAE</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedModel.metrics.mae ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">RMSE</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedModel.metrics.rmse ?? 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold uppercase text-slate-500">MSE</span>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">
                        {selectedModel.metrics.mse ?? 0}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Feature Importances (if present) */}
              {selectedModel.feature_importances && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Feature Importances (Gini Impurity)
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(selectedModel.feature_importances).map(([fname, imp]) => (
                      <div key={fname} className="text-xs">
                        <div className="flex justify-between text-slate-600 mb-0.5">
                          <span className="font-medium text-slate-800">{fname}</span>
                          <span>{(imp * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, imp * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Prediction Sandbox */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>Real-Time Model Inference Testing</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Input test values to compute instant predictions with the saved pipeline.
                </p>

                <form onSubmit={handlePredict} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedModel.feature_columns.map((f) => (
                    <div key={f}>
                      <label className="block text-[11px] font-semibold text-slate-700 truncate mb-1">
                        {f}
                      </label>
                      <input
                        type="text"
                        placeholder="Value"
                        value={predictInputs[f] ?? ''}
                        onChange={(e) =>
                          setPredictInputs({ ...predictInputs, [f]: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}

                  <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-2">
                    <button
                      type="submit"
                      disabled={predicting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                    >
                      {predicting ? 'Predicting...' : 'Run Inference'}
                    </button>

                    {predictionResult !== null && (
                      <div className="px-4 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs">
                        Prediction Result: {String(predictionResult)}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white p-16 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              <BrainCircuit className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              No model selected. Train a model on the left to inspect metrics and test predictions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
