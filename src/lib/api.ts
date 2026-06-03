import { Platform } from 'react-native';
import { secureStorage } from './secure-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchFromBackend(endpoint: string, method = 'GET', body: any = null) {
  // Try to retrieve access token from storage
  let token = null;
  try {
    token = await secureStorage.getItem('access_token');
  } catch (e) {
    console.warn('Error reading token from storage:', e);
  }

  const headers: Record<string, string> = {};
  
  if (body instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    options.body = body instanceof URLSearchParams ? body.toString() : JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);

  if (response.status === 401) {
    try {
      await secureStorage.removeItem('access_token');
    } catch {}
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Server error (${response.status})`);
  }

  const resJson = await response.json();
  if (resJson && typeof resJson === 'object' && resJson.success === true && 'data' in resJson) {
    return resJson.data;
  }
  return resJson;
}

export const api = {
  get: (endpoint: string) => fetchFromBackend(endpoint, 'GET'),
  post: (endpoint: string, body?: any) => fetchFromBackend(endpoint, 'POST', body),
  patch: (endpoint: string, body?: any) => fetchFromBackend(endpoint, 'PATCH', body),
  delete: (endpoint: string) => fetchFromBackend(endpoint, 'DELETE'),
};
