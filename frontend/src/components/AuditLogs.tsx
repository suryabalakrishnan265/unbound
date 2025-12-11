import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditApi, AuditLog } from '../api/client';

export default function AuditLogs() {
    const { apiKey } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const fetchLogs = async () => {
        if (!apiKey) return;

        try {
            setIsLoading(true);
            const data = await auditApi.getAll(apiKey);
            setLogs(data.logs);
            setTotal(data.total);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [apiKey]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('EXECUTED')) return 'text-accent-green';
        if (action.includes('REJECTED')) return 'text-accent-red';
        if (action.includes('CREATED')) return 'text-accent-cyan';
        if (action.includes('DELETED')) return 'text-accent-red';
        if (action.includes('APPROVAL') || action.includes('APPROVED')) return 'text-accent-purple';
        if (action.includes('ESCALATED')) return 'text-accent-amber';
        return 'text-terminal-text';
    };

    if (isLoading) {
        return (
            <div className="terminal-card p-8 text-center">
                <div className="spinner mx-auto"></div>
                <p className="text-terminal-muted mt-4 text-sm">loading audit logs...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="terminal-card p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-terminal-text">audit logs</h2>
                    <p className="text-xs text-terminal-muted">{total} entries</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="text-terminal-muted hover:text-accent-green text-xs"
                    title="Refresh"
                >
                    [refresh]
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="font-medium">[ERR]</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="terminal-card overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-terminal-muted">no audit logs yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-terminal-border">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="p-4 hover:bg-terminal-elevated transition-colors animate-fade-in"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                                        <span className={`font-semibold text-sm ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className="text-terminal-dim text-xs">by</span>
                                        <span className="text-terminal-text text-sm">{log.user.name}</span>
                                        <span className="badge badge-gray">{log.user.role}</span>
                                    </div>
                                    <span className="text-xs text-terminal-muted whitespace-nowrap ml-4">
                                        {formatDate(log.createdAt)}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                    className="text-xs text-terminal-muted hover:text-accent-cyan"
                                >
                                    {expandedLog === log.id ? '[hide details]' : '[show details]'}
                                </button>

                                {expandedLog === log.id && (
                                    <div className="code-block mt-3 text-xs animate-fade-in">
                                        <pre className="whitespace-pre-wrap overflow-x-auto text-terminal-text">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
