const API_BASE = '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('smart_tutor_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('smart_tutor_token', token);
    } else {
      localStorage.removeItem('smart_tutor_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['X-Session-Token'] = this.token;
    }

    // Do not set Content-Type for FormData (file upload)
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Send and receive HttpOnly cookies
    };

    const response = await fetch(url, config);

    // Save X-Session-Token header if returned by server
    const headerToken = response.headers.get('X-Session-Token');
    if (headerToken) {
      this.setToken(headerToken);
    }

    if (response.status === 401) {
      this.setToken(null);
      // If unauthorized and not already on login/register, let UI handle redirect
    }

    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail
            .map((item: any) => {
              const field = item.loc && item.loc.length > 1 ? `${item.loc[item.loc.length - 1]}: ` : '';
              const text = item.msg || JSON.stringify(item);
              return `${field}${text}`;
            })
            .join(' | ');
        } else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
          errorMsg = JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMsg = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        } else if (typeof errorData === 'string') {
          errorMsg = errorData;
        }
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMsg);
    }

    // Handle empty response bodies (like 204 or delete)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiClient();
