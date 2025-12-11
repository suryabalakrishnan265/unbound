import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi, User, CreateUserData } from '../api/client';

export default function UsersManager() {
    const { apiKey, user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newUserKey, setNewUserKey] = useState<string | null>(null);
    const [creditsModal, setCreditsModal] = useState<{ userId: string; amount: number } | null>(null);

    const [formData, setFormData] = useState<CreateUserData>({
        name: '',
        role: 'member',
        tier: 'junior',
        credits: 100,
    });

    const fetchUsers = async () => {
        if (!apiKey) return;

        try {
            setIsLoading(true);
            const data = await userApi.getAll(apiKey);
            setUsers(data);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [apiKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        try {
            const result = await userApi.create(apiKey, formData);
            setNewUserKey(result.user.apiKey);
            await fetchUsers();
            setFormData({ name: '', role: 'member', tier: 'junior', credits: 100 });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create user');
        }
    };

    const handleDelete = async (id: string) => {
        if (!apiKey || !confirm('Delete this user?')) return;

        try {
            await userApi.delete(apiKey, id);
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    const handleAddCredits = async () => {
        if (!apiKey || !creditsModal) return;

        try {
            await userApi.addCredits(apiKey, creditsModal.userId, creditsModal.amount);
            await fetchUsers();
            setCreditsModal(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add credits');
        }
    };

    const getRoleBadge = (role: string) => {
        return role === 'admin' ? 'badge-purple' : 'badge-cyan';
    };

    const getTierBadge = (tier: string) => {
        const styles: Record<string, string> = {
            lead: 'badge-amber',
            senior: 'badge-green',
            junior: 'badge-gray',
        };
        return styles[tier] || 'badge-gray';
    };

    if (isLoading) {
        return (
            <div className="terminal-card p-8 text-center">
                <div className="spinner mx-auto"></div>
                <p className="text-terminal-muted mt-4 text-sm">loading users...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="terminal-card p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-terminal-text">users</h2>
                    <p className="text-xs text-terminal-muted">{users.length} registered</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-terminal flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>new user</span>
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="font-medium">[ERR]</span>
                    <span>{error}</span>
                </div>
            )}

            {/* New User API Key Display */}
            {newUserKey && (
                <div className="alert alert-success animate-fade-in">
                    <div className="flex-1">
                        <p className="font-medium mb-2">[OK] User created. Save this API key:</p>
                        <code className="code-block block mt-2">
                            {newUserKey}
                        </code>
                        <p className="text-xs mt-2 text-accent-amber">[WARN] This key will only be shown once</p>
                    </div>
                    <button
                        onClick={() => setNewUserKey(null)}
                        className="text-terminal-muted hover:text-terminal-text text-sm"
                    >
                        [x]
                    </button>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="terminal-card animate-fade-in">
                    <div className="terminal-card-header">new user</div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="terminal-input w-full"
                                    placeholder="john.doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })}
                                    className="terminal-input w-full"
                                >
                                    <option value="member">member</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">Tier</label>
                                <select
                                    value={formData.tier}
                                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'junior' | 'senior' | 'lead' })}
                                    className="terminal-input w-full"
                                >
                                    <option value="junior">junior</option>
                                    <option value="senior">senior</option>
                                    <option value="lead">lead</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">Credits</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.credits}
                                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                                    className="terminal-input w-full"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 pt-2">
                            <button type="submit" className="btn-primary">
                                create
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-terminal">
                                cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Credits Modal */}
            {creditsModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="terminal-card w-full max-w-sm animate-fade-in">
                        <div className="terminal-card-header">manage credits</div>
                        <div className="p-4">
                            <input
                                type="number"
                                value={creditsModal.amount}
                                onChange={(e) => setCreditsModal({ ...creditsModal, amount: Number(e.target.value) })}
                                className="terminal-input w-full mb-4"
                                placeholder="amount (negative to remove)"
                            />
                            <div className="flex space-x-3">
                                <button onClick={handleAddCredits} className="btn-primary">
                                    apply
                                </button>
                                <button onClick={() => setCreditsModal(null)} className="btn-terminal">
                                    cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="terminal-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Tier</th>
                                <th>Credits</th>
                                <th>Commands</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <span className="text-terminal-text">{user.name}</span>
                                        {user.id === currentUser?.id && (
                                            <span className="ml-2 text-xs text-accent-cyan">(you)</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${getRoleBadge(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${getTierBadge(user.tier)}`}>
                                            {user.tier}
                                        </span>
                                    </td>
                                    <td className="text-accent-amber">{user.credits}</td>
                                    <td className="text-terminal-muted">{user._count?.commands || 0}</td>
                                    <td>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCreditsModal({ userId: user.id, amount: 10 })}
                                                className="text-accent-amber hover:underline text-xs"
                                                title="Manage Credits"
                                            >
                                                [credits]
                                            </button>
                                            {user.id !== currentUser?.id && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-accent-red hover:underline text-xs"
                                                    title="Delete"
                                                >
                                                    [delete]
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
