import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!apiKey.trim()) {
            setError('Please enter your API key');
            setIsLoading(false);
            return;
        }

        const success = await login(apiKey.trim());

        if (!success) {
            setError('Invalid API key. Please try again.');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-terminal-bg">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-accent-green font-mono text-4xl font-bold mb-2">
                        {'>'}_
                    </div>
                    <h1 className="text-2xl font-semibold text-terminal-text mb-1">
                        command-gateway
                    </h1>
                    <p className="text-terminal-muted text-sm">secure execution system v1.0</p>
                </div>

                {/* Login Card */}
                <div className="terminal-card animate-fade-in">
                    <div className="terminal-card-header">
                        authenticate
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="apiKey" className="block text-xs text-terminal-muted mb-2 uppercase">
                                    API Key
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-green text-sm pointer-events-none">&gt;</span>
                                    <input
                                        id="apiKey"
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="enter api key..."
                                        className="terminal-input w-full pl-8"
                                        style={{ paddingLeft: '28px' }}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-error mb-4">
                                    <span className="font-medium">[ERR]</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="spinner mr-3"></span>
                                        authenticating...
                                    </span>
                                ) : (
                                    'login'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-terminal-border">
                            <p className="text-xs text-terminal-muted text-center">
                                contact administrator for API key access
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-xs text-terminal-dim">
                    <p>API key stored in request headers. Transmitted with each request.</p>
                </div>
            </div>
        </div>
    );
}
