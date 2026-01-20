const API_BASE = '/api';

export interface Endpoint {
  id: number;
  name: string;
  slug: string;
  secret_key: string;
  response_status: number;
  response_body: string;
  response_headers: Record<string, string>;
  delay_ms: number;
  enabled: boolean;
  created_at: string;
}

export interface Request {
  id: number;
  endpoint_id: number;
  method: string;
  headers: Record<string, string>;
  body: string;
  query_params: string;
  source_ip: string;
  content_type: string;
  received_at: string;
  endpoint?: Endpoint;
}

export interface RequestsResponse {
  requests: Request[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateEndpointPayload {
  name: string;
  slug?: string;
  secret_key?: string;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  delay_ms?: number;
  enabled?: boolean;
}

export interface UpdateEndpointPayload {
  name?: string;
  secret_key?: string;
  response_status?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  delay_ms?: number;
  enabled?: boolean;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Endpoints
  listEndpoints: () => fetchJson<Endpoint[]>(`${API_BASE}/endpoints`),

  getEndpoint: (id: number) => fetchJson<Endpoint>(`${API_BASE}/endpoints/${id}`),

  createEndpoint: (payload: CreateEndpointPayload) =>
    fetchJson<Endpoint>(`${API_BASE}/endpoints`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEndpoint: (id: number, payload: UpdateEndpointPayload) =>
    fetchJson<Endpoint>(`${API_BASE}/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteEndpoint: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/endpoints/${id}`, {
      method: 'DELETE',
    }),

  // Requests
  listRequests: (endpointId: number, limit = 50, offset = 0) =>
    fetchJson<RequestsResponse>(
      `${API_BASE}/endpoints/${endpointId}/requests?limit=${limit}&offset=${offset}`
    ),

  getRequest: (id: number) => fetchJson<Request>(`${API_BASE}/requests/${id}`),

  clearRequests: (endpointId: number) =>
    fetchJson<{ message: string; deleted: number }>(
      `${API_BASE}/endpoints/${endpointId}/requests`,
      { method: 'DELETE' }
    ),
};

export function getWebhookUrl(slug: string): string {
  const base = window.location.origin;
  return `${base}/hook/${slug}`;
}
