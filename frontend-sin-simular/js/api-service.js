const API_URL = "http://localhost:3000/api";

export function guardarToken(token) {
  localStorage.setItem("jwt", token);
}

export function obtenerToken() {
  return localStorage.getItem("jwt");
}

export function borrarToken() {
  localStorage.removeItem("jwt");
}

export function decodificarToken() {
  const token = obtenerToken();
  if (!token) return null;
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch (e) {
    console.error(e);
    borrarToken();
    return null;
  }
}

async function fetchConAuth(url, options = {}) {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: headers,
  };

  try {
    const response = await window.fetch(url, config);

    if (response.status === 401) {
      borrarToken();
      window.location.href = "../auth/login.html";
      throw new Error("Sesión expirada");
    }

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const fetch = (endpoint, options) => fetchConAuth(`${API_URL}${endpoint}`, options);

export async function login(email, password) {
  const response = await window.fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Error al iniciar sesión");
  }

  return data;
}

export function register(name, email, password) {
  return fetchConAuth(`${API_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function verifyAccount(token) {
  return fetchConAuth(`${API_URL}/auth/verify`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function forgotPassword(email) {
  return fetchConAuth(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token, newPassword) {
  return fetchConAuth(`${API_URL}/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getMiPerfil() {
  return fetchConAuth(`${API_URL}/users/me`);
}

export function updateMiPerfil(name, avatar_url) {
  return fetchConAuth(`${API_URL}/users/me`, {
    method: "PUT",
    body: JSON.stringify({ name, avatar_url }),
  });
}

export function getProjects() {
  return fetchConAuth(`${API_URL}/projects`);
}

export function createProject(name, description) {
  return fetchConAuth(`${API_URL}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function getProjectDetails(id) {
  return fetchConAuth(`${API_URL}/projects/${id}`);
}

export function deleteProject(id) {
  return fetchConAuth(`${API_URL}/projects/${id}`, {
    method: "DELETE",
  });
}

export function inviteUserToProject(projectId, email, role) {
  return fetchConAuth(`${API_URL}/projects/${projectId}/invite`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function createTaskExtended(projectId, taskData) {
  return fetchConAuth(`${API_URL}/tasks/project/${projectId}`, {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}

export function updateTask(taskId, taskData) {
  return fetchConAuth(`${API_URL}/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(taskData),
  });
}

export function deleteTask(taskId) {
  return fetchConAuth(`${API_URL}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export function getDashboardStats() {
  return fetchConAuth(`${API_URL}/stats/dashboard`);
}

export function getMyTasks() {
  return fetchConAuth(`${API_URL}/tasks/my-tasks`);
}

export function toggleTaskTimer(taskId) {
  return fetchConAuth(`${API_URL}/tasks/${taskId}/timer`, {
    method: "POST"
  });
}

export function getProjectMessages(projectId) {
  return fetchConAuth(`${API_URL}/projects/${projectId}/messages`);
}

export function getProjectActivity(projectId) {
  return fetchConAuth(`${API_URL}/projects/${projectId}/activity`);
}