import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    ShieldCheck,
    Bot,
    Clock,
    MoreVertical,
    Download,
    Calendar,
    Filter,
    RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        stats: { totalTickets: 0, slaCompliance: 0, aiAutomation: 0 },
        categoryStats: [],
        corrections: []
    });
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState('STREAM');
    const socket = useSocket();

    const fetchStats = async () => {
        if (authLoading || !user) return;
        try {
            const res = await axios.get('/api/analytics/dashboard');
            setStats(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [authLoading, user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('ticket_created', fetchStats);
        socket.on('ticket_updated', fetchStats);
        socket.on('ticket_deleted', fetchStats);

        return () => {
            socket.off('ticket_created');
            socket.off('ticket_updated');
            socket.off('ticket_deleted');
        };
    }, [socket]);

    // Removed absolute loading check to allow partial rendering with skeletons
    // if (loading) return ... 

    const macroStats = stats?.stats ? [
        { label: 'Cumulative Reports', value: (stats.stats?.totalTickets || 0).toLocaleString(), trend: '+12%', sub: 'CYCLE TOTAL', icon: BarChart3, color: 'text-purple-500' },
        { label: 'Operational MTTR', value: '2h 15m', trend: '-5%', sub: 'EFFICIENCY GAIN', icon: Clock, color: 'text-orange-500' },
        { label: 'SLA Integrity', value: `${stats.stats?.slaCompliance || 0}%`, trend: '+1.2%', sub: 'COMPLIANCE RATE', icon: ShieldCheck, color: 'text-green-500' },
        { label: 'Autonomous Rate', value: `${stats.stats?.aiAutomation || 0}%`, trend: '+4%', sub: 'AI RESOLUTION', icon: Bot, color: 'text-blue-500' },
    ] : [];

    return (
        <div className="flex bg-slate-950 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Admin Analytics & AI Performance</h1>
                        <p className="text-slate-400">Real-time monitoring of IT operations and automated model accuracy.</p>
                    </div>
                </header>

                <div className="flex flex-col gap-8 md:gap-12 max-w-7xl mx-auto">
                    {/* Sub-Navigation Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 mb-4">
                        <div className="flex items-center gap-8 mb-4 md:mb-0">
                            {['STREAM', 'VALIDATION', 'ASSIGNED', 'STRATEGIC'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveSubTab(tab)}
                                    className={`relative py-2 text-[10px] font-black tracking-[0.2em] transition-all ${activeSubTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {tab}
                                    {activeSubTab === tab && (
                                        <motion.div
                                            layoutId="activeSubTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                                <Filter size={14} /> FILTER
                            </button>
                            <button
                                onClick={fetchStats}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 transition-all active:scale-95"
                            >
                                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> SYNC
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {(activeSubTab === 'STREAM' || activeSubTab === 'STRATEGIC') && (
                            <motion.div
                                key="stats-grid"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
                            >
                                {loading ? (
                                    [1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 animate-pulse">
                                            <div className="h-2 bg-slate-800 rounded w-24 mb-6" />
                                            <div className="h-12 bg-slate-800 rounded w-32 mb-3" />
                                            <div className="h-2 bg-slate-800 rounded w-16" />
                                        </div>
                                    ))
                                ) : (
                                    macroStats.map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 group hover:border-slate-700 transition-all relative overflow-hidden shadow-xl"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-all">
                                                <stat.icon size={80} />
                                            </div>
                                            <div className="flex justify-between items-start mb-6 relative z-10">
                                                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">{stat.label}</span>
                                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border border-slate-800 shadow-inner ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                                    {stat.trend}
                                                </div>
                                            </div>
                                            <div className="text-5xl font-black text-white mb-3 tracking-tighter relative z-10">{stat.value}</div>
                                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest relative z-10">{stat.sub}</div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {(activeSubTab === 'STREAM' || activeSubTab === 'STRATEGIC') && (
                            <motion.div
                                key="volume-chart"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 h-auto md:h-[500px] relative shadow-2xl flex flex-col overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-8 md:mb-12">
                                    <div>
                                        <h2 className="text-xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase">Department Volume</h2>
                                        <p className="text-[10px] md:text-sm text-slate-500 font-medium italic">// Systematic categorization tracking.</p>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between h-[300px] gap-4 md:gap-10 px-2 md:px-8 mt-auto overflow-x-auto scrollbar-hide pb-4">
                                    {['Security', 'Hardware', 'Software', 'Network', 'Access', 'Cloud', 'Infrastructure'].map(cat => {
                                        const data = stats?.categoryStats?.find(s => s._id?.toLowerCase() === cat.toLowerCase()) || { count: 0 };
                                        const maxCount = Math.max(...(stats?.categoryStats?.map(s => s.count) || [1]));
                                        const heightPercentage = (data.count / (maxCount || 1)) * 100;

                                        return (
                                            <div key={cat} className="min-w-[50px] h-full flex flex-col justify-end items-center gap-4 md:gap-6 group">
                                                <div className="w-full bg-slate-800/50 rounded-xl md:rounded-2xl transition-all group-hover:bg-purple-600 relative border border-slate-800 group-hover:border-purple-500 group-hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                                                    style={{ height: `${Math.max(heightPercentage, 2)}%` }}>
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-purple-400 opacity-0 group-hover:opacity-100 transition-all tracking-widest bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                                        {data.count}
                                                    </div>
                                                </div>
                                                <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] md:tracking-[0.3em] uppercase">{cat === 'Infrastructure' ? 'INF' : cat.slice(0, 3)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {(activeSubTab === 'STREAM' || activeSubTab === 'VALIDATION') && (
                            <motion.div
                                key="audit-table"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl mb-12"
                            >
                                <div className="p-6 md:p-10 border-b border-slate-800 bg-slate-900/50">
                                    <h2 className="text-xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase">Neural Override Audit</h2>
                                    <p className="text-[10px] md:text-sm text-slate-500 font-medium italic">High-fidelity log of agent interventions.</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-950/40 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] border-b border-slate-800">
                                                <th className="px-6 md:px-10 py-6 whitespace-nowrap">Incident Node</th>
                                                <th className="px-6 md:px-10 py-6 whitespace-nowrap">Neural Prediction</th>
                                                <th className="px-6 md:px-10 py-6 whitespace-nowrap">Operational Override</th>
                                                <th className="px-6 md:px-10 py-6 whitespace-nowrap">Authorized Agent</th>
                                                <th className="px-6 md:px-10 py-6 text-right whitespace-nowrap">Sync State</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {stats?.corrections?.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-800/20 transition-all border-b border-slate-800/20 group cursor-pointer">
                                                    <td className="px-10 py-8 text-blue-500 font-bold text-sm tracking-widest">{row.ticketId}</td>
                                                    <td className="px-10 py-8">
                                                        <span className="px-3 py-1 bg-red-500/5 text-red-500 border border-red-500/10 rounded-full text-[10px] font-black uppercase tracking-widest">{row.aiCategory}</span>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <span className="px-3 py-1 bg-green-500/5 text-green-500 border border-green-500/10 rounded-full text-[10px] font-black uppercase tracking-widest">{row.category}</span>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-xs font-black text-purple-500 border border-slate-700">
                                                                {row.user?.name?.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm text-white font-bold">{row.user?.name}</span>
                                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(row.updatedAt).toLocaleTimeString()}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex items-center gap-3 justify-end">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Synchronization Complete</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeSubTab === 'ASSIGNED' && (
                            <motion.div
                                key="assigned-placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-[3rem]"
                            >
                                <Clock size={48} className="mb-4 opacity-20" />
                                <h3 className="text-xl font-black uppercase tracking-widest mb-2">My Nodes</h3>
                                <p className="text-sm italic">// No critical nodes assigned to your operative ID at this time.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
