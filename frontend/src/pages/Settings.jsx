import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
    User,
    Lock,
    Settings as SettingsIcon,
    Bell,
    Cpu,
    Shield,
    Save,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    Monitor,
    Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNotifications } from '../context/NotificationContext';

const Settings = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Form States
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [preferences, setPreferences] = useState({
        notifications: true,
        darkMode: true,
        aiAssistance: true,
        emailAlerts: false
    });

    useEffect(() => {
        if (user) {
            setProfileData({ name: user.name, email: user.email });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.put('/api/auth/updatedetails', profileData);
            setSuccess('Profile updated successfully');
            addNotification({
                title: 'Success',
                message: 'Your profile details have been synchronized.',
                type: 'success'
            });
            // Note: In a real app, you might want to update the global auth context here
            // For now, the user might need to refresh or we assume the context updates
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await axios.put('/api/auth/updatepassword', passwordData);
            setSuccess('Password updated successfully');
            addNotification({
                title: 'Security Update',
                message: 'Your neural access key has been rotated.',
                type: 'success'
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    if (user?.role === 'admin' || user?.role === 'agent') {
        tabs.push({ id: 'ai-config', label: 'AI Config', icon: Cpu });
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="flex bg-[#050505] min-h-screen text-white font-sans">
            <Sidebar />
            <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-6xl mx-auto w-full">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
                            <SettingsIcon className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                            <p className="text-slate-500 text-sm">Configure your neural node and interface preferences.</p>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Tabs Navigation */}
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 lg:w-64 flex-shrink-0">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap border ${isActive
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                                    {isActive && <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Tab Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -z-10" />

                                {error && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                                        <AlertCircle size={18} />
                                        {error}
                                    </motion.div>
                                )}

                                {success && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm">
                                        <CheckCircle2 size={18} />
                                        {success}
                                    </motion.div>
                                )}

                                {activeTab === 'account' && (
                                    <section>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-2xl font-bold text-purple-400 border border-slate-700 shadow-inner overflow-hidden">
                                                {user?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Account Identity</h2>
                                                <p className="text-slate-500 text-xs">Manage your neural identity and contact points.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Operator Name</label>
                                                    <input
                                                        type="text"
                                                        value={profileData.name}
                                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all font-medium text-slate-200"
                                                        placeholder="Full Name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Neural Address</label>
                                                    <input
                                                        type="email"
                                                        value={profileData.email}
                                                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all font-medium text-slate-200"
                                                        placeholder="Email Address"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <button
                                                    disabled={loading}
                                                    type="submit"
                                                    className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 rounded-2xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                                                >
                                                    <Save size={18} />
                                                    {loading ? 'Synchronizing...' : 'Save Profile'}
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                )}

                                {activeTab === 'preferences' && (
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-purple-600/10 rounded-3xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                                                <Monitor size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Interface Preferences</h2>
                                                <p className="text-slate-500 text-xs">Tailor your neural node experience to your workflow.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {[
                                                { id: 'notifications', title: 'Real-time Telemetry', desc: 'Receive live updates as system events occur.', icon: Bell },
                                                { id: 'darkMode', title: 'Deep Space Mode', desc: 'High-contrast dark interface for reduced eye strain.', icon: Smartphone },
                                                { id: 'aiAssistance', title: 'AI Co-pilot', desc: 'Enable predictive triage and smart summaries.', icon: Cpu },
                                                { id: 'emailAlerts', title: 'Transmission Archives', desc: 'Summary of neural activity sent to your email.', icon: Cloud },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl group hover:border-purple-500/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                                                            <item.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-200">{item.title}</h3>
                                                            <p className="text-slate-500 text-xs">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setPreferences({ ...preferences, [item.id]: !preferences[item.id] })}
                                                        className={`w-12 h-6 rounded-full transition-all relative ${preferences[item.id] ? 'bg-purple-600' : 'bg-slate-700'}`}
                                                    >
                                                        <motion.div
                                                            animate={{ x: preferences[item.id] ? 24 : 4 }}
                                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {activeTab === 'security' && (
                                    <section>
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                                                <Lock size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Access Security</h2>
                                                <p className="text-slate-500 text-xs">Maintain the integrity of your neural access keys.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Current Access Key</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all font-medium text-slate-200"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">New Access Key</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all font-medium text-slate-200"
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Confirm Key</label>
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500 transition-all font-medium text-slate-200"
                                                            placeholder="••••••••"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <button
                                                    disabled={loading}
                                                    type="submit"
                                                    className="flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-900 rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
                                                >
                                                    <Shield size={18} />
                                                    {loading ? 'Re-keying...' : 'Update Access'}
                                                </button>
                                            </div>
                                        </form>
                                    </section>
                                )}

                                {activeTab === 'ai-config' && (
                                    <section className="space-y-8">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                                                <Cpu size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold">Neural Parameters</h2>
                                                <p className="text-slate-500 text-xs">Global configuration for AI triaging and synthesis models.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                                <h3 className="font-bold mb-4 text-slate-200">Processing Threshold</h3>
                                                <input type="range" className="w-full accent-purple-600 mb-2" defaultValue={75} />
                                                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                    <span>75% Confidence</span>
                                                    <span>High Fidelity Only</span>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                                <h3 className="font-bold mb-4 text-slate-200">Model Selection</h3>
                                                <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none text-slate-300">
                                                    <option>Neural-Llama 4.0 (Recommended)</option>
                                                    <option>GPT-Prime Node</option>
                                                    <option>DeepMind Synapse v2</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-bold text-slate-200 px-2 uppercase text-[10px] tracking-[0.2em] mb-4">Autonomous Workflows</h3>
                                            {[
                                                { id: 'autoAssign', title: 'Autonomous Dispatch', desc: 'Auto-assign tickets to available agents based on category expertise.', icon: Cpu },
                                                { id: 'autoResolve', title: 'Self-Healing Protocol', desc: 'Automatically resolve common software issues via simulated patch deployment.', icon: Shield },
                                                { id: 'slaPredict', title: 'Predictive Escalate', desc: 'Auto-flag tickets at high risk of SLA breach before they expire.', icon: Bell },
                                            ].map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-3xl group hover:border-blue-500/20 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                                                            <item.icon size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-200">{item.title}</h3>
                                                            <p className="text-slate-500 text-xs">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="w-12 h-6 rounded-full transition-all relative bg-blue-600"
                                                    >
                                                        <motion.div
                                                            animate={{ x: 24 }}
                                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                                                        />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-8 flex justify-end">
                                            <button className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                                                <Cpu size={18} />
                                                Deploy Calibration
                                            </button>
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;
