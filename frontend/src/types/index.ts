export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface SessionResponse {
  authenticated: boolean;
  user: User;
}

export interface ColumnMetadata {
  dtype: string;
  null_count: number;
  unique_count: number;
  is_numeric: boolean;
  sample_values: (string | null)[];
}

export interface Dataset {
  id: string;
  owner_id: string;
  name: string;
  original_filename: string;
  file_format: string;
  file_size: number;
  row_count: number;
  column_count: number;
  column_metadata: Record<string, ColumnMetadata>;
  created_at: string;
  updated_at: string;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  page: number;
  page_size: number;
}

export interface NumericSummary {
  count: number;
  mean: number;
  std: number;
  min: number;
  q25: number;
  median: number;
  q75: number;
  max: number;
  iqr: number;
}

export interface CategoricalSummary {
  count: number;
  unique: number;
  top_values: Record<string, number>;
}

export interface DatasetSummary {
  id: string;
  name: string;
  row_count: number;
  column_count: number;
  duplicate_rows: number;
  missing_values: Record<string, number>;
  dtypes: Record<string, string>;
  numeric_summary: Record<string, NumericSummary>;
  categorical_summary: Record<string, CategoricalSummary>;
  potential_outliers: Record<string, number>;
}

export interface CleanDataRequest {
  drop_duplicates: boolean;
  missing_numeric_strategy: 'none' | 'mean' | 'median' | 'drop';
  missing_categorical_strategy: 'none' | 'mode' | 'drop';
  remove_outliers: boolean;
  outlier_method: 'iqr' | 'zscore';
  outlier_columns?: string[];
  save_as_new: boolean;
  new_dataset_name?: string;
}

export interface CleanDataResponse {
  original_row_count: number;
  cleaned_row_count: number;
  duplicates_removed: number;
  missing_imputed: Record<string, any>;
  outliers_removed: number;
  new_dataset_id?: string;
  summary_message: string;
}

export interface VisualizationRequest {
  chart_type: 'histogram' | 'bar' | 'box' | 'scatter' | 'line' | 'heatmap' | 'pairplot';
  x_column?: string;
  y_column?: string;
  hue_column?: string;
  columns?: string[];
  title?: string;
  bins?: number;
}

export interface VisualizationResponse {
  chart_type: string;
  image_base64: string;
  educational_notes: string;
  suggested_questions: string[];
}

export interface HypothesisTestResult {
  test_name: string;
  p_value: number;
  test_statistic?: number;
  decision: string;
  null_hypothesis: string;
  alternative_hypothesis: string;
  assumptions?: string;
  [key: string]: any;
}

export interface StatisticsResponse {
  descriptive_statistics: Record<string, Record<string, any>>;
  skewness_kurtosis: Record<string, Record<string, any>>;
  correlation_matrix: Record<string, Record<string, number | null>>;
  hypothesis_test_result?: HypothesisTestResult;
  educational_guide: string;
}

export interface MLModelRecord {
  id: string;
  dataset_id: string;
  task_type: 'classification' | 'regression';
  algorithm: 'random_forest' | 'linear_baseline';
  target_column: string;
  feature_columns: string[];
  metrics: Record<string, any>;
  feature_importances?: Record<string, number>;
  leakage_warnings: string[];
  status: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DashboardStats {
  dataset_count: number;
  analysis_count: number;
  model_count: number;
  conversation_count: number;
  completed_topics: string[];
  recent_datasets: Array<{
    id: string;
    name: string;
    rows: number;
    cols: number;
    created_at: string;
  }>;
  recent_models: Array<{
    id: string;
    algorithm: string;
    task_type: string;
    target: string;
    created_at: string;
  }>;
}

export interface AcademicReport {
  report_id: string;
  dataset_name: string;
  dataset_id: string;
  student_email: string;
  generated_at: string;
  sections: Record<string, any>;
  download_url?: string;
}
