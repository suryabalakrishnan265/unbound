import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { commandsApi } from '../api/client';
import CommandSubmit from './CommandSubmit';
import CommandHistory from './CommandHistory';
import RulesManager from './RulesManager';
import UsersManager from './UsersManager';
import AuditLogs from './AuditLogs';
import ApprovalQueue from './ApprovalQueue';

type Tab = 'commands' | 'history' | 'approvals' | 'rules' | 'users' | 'audit';

interface Notification {
    id: string;
    message: string;
    type: 'success' | 'info';
}

export default function Dashboard() {
    const { user, logout, refreshUser, apiKey } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('commands');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const checkRecentCommands = async () => {
            if (!apiKey || !user) return;

            try {
                const data = await commandsApi.getAll(apiKey, 10, 0);
                const recentExecuted = data.commands.filter(cmd => {
                    if (cmd.status !== 'executed' || !cmd.executedAt) return false;
                    if (cmd.user?.name !== user.name) return false;
                    const executedTime = new Date(cmd.executedAt).getTime();
                    const now = Date.now();
                    return (now - executedTime) < 5 * 60 * 1000;
                });

                if (recentExecuted.length > 0) {
                    const newNotifications = recentExecuted.map(cmd => ({
                        id: cmd.id,
                        message: `Command "${cmd.commandText}" was approved and executed`,
                        type: 'success' as const,
                    }));
                    setNotifications(newNotifications);
                }
            } catch (error) {
                console.error('Failed to check recent commands:', error);
            }
        };

        checkRecentCommands();
        const interval = setInterval(checkRecentCommands, 30000);
        return () => clearInterval(interval);
    }, [apiKey]);

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
        { id: 'commands', label: 'SUBMIT' },
        { id: 'history', label: 'HISTORY' },
        { id: 'approvals', label: 'APPROVALS', adminOnly: true },
        { id: 'rules', label: 'RULES', adminOnly: true },
        { id: 'users', label: 'USERS', adminOnly: true },
        { id: 'audit', label: 'LOGS', adminOnly: true },
    ];

    const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

    return (
        <div className="min-h-screen bg-terminal-bg">
            {/* Header */}
            <header className="bg-terminal-surface border-b border-terminal-border">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="text-accent-green font-mono text-lg font-bold">
                            {'>'}_
                        </div>
                        <div>
                            <h1 className="text-base font-semibold text-terminal-text">command-gateway</h1>
                            <p className="text-xs text-terminal-muted">secure execution system</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Credits Display */}
                        <div className="flex items-center space-x-2 text-sm">
                            <span className="text-terminal-muted">credits:</span>
                            <span className="text-accent-amber font-semibold">{user?.credits}</span>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                                <p className="text-terminal-text">{user?.name}</p>
                                <p className="text-xs text-terminal-muted">
                                    {user?.role}:{user?.tier}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="btn-terminal px-3 py-1.5 text-xs"
                                title="Logout"
                            >
                                exit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex border-t border-terminal-border">
                        {filteredTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                [{tab.label}]
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Notifications Banner */}
            {notifications.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 pt-4">
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            className="alert alert-success mb-2 animate-fade-in"
                        >
                            <span className="text-accent-green font-medium">[OK]</span>
                            <span className="flex-1">{notif.message}</span>
                            <button
                                onClick={() => dismissNotification(notif.id)}
                                className="text-terminal-muted hover:text-terminal-text text-sm"
                            >
                                [x]
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="animate-fade-in">
                    {activeTab === 'commands' && <CommandSubmit onSuccess={refreshUser} />}
                    {activeTab === 'history' && <CommandHistory />}
                    {activeTab === 'approvals' && isAdmin && <ApprovalQueue />}
                    {activeTab === 'rules' && isAdmin && <RulesManager />}
                    {activeTab === 'users' && isAdmin && <UsersManager />}
                    {activeTab === 'audit' && isAdmin && <AuditLogs />}
                </div>
            </main>
        </div>
    );
}
