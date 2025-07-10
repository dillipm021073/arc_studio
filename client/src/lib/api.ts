// API utility using native fetch
class ApiClient {
  private baseURL: string = '';

  constructor() {
    // Base URL is relative, so it will use the same host
    this.baseURL = '';
  }

  private async request<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Important for session cookies
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Only redirect to login if we're not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        
        let error: any;
        try {
          error = await response.json();
        } catch {
          error = { message: response.statusText };
        }
        
        const errorObj = new Error(error.message || error.error || 'Request failed');
        (errorObj as any).status = response.status;
        throw errorObj;
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      throw error;
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create and export the API client instance
export const api = new ApiClient();

// Helper function for React Query
export const fetcher = (url: string) => api.get(url).then(res => res.data);