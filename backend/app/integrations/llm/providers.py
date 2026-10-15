import logging

import httpx
from app.core.config import settings
from app.integrations.llm.base import LLMProvider

logger = logging.getLogger("smart_tutor.llm")


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model

    async def generate_response(
        self,
        system_instruction: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1500,
    ) -> str:
        # Build normalized, Gemini-compliant message contents
        contents = []
        for m in messages:
            role = "user" if m.get("role") == "user" else "model"
            text = (m.get("content") or "").strip()
            if not text:
                continue

            # Merge consecutive messages of identical role
            if contents and contents[-1]["role"] == role:
                contents[-1]["parts"][0]["text"] += f"\n\n{text}"
            else:
                contents.append({
                    "role": role,
                    "parts": [{"text": text}]
                })

        # Ensure sequence starts with a user turn
        while contents and contents[0]["role"] != "user":
            contents.pop(0)

        # Fallback if empty
        if not contents:
            contents = [{"role": "user", "parts": [{"text": "Hello! Please introduce yourself as my AI Smart Tutor."}]}]

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }

        # Candidate models to try in sequence
        models_to_try = [self.model]
        for candidate in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        last_error = None
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            for model_name in models_to_try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                try:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                        return "I received your query, but no response was returned by the model."
                    else:
                        err_body = resp.text
                        logger.warning(f"Gemini API ({model_name}) returned status {resp.status_code}: {err_body}")
                        last_error = f"Gemini Error ({resp.status_code}): {err_body[:250]}"
                except Exception as ex:
                    logger.warning(f"Connection exception to Gemini ({model_name}): {ex}")
                    last_error = str(ex)

        raise RuntimeError(last_error or "All Gemini model candidates failed to return a response.")


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def generate_response(
        self,
        system_instruction: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        formatted = [{"role": "system", "content": system_instruction}]
        for m in messages:
            formatted.append({"role": m["role"], "content": m["content"]})

        payload = {
            "model": self.model,
            "messages": formatted,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
            if resp.status_code != 200:
                logger.error(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                raise RuntimeError(f"OpenAI API Error: {resp.status_code}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class DeepSeekProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "deepseek-chat", base_url: str = "https://api.deepseek.com"):
        self.api_key = api_key
        self.model = model or "deepseek-chat"
        self.base_url = base_url.rstrip("/")

    async def generate_response(
        self,
        system_instruction: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1500,
    ) -> str:
        formatted = [{"role": "system", "content": system_instruction}]
        for m in messages:
            role = "user" if m.get("role") == "user" else "assistant"
            content = (m.get("content") or "").strip()
            if content:
                formatted.append({"role": role, "content": content})

        payload = {
            "model": self.model,
            "messages": formatted,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        endpoints = [
            f"{self.base_url}/chat/completions",
            f"{self.base_url}/v1/chat/completions",
        ]

        last_error = None
        async with httpx.AsyncClient(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
            for url in endpoints:
                try:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"].get("content", "")
                        return "I received your query, but no response was returned by DeepSeek."
                    else:
                        err_text = resp.text
                        logger.warning(f"DeepSeek API error ({resp.status_code}): {err_text}")
                        last_error = f"DeepSeek API Error ({resp.status_code}): {err_text[:200]}"
                except Exception as ex:
                    logger.warning(f"Connection exception to DeepSeek ({url}): {ex}")
                    last_error = str(ex)

        raise RuntimeError(last_error or "DeepSeek API failed to respond.")


class OfflineEducatorProvider(LLMProvider):
    """Offline academic tutor engine providing grounded feedback, code examples,
    and viva questions even without external API keys.
    """
    async def generate_response(
        self,
        system_instruction: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
    ) -> str:
        last_msg = messages[-1]["content"].lower() if messages else ""

        if "viva" in last_msg or "quiz" in last_msg or "question" in last_msg:
            return (
                "### 🎓 Engineering Viva & Quiz Practice\n\n"
                "**Question 1:** Why should data be split into training and test sets *before* fitting scalers and imputers?\n"
                "- **Answer Hint:** If you fit a scaler or imputer on the full dataset, test set information leaks into training (Data Leakage), causing overly optimistic performance estimates.\n\n"
                "**Question 2:** When is the median preferred over the mean for missing value imputation?\n"
                "- **Answer Hint:** When the feature is skewed or has heavy outliers, because the median is a robust statistic (breakdown point = 50%), whereas a single extreme outlier can distort the mean.\n\n"
                "**Question 3:** What does an R² score of 0.82 signify in a regression model?\n"
                "- **Answer Hint:** It signifies that 82% of the variance in the target variable is explained by the features in the model."
            )

        if "clean" in last_msg or "missing" in last_msg or "outlier" in last_msg:
            return (
                "### 🧹 Data Cleaning Best Practices in Python\n\n"
                "To clean datasets safely with Pandas, follow this workflow:\n\n"
                "```python\n"
                "# 1. Inspect missing values\n"
                "missing_counts = df.isnull().sum()\n\n"
                "# 2. Median imputation for numeric features\n"
                "for col in df.select_dtypes(include=['number']).columns:\n"
                "    median_val = df[col].median()\n"
                "    df[col].fillna(median_val, inplace=True)\n\n"
                "# 3. Remove duplicate rows\n"
                "df.drop_duplicates(inplace=True)\n\n"
                "# 4. Detect outliers via IQR\n"
                "Q1 = df['feature'].quantile(0.25)\n"
                "Q3 = df['feature'].quantile(0.75)\n"
                "IQR = Q3 - Q1\n"
                "outliers = df[(df['feature'] < Q1 - 1.5 * IQR) | (df['feature'] > Q3 + 1.5 * IQR)]\n"
                "```\n\n"
                "> **Tip:** Always inspect the distribution before choosing an imputation strategy!"
            )

        if "visual" in last_msg or "plot" in last_msg or "chart" in last_msg or "seaborn" in last_msg:
            return (
                "### 📊 Visualizing Data with Seaborn & Matplotlib\n\n"
                "Here is an idiomatic Seaborn template for exploratory data analysis:\n\n"
                "```python\n"
                "import matplotlib.pyplot as plt\n"
                "import seaborn as sns\n\n"
                "# Set professional theme\n"
                "sns.set_theme(style='whitegrid', palette='deep')\n"
                "fig, ax = plt.subplots(figsize=(8, 5))\n\n"
                "# Distribution plot with Kernel Density Estimation (KDE)\n"
                "sns.histplot(data=df, x='feature_x', kde=True, color='#2563eb', ax=ax)\n"
                "ax.set_title('Feature Distribution Analysis', fontsize=12, fontweight='bold')\n"
                "plt.tight_layout()\n"
                "plt.show()\n"
                "```\n\n"
                "**Key questions to investigate:**\n"
                "1. Is the distribution Gaussian, bimodal, or long-tailed?\n"
                "2. Are there extreme leverage points on the margins?"
            )

        if "model" in last_msg or "machine learning" in last_msg or "random forest" in last_msg:
            return (
                "### 🤖 Supervised Machine Learning Workflow\n\n"
                "Using scikit-learn `Pipeline` and `ColumnTransformer` guarantees zero data leakage:\n\n"
                "```python\n"
                "from sklearn.compose import ColumnTransformer\n"
                "from sklearn.pipeline import Pipeline\n"
                "from sklearn.impute import SimpleImputer\n"
                "from sklearn.preprocessing import StandardScaler, OneHotEncoder\n"
                "from sklearn.ensemble import RandomForestClassifier\n\n"
                "num_transformer = Pipeline([('impute', SimpleImputer(strategy='median')), ('scale', StandardScaler())])\n"
                "cat_transformer = Pipeline([('impute', SimpleImputer(strategy='most_frequent')), ('onehot', OneHotEncoder())])\n\n"
                "preprocessor = ColumnTransformer([\n"
                "    ('num', num_transformer, numeric_cols),\n"
                "    ('cat', cat_transformer, categorical_cols)\n"
                "])\n\n"
                "pipeline = Pipeline([\n"
                "    ('prep', preprocessor),\n"
                "    ('rf', RandomForestClassifier(n_estimators=100, random_state=42))\n"
                "])\n"
                "pipeline.fit(X_train, y_train)\n"
                "```"
            )

        return (
            "### 💡 AI Smart Tutor Assistant\n\n"
            "I am ready to help you with your Data Exploration and Visualization Laboratory coursework!\n\n"
            "You can ask me to:\n"
            "1. **Explain dataset statistics:** Interpret mean, median, skewness, or correlation.\n"
            "2. **Debug Pandas / Matplotlib code:** Write idiomatic data transformations and charts.\n"
            "3. **Quiz your concepts:** Test your knowledge for viva exams and mini-project reviews.\n"
            "4. **Analyze ML evaluation:** Review Accuracy, Precision, Recall, F1, MAE, or R².\n\n"
            "*How would you like to proceed?*"
        )


def get_llm_provider() -> LLMProvider:
    """Instantiates the configured LLM provider or safely defaults to the offline tutor."""
    provider_name = settings.effective_provider
    api_key = settings.effective_api_key

    if provider_name == "deepseek" and api_key:
        return DeepSeekProvider(api_key=api_key, model=settings.effective_model, base_url=settings.DEEPSEEK_BASE_URL)
    elif provider_name == "gemini" and api_key:
        return GeminiProvider(api_key=api_key, model=settings.effective_model)
    elif provider_name == "openai" and api_key:
        return OpenAIProvider(api_key=api_key, model=settings.effective_model)
    else:
        # Default resilient academic tutor
        return OfflineEducatorProvider()
