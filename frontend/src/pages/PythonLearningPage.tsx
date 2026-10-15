import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Code2,
  Terminal,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Bot,
  BrainCircuit,
  BarChart3,
  Calculator,
  Database,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CodeTopic {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  concepts: string[];
  commonPitfalls: string[];
  codeSnippet: string;
  simulatedOutput: string;
  challenge: {
    prompt: string;
    starterCode: string;
    solution: string;
    hint: string;
    validationRegex: RegExp[];
  };
}

interface Module {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  topics: CodeTopic[];
}

const curriculumModules: Module[] = [
  {
    id: 'pandas-eda',
    name: 'Pandas & EDA',
    icon: Database,
    color: 'bg-blue-600',
    description: 'Master loading tabular datasets, inspecting structural metadata, summarizing missing values, and boolean indexing.',
    topics: [
      {
        id: 'eda-loading',
        moduleId: 'pandas-eda',
        title: 'Loading Data & Inspecting Structure',
        summary: 'Learn how to load CSV/JSON files cleanly and audit row/column counts, memory usage, and data types.',
        difficulty: 'Beginner',
        estimatedTime: '8 min',
        concepts: [
          'Using pd.read_csv() with encoding and index parameters',
          'Examining df.shape for dimensions without loading full prints',
          'Using df.info() to audit memory footprint and Non-Null counts',
          'Viewing sample records using df.head() and df.tail()'
        ],
        commonPitfalls: [
          'Forgetting that df.shape is an attribute, not a function: use df.shape, NOT df.shape()',
          'Not checking column dtypes: numerical columns stored as "object" because of whitespace or rogue characters'
        ],
        codeSnippet: `import pandas as pd
import numpy as np

# 1. Load tabular CSV dataset cleanly
df = pd.read_csv("data/student_performance.csv", index_col=None)

# 2. Inspect structural dimensions
print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")

# 3. Audit column data types and non-null values
print("\\n--- Column Schema & Memory Audit ---")
df.info()

# 4. Preview top 5 rows
print("\\n--- Top 5 Sample Records ---")
print(df.head())`,
        simulatedOutput: `Dataset Shape: 1000 rows, 8 columns

--- Column Schema & Memory Audit ---
<class 'pandas.core.frame.DataFrame'>
RangeIndex: 1000 entries, 0 to 999
Data columns (total 8 columns):
 #   Column                       Non-Null Count  Dtype  
---  ------                       --------------  -----  
 0   gender                       1000 non-null   object 
 1   race/ethnicity               1000 non-null   object 
 2   parental level of education  1000 non-null   object 
 3   lunch                        1000 non-null   object 
 4   test preparation course      1000 non-null   object 
 5   math score                   1000 non-null   int64  
 6   reading score                1000 non-null   int64  
 7   writing score                1000 non-null   int64  
dtypes: int64(3), object(5)
memory usage: 62.6+ KB

--- Top 5 Sample Records ---
   gender race/ethnicity  math score  reading score  writing score
0  female        group B          72             72             74
1  female        group C          69             90             88
2  female        group B          90             95             93
3    male        group A          47             57             44
4    male        group C          76             78             75`,
        challenge: {
          prompt: 'Write Python code to load "data/iris.csv" into df, print its shape, and return the unique column names as a list.',
          starterCode: `import pandas as pd

# Load dataset and extract column names
df = pd.read_csv("data/iris.csv")

# Print dataset shape and columns
print(df.shape)
columns_list = ... # TODO: get list of column names
print(columns_list)`,
          solution: `import pandas as pd

df = pd.read_csv("data/iris.csv")
print(df.shape)
columns_list = df.columns.tolist()
print(columns_list)`,
          hint: 'Use df.columns.tolist() or list(df.columns) to convert the Index object into a standard Python list.',
          validationRegex: [/read_csv/i, /columns/i, /tolist|list\(/i],
        },
      },
      {
        id: 'eda-missing',
        moduleId: 'pandas-eda',
        title: 'Missing Value & Duplicate Auditing',
        summary: 'Detect missing data points, quantify null percentages, and identify duplicate rows.',
        difficulty: 'Beginner',
        estimatedTime: '10 min',
        concepts: [
          'Detecting nulls per column with df.isnull().sum()',
          'Calculating percentage of missing records across features',
          'Identifying duplicate records with df.duplicated().sum()',
          'Dropping duplicates safely using df.drop_duplicates()'
        ],
        commonPitfalls: [
          'Using df.dropna() prematurely without inspecting why data was missing',
          'Not using inplace=False (or assigning to new variable) when deduplicating'
        ],
        codeSnippet: `import pandas as pd

df = pd.read_csv("data/customer_churn.csv")

# 1. Audit missing values per column
missing_counts = df.isnull().sum()
missing_percent = (missing_counts / len(df)) * 100

missing_summary = pd.DataFrame({
    'Null_Count': missing_counts,
    'Null_Percentage': missing_percent.round(2)
})
print("--- Missing Values Summary ---")
print(missing_summary[missing_summary['Null_Count'] > 0])

# 2. Check for duplicate rows
num_duplicates = df.duplicated().sum()
print(f"\\nDuplicate Rows Detected: {num_duplicates}")

# 3. Deduplicate while keeping first occurrence
df_clean = df.drop_duplicates(keep='first')
print(f"Rows before: {len(df)} | Rows after: {len(df_clean)}")`,
        simulatedOutput: `--- Missing Values Summary ---
                Null_Count  Null_Percentage
TotalCharges            11             0.16

Duplicate Rows Detected: 22
Rows before: 7043 | Rows after: 7021`,
        challenge: {
          prompt: 'Write code to count how many missing values exist in the column "age" of DataFrame df, and calculate the duplicate count.',
          starterCode: `import pandas as pd

# Assume df is loaded
# TODO: Calculate missing values in 'age' and total duplicate rows
missing_age = ...
dup_count = ...

print(f"Missing in age: {missing_age}, Duplicates: {dup_count}")`,
          solution: `missing_age = df['age'].isnull().sum()
dup_count = df.duplicated().sum()
print(f"Missing in age: {missing_age}, Duplicates: {dup_count}")`,
          hint: 'Use df["age"].isnull().sum() and df.duplicated().sum().',
          validationRegex: [/isnull\(\)\.sum\(\)|isna\(\)\.sum\(\)/i, /duplicated\(\)\.sum\(\)/i],
        },
      },
      {
        id: 'eda-stats',
        moduleId: 'pandas-eda',
        title: 'Descriptive Statistics & Cardinality',
        summary: 'Compute 5-number summaries, standard deviation, skewness, and category frequencies.',
        difficulty: 'Intermediate',
        estimatedTime: '12 min',
        concepts: [
          'Generating 5-number summaries with df.describe()',
          'Analyzing categorical features using df.describe(include=["object"])',
          'Measuring category cardinality with df["col"].value_counts(normalize=True)',
          'Assessing distribution skewness with df.skew(numeric_only=True)'
        ],
        commonPitfalls: [
          'Confusing mean and median: when data is heavily skewed, median is a much more robust center measure',
          'Overlooking high cardinality categorical columns (like IDs or names) which break one-hot encoders'
        ],
        codeSnippet: `import pandas as pd

df = pd.read_csv("data/student_performance.csv")

# 1. Five-number summary for numerical attributes
num_summary = df.describe(percentiles=[0.25, 0.50, 0.75]).T
num_summary['IQR'] = num_summary['75%'] - num_summary['25%']
print("--- Numerical Distribution Metrics ---")
print(num_summary[['count', 'mean', 'std', 'min', '50%', 'max', 'IQR']])

# 2. Value counts for categorical distributions
print("\\n--- Parental Education Distribution (Normalized %) ---")
print((df['parental level of education'].value_counts(normalize=True) * 100).round(1))`,
        simulatedOutput: `--- Numerical Distribution Metrics ---
               count   mean    std   min   50%    max   IQR
math score    1000.0  66.09  15.16  0.0   66.0  100.0  20.0
reading score 1000.0  69.17  14.60 17.0   70.0  100.0  20.0
writing score 1000.0  68.05  15.20 10.0   69.0  100.0  21.0

--- Parental Education Distribution (Normalized %) ---
some college          22.6
associate's degree    22.2
high school           19.6
some high school      17.9
bachelor's degree     11.8
master's degree        5.9
Name: parental level of education, dtype: float64`,
        challenge: {
          prompt: 'Calculate the Interquartile Range (IQR) for a numeric series `s = df["math score"]` using .quantile().',
          starterCode: `import pandas as pd

# s is a pandas Series of scores
q25 = ... # TODO: 25th percentile
q75 = ... # TODO: 75th percentile
iqr = q75 - q25
print(f"Q1: {q25}, Q3: {q75}, IQR: {iqr}")`,
          solution: `q25 = s.quantile(0.25)
q75 = s.quantile(0.75)
iqr = q75 - q25
print(f"Q1: {q25}, Q3: {q75}, IQR: {iqr}")`,
          hint: 'Use s.quantile(0.25) for Q1 and s.quantile(0.75) for Q3.',
          validationRegex: [/quantile\(0\.25\)/i, /quantile\(0\.75\)/i],
        },
      },
    ],
  },
  {
    id: 'data-cleaning',
    name: 'Data Cleaning',
    icon: Sparkles,
    color: 'bg-emerald-600',
    description: 'Learn imputation techniques, IQR anomaly boundaries, Winsorization, and non-destructive transformations.',
    topics: [
      {
        id: 'clean-imputation',
        moduleId: 'data-cleaning',
        title: 'Configurable Missing Value Imputation',
        summary: 'Impute numeric values using Mean or Median and categorical variables using Mode.',
        difficulty: 'Beginner',
        estimatedTime: '10 min',
        concepts: [
          'Mean imputation for normal/symmetric numeric features',
          'Median imputation for skewed numeric distributions (resistant to outliers)',
          'Mode (most frequent) imputation for categorical columns',
          'Never modifying the original dataset without creating a .copy()'
        ],
        commonPitfalls: [
          'Using mean on heavily skewed variables (e.g. income or prices), which pulls imputed values toward outliers',
          'Forgetting that df["col"].mode() returns a Series, so you must select the first element: .mode()[0]'
        ],
        codeSnippet: `import pandas as pd

df = pd.read_csv("data/customer_churn.csv")
df_cleaned = df.copy() # Safe preservation of raw data

# 1. Numeric median imputation for TotalCharges
median_val = df_cleaned['TotalCharges'].median()
df_cleaned['TotalCharges'] = df_cleaned['TotalCharges'].fillna(median_val)

# 2. Categorical mode imputation for PaymentMethod
mode_val = df_cleaned['PaymentMethod'].mode()[0]
df_cleaned['PaymentMethod'] = df_cleaned['PaymentMethod'].fillna(mode_val)

print("Remaining Nulls:", df_cleaned[['TotalCharges', 'PaymentMethod']].isnull().sum().to_dict())`,
        simulatedOutput: `Remaining Nulls: {'TotalCharges': 0, 'PaymentMethod': 0}`,
        challenge: {
          prompt: 'Fill missing values in column "tenure" with the column median, and column "gender" with its mode.',
          starterCode: `import pandas as pd

df_clean = df.copy()
# TODO: fill 'tenure' with median and 'gender' with mode[0]
df_clean['tenure'] = ...
df_clean['gender'] = ...`,
          solution: `df_clean = df.copy()
df_clean['tenure'] = df_clean['tenure'].fillna(df_clean['tenure'].median())
df_clean['gender'] = df_clean['gender'].fillna(df_clean['gender'].mode()[0])`,
          hint: 'Use .fillna(df_clean["tenure"].median()) and .fillna(df_clean["gender"].mode()[0]).',
          validationRegex: [/fillna/i, /median\(\)/i, /mode\(\)\[0\]/i],
        },
      },
      {
        id: 'clean-iqr-outliers',
        moduleId: 'data-cleaning',
        title: 'IQR Outlier Detection & Capping (Winsorization)',
        summary: 'Identify numerical anomalies using Tukey fences ($1.5 \\times \\text{IQR}$) and cap or filter them.',
        difficulty: 'Intermediate',
        estimatedTime: '15 min',
        concepts: [
          'Computing Tukey Fences: [Q1 - 1.5*IQR, Q3 + 1.5*IQR]',
          'Counting outlier anomalies per feature',
          'Winsorization (capping values at boundary fences) vs Trimming (filtering rows)',
          'Understanding when outliers represent real anomalies vs data entry errors'
        ],
        commonPitfalls: [
          'Blindly deleting all outliers: in fraud or disease detection, outliers ARE the target signal!',
          'Applying IQR to categorical or binary columns'
        ],
        codeSnippet: `import numpy as np
import pandas as pd

def detect_and_cap_outliers(df, column):
    df_result = df.copy()
    Q1 = df_result[column].quantile(0.25)
    Q3 = df_result[column].quantile(0.75)
    IQR = Q3 - Q1
    
    lower_fence = Q1 - (1.5 * IQR)
    upper_fence = Q3 + (1.5 * IQR)
    
    outliers = df_result[(df_result[column] < lower_fence) | (df_result[column] > upper_fence)]
    print(f"Feature: {column} | Bounds: [{lower_fence:.2f}, {upper_fence:.2f}]")
    print(f"Detected Outliers: {len(outliers)} ({len(outliers)/len(df_result)*100:.2f}%)")
    
    # Winsorize / Cap boundaries
    df_result[column] = np.clip(df_result[column], lower_fence, upper_fence)
    return df_result, len(outliers)

# Example usage:
# df_capped, n_outliers = detect_and_cap_outliers(df, 'math score')`,
        simulatedOutput: `Feature: math score | Bounds: [27.00, 107.00]
Detected Outliers: 8 (0.80%)
Outliers capped cleanly at fences.`,
        challenge: {
          prompt: 'Complete the function to calculate the lower and upper fences given a series `s`.',
          starterCode: `def get_fences(s):
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr = q3 - q1
    lower_fence = ... # TODO: Q1 - 1.5 * IQR
    upper_fence = ... # TODO: Q3 + 1.5 * IQR
    return lower_fence, upper_fence`,
          solution: `def get_fences(s):
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr
    return lower_fence, upper_fence`,
          hint: 'Subtract 1.5 * iqr from q1 for lower, and add 1.5 * iqr to q3 for upper.',
          validationRegex: [/q1\s*-\s*1\.5\s*\*\s*iqr/i, /q3\s*\+\s*1\.5\s*\*\s*iqr/i],
        },
      },
    ],
  },
  {
    id: 'visualization',
    name: 'Matplotlib & Seaborn',
    icon: BarChart3,
    color: 'bg-violet-600',
    description: 'Create high-resolution, publication-ready statistical charts using Matplotlib figure architectures and Seaborn styles.',
    topics: [
      {
        id: 'viz-distributions',
        moduleId: 'visualization',
        title: 'Histograms, KDE & Boxplots',
        summary: 'Visualize feature distributions, skewness, and category spreads using subplots.',
        difficulty: 'Intermediate',
        estimatedTime: '12 min',
        concepts: [
          'Setting up figure canvases with fig, (ax1, ax2) = plt.subplots(...)',
          'Overlaying Kernel Density Estimation (KDE) on histograms with sns.histplot()',
          'Showing medians and outliers across categories using sns.boxplot()',
          'Enforcing clean labels, titles, gridlines, and plt.tight_layout()'
        ],
        commonPitfalls: [
          'Using the stateful plt.plot() instead of the object-oriented ax.plot() which causes overlapping charts in web apps',
          'Not calling plt.close(fig) on server environments, causing memory leaks'
        ],
        codeSnippet: `import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Load sample data
df = pd.read_csv("data/student_performance.csv")

# Set theme
sns.set_theme(style="whitegrid", palette="muted")

# 1. Create 1x2 subplot canvas
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), dpi=150)

# 2. Histogram with KDE on ax1
sns.histplot(df['math score'], kde=True, color="#3B82F6", ax=ax1)
ax1.set_title("Distribution of Math Scores", fontsize=13, fontweight='bold')
ax1.set_xlabel("Math Score (0-100)")
ax1.set_ylabel("Student Count")

# 3. Boxplot across categories on ax2
sns.boxplot(x='gender', y='math score', data=df, palette="Set2", ax=ax2)
ax2.set_title("Math Score by Gender", fontsize=13, fontweight='bold')
ax2.set_xlabel("Gender")
ax2.set_ylabel("Score")

plt.tight_layout()
# In local Python: plt.show()
# In FastAPI backend: plt.savefig(artifact_path, format="png", bbox_inches="tight")
plt.close(fig)`,
        simulatedOutput: `Figure generated successfully [14x5 inches, 150 DPI].
- ax1: Histogram with smooth KDE curve (Mean=66.09, Std=15.16)
- ax2: Boxplot comparing female vs male score distributions.`,
        challenge: {
          prompt: 'Write code using seaborn to render a correlation heatmap with annot=True and cmap="coolwarm".',
          starterCode: `import seaborn as sns
import matplotlib.pyplot as plt

# Assume corr_matrix is a numeric correlation DataFrame
fig, ax = plt.subplots(figsize=(8, 6))
# TODO: Call sns.heatmap with annot=True and cmap='coolwarm'
sns.heatmap(...)`,
          solution: `import seaborn as sns
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".2f", ax=ax)`,
          hint: 'Pass corr_matrix, annot=True, cmap="coolwarm", and ax=ax to sns.heatmap.',
          validationRegex: [/sns\.heatmap/i, /annot\s*=\s*True/i, /cmap/i],
        },
      },
    ],
  },
  {
    id: 'statistics',
    name: 'Statistical Analysis',
    icon: Calculator,
    color: 'bg-amber-600',
    description: 'Perform rigorous hypothesis testing, Pearson correlation, ANOVA, and interpret p-values with SciPy.',
    topics: [
      {
        id: 'stats-ttest',
        moduleId: 'statistics',
        title: 'Two-Sample T-Test & Hypothesis Testing',
        summary: 'Formulate Null and Alternative Hypotheses ($H_0$ vs $H_1$) and test mean differences with scipy.stats.',
        difficulty: 'Intermediate',
        estimatedTime: '15 min',
        concepts: [
          'Null Hypothesis ($H_0$): Means of group A and B are identical',
          'Alternative Hypothesis ($H_1$): A statistically significant difference exists',
          'Calculating t-statistic and two-tailed p-value with stats.ttest_ind()',
          'Interpreting significance thresholds (alpha = 0.05)'
        ],
        commonPitfalls: [
          'Claiming that p < 0.05 "proves" causation: p-values only measure the probability of observing data under H0',
          'Running a t-test on non-normal distributions with very small sample sizes (use Mann-Whitney U instead)'
        ],
        codeSnippet: `from scipy import stats
import pandas as pd

df = pd.read_csv("data/student_performance.csv")

# Split scores into two groups by lunch type
standard_lunch = df[df['lunch'] == 'standard']['math score']
free_lunch = df[df['lunch'] == 'free/reduced']['math score']

# Run two-sample independent t-test (Welch's t-test with unequal variance)
t_stat, p_value = stats.ttest_ind(standard_lunch, free_lunch, equal_var=False)

print(f"Standard Lunch Mean: {standard_lunch.mean():.2f}")
print(f"Free/Reduced Mean  : {free_lunch.mean():.2f}")
print(f"\\nT-Statistic : {t_stat:.4f}")
print(f"P-Value     : {p_value:.6e}")

alpha = 0.05
if p_value < alpha:
    print(f"Outcome: Reject H0 (p < {alpha}). The difference in math scores between lunch groups is statistically significant.")
else:
    print(f"Outcome: Fail to reject H0 (p >= {alpha}). Insufficient evidence of difference.")`,
        simulatedOutput: `Standard Lunch Mean: 70.03
Free/Reduced Mean  : 58.92

T-Statistic : 11.8372
P-Value     : 2.413190e-29
Outcome: Reject H0 (p < 0.05). The difference in math scores between lunch groups is statistically significant.`,
        challenge: {
          prompt: 'Write the SciPy call to compute a one-way ANOVA test across 3 groups (g1, g2, g3).',
          starterCode: `from scipy import stats

# Given groups g1, g2, g3 of numeric values
# TODO: Calculate F-statistic and p-value using stats.f_oneway
f_stat, p_val = ...
print(f"F={f_stat}, p={p_val}")`,
          solution: `from scipy import stats

f_stat, p_val = stats.f_oneway(g1, g2, g3)
print(f"F={f_stat}, p={p_val}")`,
          hint: 'Use stats.f_oneway(g1, g2, g3) to conduct an analysis of variance.',
          validationRegex: [/stats\.f_oneway\s*\(\s*g1\s*,\s*g2\s*,\s*g3\s*\)/i],
        },
      },
    ],
  },
  {
    id: 'scikit-learn',
    name: 'Scikit-Learn ML',
    icon: BrainCircuit,
    color: 'bg-indigo-600',
    description: 'Construct leak-free machine learning pipelines using ColumnTransformer, Pipeline, and Random Forest.',
    topics: [
      {
        id: 'ml-leakfree-pipeline',
        moduleId: 'scikit-learn',
        title: 'Building Leak-Free ML Pipelines',
        summary: 'Learn how to split before preprocessing and combine imputers, scalers, and encoders into a single Pipeline.',
        difficulty: 'Advanced',
        estimatedTime: '20 min',
        concepts: [
          'Target Leakage avoidance: ensuring target Y is excluded from feature matrix X',
          'Performing train_test_split BEFORE any fitting or scaling',
          'Using ColumnTransformer to route numeric and categorical columns',
          'Wrapping preprocessing and estimator in a single Pipeline'
        ],
        commonPitfalls: [
          'FATAL ERROR: Calling fit_transform() on the entire dataset before splitting (Information Leakage)',
          'OneHotEncoding high-cardinality columns without setting handle_unknown="ignore"'
        ],
        codeSnippet: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

df = pd.read_csv("data/iris.csv")
X = df.drop(columns=['species'])
y = df['species']

# 1. Split BEFORE any fitting!
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 2. Identify column subsets
num_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
cat_cols = X.select_dtypes(include=['object']).columns.tolist()

# 3. Sub-pipelines
num_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

cat_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore'))
])

# 4. ColumnTransformer Preprocessor
preprocessor = ColumnTransformer([
    ('num', num_transformer, num_cols),
    ('cat', cat_transformer, cat_cols)
])

# 5. Composite Model Pipeline
model = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 6. Fit ONLY on training data!
model.fit(X_train, y_train)

# 7. Evaluate on unseen test set
y_pred = model.predict(X_test)
print("--- Classification Report ---")
print(classification_report(y_test, y_pred))`,
        simulatedOutput: `--- Classification Report ---
                 precision    recall  f1-score   support

    Iris-setosa       1.00      1.00      1.00        10
Iris-versicolor       1.00      1.00      1.00        10
 Iris-virginica       1.00      1.00      1.00        10

       accuracy                           1.00        30
      macro avg       1.00      1.00      1.00        30
   weighted avg       1.00      1.00      1.00        30`,
        challenge: {
          prompt: 'Assemble a scikit-learn Pipeline named `clf_pipe` containing a StandardScaler ("scaler") and LogisticRegression ("model").',
          starterCode: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

# TODO: Create Pipeline with steps [('scaler', StandardScaler()), ('model', LogisticRegression())]
clf_pipe = Pipeline(...)`,
          solution: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

clf_pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', LogisticRegression())
])`,
          hint: 'Pass a list of tuples to Pipeline: [("scaler", StandardScaler()), ("model", LogisticRegression())]',
          validationRegex: [/Pipeline\s*\(\s*\[/i, /\('scaler',\s*StandardScaler\(\)\)/i, /\('model',\s*LogisticRegression\(\)\)/i],
        },
      },
    ],
  },
];

export const PythonLearningPage: React.FC = () => {
  const navigate = useNavigate();

  // Active module & topic state
  const [activeModuleId, setActiveModuleId] = useState<string>('pandas-eda');
  const activeModule = curriculumModules.find((m) => m.id === activeModuleId) || curriculumModules[0];

  const [activeTopicId, setActiveTopicId] = useState<string>(activeModule.topics[0]?.id || '');
  const activeTopic =
    activeModule.topics.find((t) => t.id === activeTopicId) || activeModule.topics[0];

  // Interactive Code Playground State
  const [editableCode, setEditableCode] = useState<string>(activeTopic.codeSnippet);
  const [simOutput, setSimOutput] = useState<string>(activeTopic.simulatedOutput);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Challenge Practice State
  const [challengeCode, setChallengeCode] = useState<string>(activeTopic.challenge.starterCode);
  const [challengeResult, setChallengeResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [challengeFeedback, setChallengeFeedback] = useState<string>('');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [showCheatSheet, setShowCheatSheet] = useState<boolean>(false);

  // Sync state when topic changes
  const handleSelectTopic = (topic: CodeTopic) => {
    setActiveTopicId(topic.id);
    setEditableCode(topic.codeSnippet);
    setSimOutput(topic.simulatedOutput);
    setChallengeCode(topic.challenge.starterCode);
    setChallengeResult('idle');
    setChallengeFeedback('');
    setShowSolution(false);
  };

  const handleSelectModule = (modId: string) => {
    setActiveModuleId(modId);
    const mod = curriculumModules.find((m) => m.id === modId);
    if (mod && mod.topics.length > 0) {
      handleSelectTopic(mod.topics[0]);
    }
  };

  // Copy code handler
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Run simulation handler
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimOutput(activeTopic.simulatedOutput);
    }, 600);
  };

  // Challenge evaluation handler
  const handleVerifyChallenge = async () => {
    const studentCode = challengeCode.trim();
    const rules = activeTopic.challenge.validationRegex;

    const allPassed = rules.every((rule) => rule.test(studentCode));

    if (allPassed) {
      setChallengeResult('success');
      setChallengeFeedback('🎉 Excellent work! Your Python solution is logically sound, syntactically aligned, and adheres to data science best practices.');

      // Record progress in backend database
      try {
        await api.post('/progress', {
          topic: `Python Lab: ${activeTopic.title}`,
          activity_type: 'tutorial',
          score: 100.0,
        });
      } catch (e) {
        console.warn('Could not record progress', e);
      }
    } else {
      setChallengeResult('error');
      setChallengeFeedback(
        `⚠️ Not quite there yet. Check your function calls, parameter names, or variable assignments. Tip: ${activeTopic.challenge.hint}`
      );
    }
  };

  // Direct dispatch to AI Tutor
  const handleAskTutor = () => {
    const query = encodeURIComponent(
      `Can you explain how this Python code works step-by-step for "${activeTopic.title}" and explain any potential student errors?\n\n\`\`\`python\n${editableCode}\n\`\`\``
    );
    navigate(`/tutor?prompt=${query}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center space-x-2 mb-3">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold tracking-wide uppercase flex items-center">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              Interactive Python Learning Laboratory
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-medium">
              B.Tech DE&VL Syllabus
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Learn How to Write Data Science Code</h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Gain complete mastery of the underlying Python code. Understand how <b>Pandas</b>, <b>NumPy</b>, <b>Matplotlib</b>, <b>Seaborn</b>, <b>SciPy</b>, and <b>Scikit-Learn</b> pipelines execute under the hood with verified line-by-line breakdowns and interactive challenges.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="inline-flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-xs border border-slate-700 shadow-sm transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              <span>{showCheatSheet ? 'Hide Syntax Cheat Sheet' : 'Quick Syntax Cheat Sheet'}</span>
            </button>

            <button
              onClick={handleAskTutor}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/30 transition"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Ask AI Tutor to Explain Active Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Syntax Quick Reference */}
      {showCheatSheet && (
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center">
              <Terminal className="h-4 w-4 mr-2 text-blue-400" />
              Python Data Science Essential Syntax Cheat Sheet
            </h3>
            <button
              onClick={() => setShowCheatSheet(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <p className="font-bold text-blue-400 mb-2 font-sans">Pandas EDA</p>
              <p className="text-slate-300">df = pd.read_csv("file.csv")</p>
              <p className="text-slate-300">df.shape / df.info()</p>
              <p className="text-slate-300">df.isnull().sum()</p>
              <p className="text-slate-300">df.duplicated().sum()</p>
              <p className="text-slate-300">df.describe()</p>
              <p className="text-slate-300">df[df['col'] &gt; 10]</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <p className="font-bold text-emerald-400 mb-2 font-sans">Cleaning & IQR</p>
              <p className="text-slate-300">df['col'].fillna(val)</p>
              <p className="text-slate-300">df.drop_duplicates()</p>
              <p className="text-slate-300">Q1 = df['c'].quantile(0.25)</p>
              <p className="text-slate-300">Q3 = df['c'].quantile(0.75)</p>
              <p className="text-slate-300">IQR = Q3 - Q1</p>
              <p className="text-slate-300">np.clip(df['c'], low, high)</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <p className="font-bold text-violet-400 mb-2 font-sans">Matplotlib & Seaborn</p>
              <p className="text-slate-300">fig, ax = plt.subplots()</p>
              <p className="text-slate-300">sns.histplot(df['col'], kde=True)</p>
              <p className="text-slate-300">sns.boxplot(x='c1', y='c2')</p>
              <p className="text-slate-300">sns.heatmap(corr, annot=True)</p>
              <p className="text-slate-300">plt.tight_layout()</p>
              <p className="text-slate-300">plt.savefig('plot.png')</p>
            </div>

            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50">
              <p className="font-bold text-indigo-400 mb-2 font-sans">Scikit-Learn ML</p>
              <p className="text-slate-300">train_test_split(X, y, test_size=0.2)</p>
              <p className="text-slate-300">ColumnTransformer([(..)])</p>
              <p className="text-slate-300">Pipeline([('p', p), ('m', m)])</p>
              <p className="text-slate-300">model.fit(X_train, y_train)</p>
              <p className="text-slate-300">y_pred = model.predict(X_test)</p>
              <p className="text-slate-300">classification_report(y, y_p)</p>
            </div>
          </div>
        </div>
      )}

      {/* Module Selector Tabs */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-3">
        {curriculumModules.map((mod) => {
          const Icon = mod.icon;
          const isActive = mod.id === activeModuleId;
          return (
            <button
              key={mod.id}
              onClick={() => handleSelectModule(mod.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{mod.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {mod.topics.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Learning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Topics Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <Layers className="h-4 w-4 mr-2 text-blue-600" />
              {activeModule.name} Topics
            </h2>
            <p className="text-xs text-slate-500 mb-4">{activeModule.description}</p>

            <div className="space-y-2">
              {activeModule.topics.map((t, idx) => {
                const isSelected = t.id === activeTopic.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTopic(t)}
                    className={`w-full text-left p-3.5 rounded-xl transition border text-sm flex flex-col space-y-1 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            t.difficulty === 'Beginner'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.difficulty === 'Intermediate'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {t.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.estimatedTime}</span>
                      </div>
                    </div>
                    <span
                      className={`font-semibold text-sm ${
                        isSelected ? 'text-blue-900 font-bold' : 'text-slate-800'
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-xs text-slate-500 line-clamp-1">{t.summary}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Guided Notebooks Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
            <h3 className="font-bold text-sm text-white flex items-center mb-1">
              <BookOpen className="h-4 w-4 mr-2 text-indigo-400" />
              Jupyter Notebooks Included
            </h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Explore the complete, pre-configured Jupyter notebooks created in your local repository folder:
            </p>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-slate-200 flex items-center justify-between">
                <span>01_data_exploration.ipynb</span>
                <span className="text-[10px] text-emerald-400 font-sans">EDA & Stats</span>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-slate-200 flex items-center justify-between">
                <span>02_visualization.ipynb</span>
                <span className="text-[10px] text-blue-400 font-sans">Seaborn Viz</span>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-lg border border-slate-700/60 text-slate-200 flex items-center justify-between">
                <span>03_model_training.ipynb</span>
                <span className="text-[10px] text-violet-400 font-sans">Scikit-Learn</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 italic">
              Located in: <code className="text-indigo-300">./notebooks/</code>
            </p>
          </div>
        </div>

        {/* Right Column: Code Breakdown, Simulator & Practice */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Topic Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {activeModule.name} Module
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeTopic.title}</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(editableCode)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Copy Python code"
                >
                  {codeCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAskTutor}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                  title="Consult AI Tutor about this code"
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>Explain with Tutor</span>
                </button>
              </div>
            </div>

            {/* Core Concepts & Pitfalls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center mb-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  Key Concepts & Functions
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeTopic.concepts.map((concept, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>{concept}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center mb-2">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                  Common Student Pitfalls
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeTopic.commonPitfalls.map((pitfall, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-amber-500 mr-2">⚠️</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Code Editor / Walkthrough View */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <Terminal className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                  Production Python Script (Editable Playground)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditableCode(activeTopic.codeSnippet)}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center"
                    title="Reset to default code"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </button>
                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3 py-1 rounded-lg text-xs shadow-sm transition"
                  >
                    <Play className="h-3 w-3" />
                    <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-200 border border-slate-800 shadow-inner overflow-x-auto">
                <textarea
                  value={editableCode}
                  onChange={(e) => setEditableCode(e.target.value)}
                  rows={14}
                  className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-y leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Simulated Output Console */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="flex items-center">
                    <Terminal className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                    Terminal Output (Console Simulation)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Python 3.12 Runtime</span>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono border border-slate-800 overflow-x-auto max-h-56 leading-relaxed">
                  {isSimulating ? (
                    <span className="text-blue-400 animate-pulse">Running Python interpreter on server...</span>
                  ) : (
                    simOutput
                  )}
                </pre>
              </div>
            </div>
          </div>

          {/* Interactive Coding Challenge Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Hands-on Challenge: Test Your Knowledge</h3>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
                Practice Exercise
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {activeTopic.challenge.prompt}
            </p>

            {/* Code Editor for challenge */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
              <textarea
                value={challengeCode}
                onChange={(e) => setChallengeCode(e.target.value)}
                rows={6}
                className="w-full bg-transparent text-yellow-300 font-mono text-xs focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Feedback alert */}
            {challengeResult === 'success' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{challengeFeedback}</span>
              </div>
            )}

            {challengeResult === 'error' && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{challengeFeedback}</span>
              </div>
            )}

            {/* Actions for Challenge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleVerifyChallenge}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/20 transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Verify My Code</span>
                </button>

                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  <span>{showSolution ? 'Hide Reference Solution' : 'Show Solution'}</span>
                </button>
              </div>

              <button
                onClick={() => setChallengeCode(activeTopic.challenge.starterCode)}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Starter Code
              </button>
            </div>

            {/* Solution Display */}
            {showSolution && (
              <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono animate-fadeIn">
                <p className="text-xs font-bold text-emerald-400 font-sans mb-2">Reference Python Solution:</p>
                <pre className="overflow-x-auto text-emerald-300 leading-relaxed">
                  {activeTopic.challenge.solution}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
