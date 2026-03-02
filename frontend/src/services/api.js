import axios from 'axios';

// Dev: Vite proxy handles /api → localhost:5000
// Production (Vercel): VITE_API_URL points to VPS backend
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    adminLogin: (email, password) => api.post('/auth/admin-login', { email, password }),
};

export const interviewApi = {
    getStatus: () => api.get('/interview/status'),
    start: (topic) => api.get(`/interview/start/${topic}`),
    chat: (topic, history, isFinished, sessionId) => api.post('/interview/chat', { topic, history, isFinished, sessionId }),
    submit: (topic, qaPairs, sessionId) => api.post('/interview/submit', { topic, qaPairs, sessionId }),
    complete: (topic, transcript) => api.post('/interview/complete', { topic, transcript }),
    createWebCall: (topic) => api.post('/interview/create-web-call', { topic }),
};


export const adminApi = {
    getBatches: () => api.get('/admin/batches'),
    toggleTopic: (batchCode, topic, unlocked) => api.put(`/admin/batches/${batchCode}/topic/${topic}`, { unlocked }),
    createBatch: (batchCode) => api.post('/admin/batches', { batchCode }),
    getStudents: () => api.get('/admin/students'),
    getResults: () => api.get('/admin/results'),
    resetStudentTopic: (email, topic) => api.delete(`/admin/students/${encodeURIComponent(email)}/reset/${topic}`),
};

export default api;
