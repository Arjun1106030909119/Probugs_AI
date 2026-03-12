import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, Clock, CheckCircle2, AlertCircle, Zap, ArrowRight, Bookmark, ShieldAlert } from 'lucide-react';

const SLATimer = ({ deadline, status }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!deadline || status === 'Resolved' || status === 'Closed') {
            setTimeLeft(status === 'Resolved' ? 'RESOLVED' : status === 'Closed' ? 'CLOSED' : '--:--:--');
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const dl = new Date(deadline);
            const diff = dl - now;

            if (diff <= 0) {
                setTimeLeft('EXPIRED');
                clearInterval(timer);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline, status]);

    return (
        <span className={`font-mono font-bold tracking-tighter ${timeLeft === 'EXPIRED' ? 'text-red-500' : 'text-slate-400'}`}>
            {timeLeft}
        </span>
    );
};

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        category: 'Hardware',
        priority: 'Low',
        description: ''
    });
    const socket = useSocket();

    useEffect(() => {
        const fetchTickets = async () => {
            if (authLoading || !user) return;
            try {
                const res = await axios.get('/api/tickets');
                setTickets(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [authLoading, user]);

    useEffect(() => {
        if (!socket || !user) return;

        socket.on('ticket_updated', (updatedTicket) => {
            // Only update if it's my ticket or I'm an agent/admin
            if (updatedTicket.user?._id === user._id || updatedTicket.user === user._id || user.role !== 'user') {
                setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
            }
        });

        socket.on('ticket_created', (newTicket) => {
            // Only add if it's my ticket and not already in state
            if (newTicket.user === user._id || user.role !== 'user') {
                setTickets(prev => {
                    if (prev.some(t => t._id === newTicket._id)) return prev;
                    return [newTicket, ...prev];
                });
            }
        });

        return () => {
            socket.off('ticket_updated');
            socket.off('ticket_created');
        };
    }, [socket, user]);

    const activeTicket = tickets.find(t => t.status !== 'Resolved' && t.status !== 'Closed');

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tickets', formData);
            // We rely on the 'ticket_created' socket listener to update the state
            // to avoid duplicate keys between HTTP response and Socket broadcast.
            setFormData({ title: '', category: 'Hardware', priority: 'Low', description: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Resolved': return <CheckCircle2 className="text-green-500" size={18} />;
            case 'In Progress': return <Clock className="text-blue-500" size={18} />;
            case 'Closed': return <Bookmark className="text-slate-500" size={18} />;
            default: return <AlertCircle className="text-yellow-500" size={18} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Closed': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    const getStatusStep = (status) => {
        switch (status) {
            case 'Open': return 1;
            case 'In Progress': return 2;
            case 'Resolved': return 3;
            case 'Closed': return 4;
            default: return 0;
        }
    };

    return (
        <div className="flex bg-slate-950 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Hello, {user?.name?.split(' ')[0]}</h1>
                        <p className="text-slate-400">Manage and track your IT tickets effortlessly.</p>
                    </div>
                </header>

                <div className="flex flex-col gap-8 max-w-5xl mx-auto">
                    {activeTicket && (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 border-l-4 border-l-purple-600 shadow-xl cursor-pointer hover:bg-slate-900/80 transition-all" onClick={() => navigate(`/tickets/${activeTicket._id}`)}>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">In-Flight Resolution</p>
                                    <h3 className="text-xl md:text-2xl font-bold text-white">#{activeTicket.ticketId}: {activeTicket.title}</h3>
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <ShieldAlert size={12} className="text-red-500" />
                                        Target: <SLATimer deadline={activeTicket.slaDeadline} status={activeTicket.status} />
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getStatusClass(activeTicket.status)}`}>
                                    {activeTicket.status}
                                </span>
                            </div>

                            <div className="relative mt-10 mb-6">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full"></div>
                                <div
                                    className="absolute top-1/2 left-0 h-1 bg-purple-600 -translate-y-1/2 rounded-full transition-all duration-1000"
                                    style={{ width: `${(getStatusStep(activeTicket.status) / 3) * 100}%` }}
                                ></div>
                                <div className="relative flex justify-between px-1">
                                    {['SUB', 'TRI', 'IP', 'RES'].map((step, idx) => {
                                        const currentStep = getStatusStep(activeTicket.status);
                                        const isActive = idx <= currentStep;
                                        return (
                                            <div key={idx} className={`flex flex-col items-center ${!isActive ? 'opacity-30' : ''}`}>
                                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-white ring-4 ring-slate-950 transition-all ${isActive ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                                    {idx < currentStep ? <CheckCircle2 size={12} className="md:size-[16px]" /> : idx === currentStep ? <Clock size={12} className="md:size-[16px]" /> : <CheckCircle2 size={12} className="md:size-[16px]" />}
                                                </div>
                                                <span className={`text-[8px] md:text-[10px] mt-3 font-bold uppercase tracking-wider ${isActive ? 'text-purple-500' : 'text-slate-500'}`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <Plus className="text-purple-500" /> New Trouble Report
                        </h2>
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="md:col-span-2">
                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Issue Summary</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all border-dashed"
                                    placeholder="Briefly describe the problem..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none appearance-none cursor-pointer"
                                >
                                    {['Hardware', 'Software', 'Network', 'Access', 'Cloud', 'HR', 'Security', 'Infrastructure', 'Documentation'].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Urgency</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleFormChange}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none appearance-none cursor-pointer"
                                >
                                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Full Details</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows="4"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 transition-all"
                                    placeholder="Provide logs, screenshots (URLs), or detailed steps to reproduce..."
                                    required
                                ></textarea>
                            </div>
                            <div className="md:col-span-2 p-6 bg-purple-600/5 border border-purple-500/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-all">
                                    <Zap size={60} />
                                </div>
                                <div className="flex items-center gap-2 text-purple-400 mb-2 relative z-10">
                                    <Zap size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Predictive Triage Engine</span>
                                </div>
                                <p className="text-sm text-slate-400 italic relative z-10">AI will analyze your description to route this to the most capable engineering branch instantly.</p>
                            </div>
                            <button
                                type="submit"
                                className="md:col-span-2 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-900/40 active:scale-[0.98] tracking-widest uppercase text-sm"
                            >
                                Dispatch Incident Report
                            </button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Incident History</h2>
                                <p className="text-xs text-slate-500 mt-1">Audit log of your submitted reports</p>
                            </div>
                            <button className="text-purple-500 text-xs font-bold uppercase tracking-widest hover:text-purple-400 transition-all flex items-center gap-2">
                                View Full Archive <Search size={14} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-8 animate-pulse">
                                            <div className="w-16 h-16 bg-slate-800 rounded-[1.2rem]" />
                                            <div className="flex-1 space-y-3">
                                                <div className="h-2 bg-slate-800 rounded w-24" />
                                                <div className="h-4 bg-slate-800 rounded w-3/4" />
                                            </div>
                                            <div className="w-24 h-6 bg-slate-800 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : tickets.filter(t => t._id !== activeTicket?._id).length === 0 ? (
                                <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-16 text-center text-slate-600 border-dashed">
                                    <AlertCircle size={32} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-medium tracking-tight">No past incidents recorded in the registry.</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {tickets
                                        .filter(ticket => ticket._id !== activeTicket?._id)
                                        .map(ticket => (
                                            <motion.div
                                                key={ticket._id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                layout
                                                className="bg-slate-900/40 border border-slate-800 hover:border-purple-600/30 p-4 md:p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 transition-all group cursor-pointer shadow-lg hover:shadow-purple-900/5"
                                                onClick={() => navigate(`/tickets/${ticket._id}`)}
                                            >
                                                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800/50 border border-slate-700 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:scale-105 transition-all shrink-0">
                                                    {getStatusIcon(ticket.status)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em]">{ticket.ticketId}</span>
                                                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                        <div className="flex items-center gap-1.5">
                                                            <ShieldAlert size={10} className="text-slate-600" />
                                                            <SLATimer deadline={ticket.slaDeadline} status={ticket.status} />
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-white text-base md:text-lg group-hover:text-purple-400 transition-all leading-snug truncate">{ticket.title}</h4>
                                                </div>
                                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                                                    <span className={`px-4 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] ${getStatusClass(ticket.status)}`}>
                                                        {ticket.status}
                                                    </span>
                                                    <div className="sm:opacity-0 group-hover:opacity-100 transition-all">
                                                        <ArrowRight size={14} className="text-purple-500" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
