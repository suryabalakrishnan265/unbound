import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rulesApi, Rule, CreateRuleData } from '../api/client';

export default function RulesManager() {
    const { apiKey } = useAuth();
    const [rules, setRules] = useState<Rule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    const [formData, setFormData] = useState<CreateRuleData>({
        pattern: '',
        action: 'AUTO_ACCEPT',
        priority: 0,
        approvalThreshold: 1,
    });

    const fetchRules = async () => {
        if (!apiKey) return;

        try {
            setIsLoading(true);
            const data = await rulesApi.getAll(apiKey);
            setRules(data);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch rules');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [apiKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) return;

        try {
            if (editingRule) {
                await rulesApi.update(apiKey, editingRule.id, formData);
            } else {
                await rulesApi.create(apiKey, formData);
            }
            await fetchRules();
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save rule');
        }
    };

    const handleDelete = async (id: string) => {
        if (!apiKey || !confirm('Delete this rule?')) return;

        try {
            await rulesApi.delete(apiKey, id);
            await fetchRules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete rule');
        }
    };

    const handleEdit = (rule: Rule) => {
        setEditingRule(rule);
        setFormData({
            pattern: rule.pattern,
            action: rule.action,
            priority: rule.priority,
            approvalThreshold: rule.approvalThreshold,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingRule(null);
        setFormData({
            pattern: '',
            action: 'AUTO_ACCEPT',
            priority: 0,
            approvalThreshold: 1,
        });
    };

    const getActionBadge = (action: string) => {
        const styles: Record<string, string> = {
            AUTO_ACCEPT: 'badge-green',
            AUTO_REJECT: 'badge-red',
            REQUIRE_APPROVAL: 'badge-purple',
        };
        return styles[action] || 'badge-gray';
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            AUTO_ACCEPT: 'ACCEPT',
            AUTO_REJECT: 'REJECT',
            REQUIRE_APPROVAL: 'APPROVAL',
        };
        return labels[action] || action;
    };

    if (isLoading) {
        return (
            <div className="terminal-card p-8 text-center">
                <div className="spinner mx-auto"></div>
                <p className="text-terminal-muted mt-4 text-sm">loading rules...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="terminal-card p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-terminal-text">rules</h2>
                    <p className="text-xs text-terminal-muted">{rules.length} configured</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-terminal flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>new rule</span>
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <span className="font-medium">[ERR]</span>
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="terminal-card animate-fade-in">
                    <div className="terminal-card-header">
                        {editingRule ? 'edit rule' : 'new rule'}
                    </div>
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">
                                    Pattern (Regex)
                                </label>
                                <input
                                    type="text"
                                    value={formData.pattern}
                                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                                    className="terminal-input w-full font-mono"
                                    placeholder="^ls|cat|echo"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">
                                    Action
                                </label>
                                <select
                                    value={formData.action}
                                    onChange={(e) => setFormData({ ...formData, action: e.target.value as CreateRuleData['action'] })}
                                    className="terminal-input w-full"
                                >
                                    <option value="AUTO_ACCEPT">Auto Accept</option>
                                    <option value="AUTO_REJECT">Auto Reject</option>
                                    <option value="REQUIRE_APPROVAL">Require Approval</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-terminal-muted mb-1.5 uppercase">
                                    Priority
                                </label>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                    className="terminal-input w-full"
                                />
                            </div>
                            {formData.action === 'REQUIRE_APPROVAL' && (
                                <div>
                                    <label className="block text-xs text-terminal-muted mb-1.5 uppercase">
                                        Approval Threshold
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.approvalThreshold}
                                        onChange={(e) => setFormData({ ...formData, approvalThreshold: Number(e.target.value) })}
                                        className="terminal-input w-full"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-3 pt-2">
                            <button type="submit" className="btn-primary">
                                {editingRule ? 'update' : 'create'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn-terminal">
                                cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rules Table */}
            <div className="terminal-card overflow-hidden">
                {rules.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-terminal-muted">no rules configured</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Pri</th>
                                    <th>Pattern</th>
                                    <th>Action</th>
                                    <th>Threshold</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule) => (
                                    <tr key={rule.id}>
                                        <td className="text-center text-terminal-text">{rule.priority}</td>
                                        <td>
                                            <code className="text-accent-green font-mono text-sm">{rule.pattern}</code>
                                        </td>
                                        <td>
                                            <span className={`badge ${getActionBadge(rule.action)}`}>
                                                {getActionLabel(rule.action)}
                                            </span>
                                        </td>
                                        <td className="text-center text-terminal-muted">{rule.approvalThreshold}</td>
                                        <td>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(rule)}
                                                    className="text-accent-cyan hover:underline text-xs"
                                                    title="Edit"
                                                >
                                                    [edit]
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rule.id)}
                                                    className="text-accent-red hover:underline text-xs"
                                                    title="Delete"
                                                >
                                                    [delete]
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
