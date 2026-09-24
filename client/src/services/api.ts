// MarketMind AI - API Client Service
// Connects React frontend to Express backend at http://localhost:5000/api/v1

const API_BASE = 'http://localhost:5000/api/v1';

// --- Auth Token Storage ---
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('mm_token', token);
  } else {
    localStorage.removeItem('mm_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('mm_token');
  }
  return authToken;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// --- Auth Endpoints ---

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  storeName?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Registration failed');
  return json;
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Login failed');
  if (json.accessToken) {
    setAuthToken(json.accessToken);
  }
  return json;
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to get user profile');
  return json;
}

// --- Catalog Endpoints ---

export async function fetchProducts(params?: {
  search?: string;
  categoryId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.categoryId) query.set('categoryId', params.categoryId);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/catalog/products?${query.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch products');
  return json;
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/catalog/categories`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch categories');
  return json;
}

export async function createProduct(data: {
  categoryId: string;
  title: string;
  description: string;
  tags?: string[];
  seoTitle?: string;
  seoDesc?: string;
  status?: string;
}) {
  const res = await fetch(`${API_BASE}/catalog/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create product');
  return json;
}

// --- Order Endpoints ---

export async function checkout(items: Array<{ variantId: string; quantity: number }>) {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ idempotencyKey, items })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Checkout failed');
  return json;
}

export async function getMyOrders() {
  const res = await fetch(`${API_BASE}/orders/my-orders`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch orders');
  return json;
}

// --- AI Endpoints ---

export async function generateSellerListing(data: {
  productName: string;
  category: string;
  roughNotes: string;
  targetAudience?: string;
}) {
  const res = await fetch(`${API_BASE}/ai/seller-copilot/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'AI listing generation failed');
  return json;
}

export async function approveSellerListing(productId: string) {
  const res = await fetch(`${API_BASE}/ai/seller-copilot/approve/${productId}`, {
    method: 'POST',
    headers: authHeaders()
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to approve listing');
  return json;
}

export async function supportChat(query: string, orderId?: string) {
  const res = await fetch(`${API_BASE}/ai/support/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ query, orderId })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Support chat failed');
  return json;
}

export async function getRecommendations(categoryId?: string, limit?: number) {
  const query = new URLSearchParams();
  if (categoryId) query.set('categoryId', categoryId);
  if (limit) query.set('limit', String(limit));

  const res = await fetch(`${API_BASE}/ai/recommendations?${query.toString()}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch recommendations');
  return json;
}

export async function getInventoryForecast() {
  const res = await fetch(`${API_BASE}/ai/inventory/forecast`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch inventory forecast');
  return json;
}

export async function investigateAnomalies() {
  const res = await fetch(`${API_BASE}/ai/anomalies/investigate`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to investigate anomalies');
  return json;
}
