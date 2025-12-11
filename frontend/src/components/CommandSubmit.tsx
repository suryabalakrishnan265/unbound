import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandsApi } from '../api/client';

interface Props {
    onSuccess?: () => void;
}

export default function CommandSubmit({ onSuccess }: Props) {
    const { apiKey } = useAuth();
    const [command, setCommand] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
        details?: string;
    } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || !apiKey) return;

        setIsSubmitting(true);
        setResult(null);

        try {
            const response = await commandsApi.submit(apiKey, command.trim());

            if (response.status === 'executed') {
                setResult({
                    type: 'success',
                    message: 'Command executed successfully',
                    details: `new balance: ${response.new_balance} credits`,
                });
                setCommand('');
                onSuccess?.();
            } else if (response.status === 'rejected') {
                setResult({
                    type: 'error',
                    message: 'Command rejected',
                    details: response.reason || response.message,
                });
            } else if (response.status === 'awaiting_approval') {
                setResult({
                    type: 'warning',
                    message: 'Command requires approval',
                    details: response.message,
                });
                setCommand('');
            } else {
                setResult({
                    type: 'warning',
                    message: `status: ${response.status}`,
                    details: response.message,
                });
            }
        } catch (err) {
            setResult({
                type: 'error',
                message: 'Failed to submit command',
                details: err instanceof Error ? err.message : 'Unknown error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const exampleCommands = [
        { cmd: 'ls -la', desc: 'list files [auto-accept]' },
        { cmd: 'git status', desc: 'git status [auto-accept]' },
        { cmd: 'sudo apt update', desc: 'sudo command [requires approval]' },
        { cmd: 'rm -rf /', desc: 'dangerous [auto-reject]' },
    ];

    const getResultClass = () => {
        if (result?.type === 'success') return 'alert-success';
        if (result?.type === 'error') return 'alert-error';
        return 'alert-warning';
    };

    const getResultPrefix = () => {
        if (result?.type === 'success') return '[OK]';
        if (result?.type === 'error') return '[ERR]';
        return '[WARN]';
    };

    return (
        <div className="space-y-4">
            {/* Command Input */}
            <div className="terminal-card">
                <div className="terminal-card-header">submit command</div>
                <div className="p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="flex space-x-3">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-green font-mono pointer-events-none">$</span>
                                <input
                                    type="text"
                                    value={command}
                                    onChange={(e) => setCommand(e.target.value)}
                                    placeholder="enter command..."
                                    className="terminal-input w-full font-mono"
                                    style={{ paddingLeft: '28px' }}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !command.trim()}
                                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span>submitting...</span>
                                    </>
                                ) : (
                                    <span>execute</span>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Result Display */}
                    {result && (
                        <div className={`alert ${getResultClass()} mt-4 animate-fade-in`}>
                            <span className="font-medium">{getResultPrefix()}</span>
                            <div className="flex-1">
                                <p>{result.message}</p>
                                {result.details && (
                                    <p className="text-sm opacity-80 mt-1">{result.details}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Example Commands */}
            <div className="terminal-card">
                <div className="terminal-card-header">examples</div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {exampleCommands.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => setCommand(ex.cmd)}
                                className="p-3 text-left bg-terminal-bg border border-terminal-border hover:border-accent-green transition-colors"
                            >
                                <code className="text-accent-green font-mono text-sm">
                                    $ {ex.cmd}
                                </code>
                                <p className="text-xs text-terminal-muted mt-1">{ex.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
