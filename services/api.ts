import { Profile, Site, Module, Subject, Message, Contribution, YearCurriculum, AcademicItem, Attendance } from '../types';

const API_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'http://localhost:3001/api';

// --- Types Helper ---
export type AuthResponse = {
    token: string;
    user: any;
};

// --- Generic Fetch ---
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Auto-detect JSON body
    const isJson = options.body && typeof options.body === 'string' && (options.body as string).startsWith('{');

    const headers: Record<string, string> = {
        ...(isJson && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) return null;

    return response.json();
}

// --- Services ---

export const auth = {
    login: async (email: string, password: string) => {
        try {
            const data = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data.user;
        } catch (e) {
            console.warn("API Login failed, using Mock fallback.");
            // Mock fallback used for dev if API down
            throw e;
        }
    },
    register: (data: any) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    },
    getCurrentUser: () => {
        const str = localStorage.getItem('user') || sessionStorage.getItem('user');
        return str ? JSON.parse(str) : null;
    },
    isAuthenticated: () => !!(localStorage.getItem('token') || sessionStorage.getItem('token')),
    getToken: () => localStorage.getItem('token') || sessionStorage.getItem('token'),
};

export const profiles = {
    getMe: () => fetchAPI('/profiles/me'),
    updateMe: (data: Partial<Profile>) => fetchAPI('/profiles/me', { method: 'PUT', body: JSON.stringify(data) }),
    getAll: (role?: string) => fetchAPI(`/profiles${role ? `?role=${role}` : ''}`),
    getById: (id: string) => fetchAPI(`/profiles/${id}`),
    updateStatus: (id: string, status: string) => fetchAPI(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    updateRole: (id: string, role: string) => fetchAPI(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify({ role }) }),
    delete: (id: string) => fetchAPI(`/profiles/${id}`, { method: 'DELETE' }),
};

export const sites = {
    getAll: () => fetchAPI('/sites'),
    create: (data: any) => fetchAPI('/sites', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/sites/${id}`, { method: 'DELETE' }),
    // Additional helpful method to assign resident
    assignResident: (siteId: string, residentId: string) => fetchAPI(`/sites/${siteId}/residents`, { method: 'POST', body: JSON.stringify({ residentId }) }),
    removeResident: (siteId: string, residentId: string) => fetchAPI(`/sites/${siteId}/residents/${residentId}`, { method: 'DELETE' }),
};

export const education = {
    getAllCurriculum: async (): Promise<YearCurriculum[]> => {
        const subjects = await fetchAPI('/subjects');
        // Transform flat subjects list to YearCurriculum if needed, or backend can provide this structure.
        // For now assuming backend returns flat list and frontend logic helps, or we adjust here.
        // Simple mapping:
        const curriculum: YearCurriculum[] = [];
        // Grouping logic would typically be here or handled by backend specific endpoint
        return curriculum; // Placeholder, better to specific endpoints
    },
    getSubjects: () => fetchAPI('/subjects'),
    createSubject: (data: any) => fetchAPI('/subjects', { method: 'POST', body: JSON.stringify(data) }),
    deleteSubject: (id: string) => fetchAPI(`/subjects/${id}`, { method: 'DELETE' }),

    getModules: (subjectId?: string) => fetchAPI(subjectId ? `/modules?subjectId=${subjectId}` : '/modules'),
    createModule: (data: any) => fetchAPI('/modules', { method: 'POST', body: JSON.stringify(data) }),
    deleteModule: (id: string) => fetchAPI(`/modules/${id}`, { method: 'DELETE' }),

    uploadFile: async (file: File, context: { moduleId?: string, subjectId?: string }) => {
        const formData = new FormData();
        formData.append('file', file);

        // 1. Upload to storage
        const uploadRes = await fetchAPI('/storage/upload', {
            method: 'POST',
            body: formData as any,
        });

        // 2. Create DB record
        return fetchAPI('/files', {
            method: 'POST',
            body: JSON.stringify({
                name: file.name,
                url: uploadRes.url,
                size: file.size,
                type: file.type,
                moduleId: context.moduleId,
                subjectId: context.subjectId
            })
        });
    },
    getFiles: () => fetchAPI('/files'),
    deleteFile: (id: string) => fetchAPI(`/files/${id}`, { method: 'DELETE' }),
};

export const messages = {
    getAll: () => fetchAPI('/messages'),
    send: (data: Partial<Message>) => fetchAPI('/messages', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/messages/${id}`, { method: 'DELETE' }),
    markAsRead: (id: string) => fetchAPI(`/messages/${id}/read`, { method: 'PATCH' }),
};

export const contributions = {
    getAll: () => fetchAPI('/contributions'),
    create: (data: any) => fetchAPI('/contributions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/contributions/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string) => fetchAPI(`/contributions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const leisure = {
    getEvents: () => fetchAPI('/leisure/events'),
    createEvent: (data: any) => fetchAPI('/leisure/events', { method: 'POST', body: JSON.stringify(data) }),
    deleteEvent: (id: string) => fetchAPI(`/leisure/events/${id}`, { method: 'DELETE' }),
    joinEvent: (eventId: string) => fetchAPI(`/leisure/events/${eventId}/join`, { method: 'POST' }),
    updateParticipantStatus: (eventId: string, participantId: string, status: string) => fetchAPI(`/leisure/events/${eventId}/participants/${participantId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    getContributions: () => fetchAPI('/leisure/contributions'),
    addContribution: (data: any) => fetchAPI('/leisure/contributions', { method: 'POST', body: JSON.stringify(data) }),
    deleteContribution: (id: string) => fetchAPI(`/leisure/contributions/${id}`, { method: 'DELETE' }),
};

export const attendance = {
    getMyAttendance: () => fetchAPI('/attendance/me'),
    getPending: () => fetchAPI('/attendance/pending'), // Admin 
    getAll: (filters?: { startDate?: string; endDate?: string; status?: string }) => {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.status) params.append('status', filters.status);
        return fetchAPI(`/attendance/all?${params.toString()}`);
    },
    declare: (itemType: string, itemId?: string) => fetchAPI('/attendance', { method: 'POST', body: JSON.stringify({ itemType, itemId }) }),
    validate: (id: string, status: 'confirmed' | 'rejected') => fetchAPI(`/attendance/${id}/validate`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => fetchAPI(`/attendance/${id}`, { method: 'DELETE' }),
    exportCSV: (filters?: { startDate?: string; endDate?: string; status?: string }) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.status) params.append('status', filters.status);

        return fetch(`${API_URL}/attendance/export?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.blob());
    },
};

export const settings = {
    getAll: () => fetchAPI('/settings'),
    update: (key: string, value: string) => fetchAPI(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
};

export const dashboard = {
    getStats: async () => {
        // Aggregated calls or specific dashboard endpoint if available
        // If no specific endpoint, we parallel fetch
        const [users, modules, files, sites] = await Promise.all([
            fetchAPI('/profiles?count=true').catch(() => ({ count: 0 })), // Assuming backend supports this or we just get array length
            fetchAPI('/modules').then(res => ({ count: res.length })).catch(() => ({ count: 0 })),
            fetchAPI('/files').then(res => ({ count: res.length })).catch(() => ({ count: 0 })),
            fetchAPI('/sites').then(res => ({ count: res.length })).catch(() => ({ count: 0 })),
        ]);
        return {
            userCount: users.count || users.length || 0,
            moduleCount: modules.count,
            fileCount: files.count,
            siteCount: sites.count,
        };
    }
};

export default {
    auth,
    profiles,
    sites,
    education,
    messages,
    contributions,
    leisure,
    attendance,
    settings,
    dashboard
};
