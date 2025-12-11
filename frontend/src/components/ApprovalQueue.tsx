import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandsApi, Command } from '../api/client';

export default function ApprovalQueue() {
    const { apiKey } = useAuth();
    const [pendingCommands, setPendingCommands] = useState<Command[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPending = async () => {
        if (!apiKey) return;

        try {
            setIsLoading(true);
            const data = await commandsApi.getPending(apiKey);
            setPendingCommands(data);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch pending approvals');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, [apiKey]);

    const handleApproval = async (commandId: string, decision: 'approved' | 'rejected') => {
        if (!apiKey) return;

        setActionLoading(commandId);
        try {
            await commandsApi.approve(apiKey, commandId, decision);
            await fetchPending();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process approval');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="terminal-card p-8 text-center">
                <div className="spinner mx-auto"></div>
                <p className="text-terminal-muted mt-4 text-sm">loading pending approvals...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="terminal-card p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-terminal-text">approval queue</h2>
                    <p className="text-xs text-terminal-muted">{pendingCommands.length} pending</p>
                </div>
                <button
                    onClick={fetchPending}
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

            {pendingCommands.length === 0 ? (
                <div className="terminal-card p-8 text-center">
                    <p className="text-terminal-muted">no commands pending approval</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {pendingCommands.map((cmd) => (
                        <div key={cmd.id} className="terminal-card animate-fade-in">
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <span className="text-xs text-terminal-muted">user:</span>
                                            <span className="text-terminal-text">{cmd.user?.name}</span>
                                            <span className="badge badge-gray">{cmd.user?.tier}</span>
                                        </div>

                                        <div className="code-block mb-3">
                                            <span className="text-accent-green">$</span> {cmd.commandText}
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs text-terminal-muted">
                                            <div>
                                                <span className="text-terminal-dim">pattern:</span>{' '}
                                                <code className="text-terminal-text">{cmd.matchedRule?.pattern}</code>
                                            </div>
                                            <div>
                                                <span className="text-terminal-dim">required:</span>{' '}
                                                {cmd.matchedRule?.approvalThreshold}
                                            </div>
                                            <div>
                                                <span className="text-terminal-dim">received:</span>{' '}
                                                {cmd.approvals?.filter(a => a.decision === 'approved').length || 0}
                                            </div>
                                            <div>
                                                <span className="text-terminal-dim">submitted:</span>{' '}
                                                {formatDate(cmd.createdAt)}
                                            </div>
                                        </div>

                                        {cmd.approvals && cmd.approvals.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {cmd.approvals.map((approval, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`badge ${approval.decision === 'approved' ? 'badge-green' : 'badge-red'}`}
                                                    >
                                                        {approval.approver.name}: {approval.decision}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-2 ml-4">
                                        <button
                                            onClick={() => handleApproval(cmd.id, 'approved')}
                                            disabled={actionLoading === cmd.id}
                                            className="btn-success px-4 py-2 flex items-center space-x-2 disabled:opacity-50"
                                        >
                                            {actionLoading === cmd.id ? (
                                                <span className="spinner"></span>
                                            ) : (
                                                <span>approve</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleApproval(cmd.id, 'rejected')}
                                            disabled={actionLoading === cmd.id}
                                            className="btn-danger px-4 py-2 flex items-center space-x-2"
                                        >
                                            <span>reject</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
