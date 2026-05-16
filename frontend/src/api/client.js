const BASE_URL = 'http://127.0.0.1:8000';

export const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
  const token = localStorage.getItem('access_token');
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    if (body instanceof FormData) {
      delete config.headers['Content-Type'];
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = response.status === 204 ? null : await response.json();

    if (!response.ok) {
      const error = new Error(data?.detail || 'An API error occurred');
      error.status = response.status;
      throw error;
    }

    return { data, status: response.status };
  } catch (err) {
    return Promise.reject(err);
  }
};
