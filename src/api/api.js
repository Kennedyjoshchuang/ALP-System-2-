// src/api/api.js
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? `http://${window.location.hostname}:5000/api` : '/api');

/**
 * Centralised helper for all API calls.
 * @param {string} endpoint   Path without leading slash, e.g. "customers"
 * @param {object} [options]  fetch options (method, headers, body, etc.)
 * @returns {Promise<any>}    Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}/${endpoint}`;
  const defaultHeaders = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) errMsg = parsed.error;
    } catch (e) {
      // Not JSON, use raw text
    }
    throw new Error(errMsg);
  }
  // 204 No Content → undefined
  if (response.status === 204) return undefined;
  
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

