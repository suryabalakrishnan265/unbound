const API_BASE =
    (import.meta.env.VITE_API_BASE || "https://unbound-backend-1.onrender.com/")
        .replace(/\/$/, "") + "/api";
console.log("API BASE (api.ts):", API_BASE);
interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    apiKey?: string | null;
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, apiKey } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (apiKey) {
        headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

// User API
export const userApi = {
    getMe: (apiKey: string) =>
        apiRequest<User>('/users/me', { apiKey }),

    getAll: (apiKey: string) =>
        apiRequest<User[]>('/users', { apiKey }),

    create: (apiKey: string, data: CreateUserData) =>
        apiRequest<{ user: User & { apiKey: string }; message: string }>('/users', {
            method: 'POST',
            apiKey,
            body: data
        }),

    update: (apiKey: string, id: string, data: UpdateUserData) =>
        apiRequest<User>(`/users/${id}`, { method: 'PUT', apiKey, body: data }),

    delete: (apiKey: string, id: string) =>
        apiRequest<{ message: string }>(`/users/${id}`, { method: 'DELETE', apiKey }),

    addCredits: (apiKey: string, id: string, amount: number) =>
        apiRequest<User>(`/users/${id}/credits`, { method: 'POST', apiKey, body: { amount } }),
};

// Rules API
export const rulesApi = {
    getAll: (apiKey: string) =>
        apiRequest<Rule[]>('/rules', { apiKey }),

    create: (apiKey: string, data: CreateRuleData) =>
        apiRequest<Rule>('/rules', { method: 'POST', apiKey, body: data }),

    update: (apiKey: string, id: string, data: UpdateRuleData) =>
        apiRequest<Rule>(`/rules/${id}`, { method: 'PUT', apiKey, body: data }),

    delete: (apiKey: string, id: string) =>
        apiRequest<{ message: string }>(`/rules/${id}`, { method: 'DELETE', apiKey }),

    test: (apiKey: string, pattern: string, testCommand: string) =>
        apiRequest<{ matches: boolean }>('/rules/test', {
            method: 'POST',
            apiKey,
            body: { pattern, testCommand }
        }),
};

// Commands API
export const commandsApi = {
    submit: (apiKey: string, command_text: string) =>
        apiRequest<CommandResponse>('/commands', {
            method: 'POST',
            apiKey,
            body: { command_text }
        }),

    getAll: (apiKey: string, limit = 50, offset = 0) =>
        apiRequest<{ commands: Command[]; total: number }>(`/commands?limit=${limit}&offset=${offset}`, { apiKey }),

    getOne: (apiKey: string, id: string) =>
        apiRequest<Command>(`/commands/${id}`, { apiKey }),

    getPending: (apiKey: string) =>
        apiRequest<Command[]>('/commands/pending/approvals', { apiKey }),

    approve: (apiKey: string, id: string, decision: 'approved' | 'rejected') =>
        apiRequest<ApprovalResponse>(`/commands/${id}/approve`, {
            method: 'POST',
            apiKey,
            body: { decision }
        }),

    resubmit: (apiKey: string, id: string) =>
        apiRequest<CommandResponse>(`/commands/${id}/resubmit`, { method: 'POST', apiKey }),
};

// Audit API
export const auditApi = {
    getAll: (apiKey: string, limit = 100, offset = 0) =>
        apiRequest<{ logs: AuditLog[]; total: number }>(`/audit?limit=${limit}&offset=${offset}`, { apiKey }),
};

// Types
export interface User {
    id: string;
    name: string;
    role: 'admin' | 'member';
    tier: 'junior' | 'senior' | 'lead';
    credits: number;
    createdAt: string;
    _count?: { commands: number };
}

export interface CreateUserData {
    name: string;
    role?: 'admin' | 'member';
    tier?: 'junior' | 'senior' | 'lead';
    credits?: number;
}

export interface UpdateUserData {
    name?: string;
    role?: 'admin' | 'member';
    tier?: 'junior' | 'senior' | 'lead';
    credits?: number;
}

export interface Rule {
    id: string;
    pattern: string;
    action: 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'REQUIRE_APPROVAL';
    priority: number;
    approvalThreshold: number;
    timeRestrictions: TimeRestrictions | null;
    createdAt: string;
    createdBy?: { name: string };
}

export interface TimeRestrictions {
    allowAutoAcceptDuring?: {
        days: number[];
        startHour: number;
        endHour: number;
    };
}

export interface CreateRuleData {
    pattern: string;
    action: 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'REQUIRE_APPROVAL';
    priority?: number;
    approvalThreshold?: number;
    timeRestrictions?: TimeRestrictions;
}

export interface UpdateRuleData {
    pattern?: string;
    action?: 'AUTO_ACCEPT' | 'AUTO_REJECT' | 'REQUIRE_APPROVAL';
    priority?: number;
    approvalThreshold?: number;
    timeRestrictions?: TimeRestrictions | null;
}

export interface Command {
    id: string;
    commandText: string;
    status: 'pending' | 'executed' | 'rejected' | 'awaiting_approval';
    createdAt: string;
    executedAt: string | null;
    user?: { name: string; tier?: string };
    matchedRule?: { pattern: string; action: string; approvalThreshold?: number };
    approvals?: { decision: string; approver: { name: string } }[];
}

export interface CommandResponse {
    id: string;
    status: string;
    message?: string;
    reason?: string;
    new_balance?: number;
    credits?: number;
}

export interface ApprovalResponse {
    success: boolean;
    commandStatus: string;
    message: string;
    newBalance?: number;
}

export interface AuditLog {
    id: string;
    action: string;
    details: Record<string, unknown>;
    createdAt: string;
    user: { name: string; role: string };
}
