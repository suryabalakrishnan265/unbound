import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandsApi, Command } from '../api/client';

export default function CommandHistory() {
    const { apiKey } = useAuth();
    const [commands, setCommands] = useState<Command[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCommands = async () => {
        if (!apiKey) return;

        try {
            setIsLoading(true);
            const data = await commandsApi.getAll(apiKey);
            setCommands(data.commands);
            setTotal(data.total);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch commands');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommands();
    }, [apiKey]);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            executed: 'status-executed',
            rejected: 'status-rejected',
            pending: 'status-pending',
            awaiting_approval: 'status-awaiting',
        };
        return styles[status] || 'badge-gray';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            executed: 'EXEC',
            rejected: 'FAIL',
            pending: 'PEND',
            awaiting_approval: 'WAIT',
        };
        return labels[status] || status.toUpperCase();
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
                <p className="text-terminal-muted mt-4 text-sm">loading history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="terminal-card p-8 text-center">
                <p className="text-accent-red mb-4">[ERR] {error}</p>
                <button onClick={fetchCommands} className="btn-primary">
                    retry
                </button>
            </div>
        );
    }

    return (
        <div className="terminal-card overflow-hidden">
            <div className="terminal-card-header flex items-center justify-between">
                <span>command history</span>
                <div className="flex items-center space-x-4">
                    <span className="text-terminal-text">{total} total</span>
                    <button
                        onClick={fetchCommands}
                        className="text-terminal-text hover:text-accent-green text-xs"
                        title="Refresh"
                    >
                        [refresh]
                    </button>
                </div>
            </div>

            {commands.length === 0 ? (
                <div className="p-8 text-center">
                    <p className="text-terminal-muted">no commands submitted yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Command</th>
                                <th>Status</th>
                                <th>Rule</th>
                                <th>Submitted</th>
                                <th>Executed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commands.map((cmd) => (
                                <tr key={cmd.id} className="animate-fade-in">
                                    <td>
                                        <code className="text-accent-green font-mono text-sm">
                                            {cmd.commandText}
                                        </code>
                                    </td>
                                    <td>
                                        <span className={`status-tag ${getStatusBadge(cmd.status)}`}>
                                            {getStatusLabel(cmd.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {cmd.matchedRule ? (
                                            <span className="text-xs text-terminal-muted font-mono">
                                                {cmd.matchedRule.pattern.substring(0, 25)}
                                                {cmd.matchedRule.pattern.length > 25 && '...'}
                                            </span>
                                        ) : (
                                            <span className="text-terminal-dim">-</span>
                                        )}
                                    </td>
                                    <td className="text-xs text-terminal-muted">
                                        {formatDate(cmd.createdAt)}
                                    </td>
                                    <td className="text-xs text-terminal-muted">
                                        {cmd.executedAt ? formatDate(cmd.executedAt) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
