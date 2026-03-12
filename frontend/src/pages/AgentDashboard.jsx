import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    Zap,
    ShieldCheck,
    Server,
    FileText,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        <span className={`font-mono font-bold tracking-tighter ${timeLeft === 'EXPIRED' ? 'text-red-500' : 'text-slate-500'}`}>
            {timeLeft}
        </span>
    );
};

const AgentDashboard = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const handleResolve = async (e, ticketId) => {
        e.stopPropagation(); // Prevent navigation to detail page
        try {
            await axios.put(`/api/tickets/${ticketId}`, { status: 'Resolved' });
            // Add activity log
            await axios.post(`/api/tickets/${ticketId}/activity`, {
                message: 'Ticket marked as resolved via dashboard quick action.',
                type: 'status_change'
            });
            // Update local state
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'Resolved' } : t));
        } catch (err) {
            console.error('Error resolving ticket:', err);
            alert('Failed to resolve ticket: ' + (err.response?.data?.error || err.message));
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('ticket_created', (newTicket) => {
            setTickets(prev => {
                if (prev.some(t => t._id === newTicket._id)) return prev;
                return [newTicket, ...prev];
            });
        });

        socket.on('ticket_updated', (updatedTicket) => {
            setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
        });

        socket.on('ticket_deleted', (ticketId) => {
            setTickets(prev => prev.filter(t => t._id !== ticketId));
        });

        return () => {
            socket.off('ticket_created');
            socket.off('ticket_updated');
            socket.off('ticket_deleted');
        };
    }, [socket]);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'High': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-green-500 bg-green-500/10 border-green-500/20';
        }
    };

    const getCategoryBadge = (category) => {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider h-fit">
                <Zap size={12} />
                {category}
            </div>
        );
    };

    return (
        <div className="flex bg-slate-950 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Queue Management</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search by ticket ID or keyword..."
                                className="w-80 bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-xs font-semibold">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            AGENT ONLINE
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: 'Pending Validations', value: tickets.filter(t => !t.isAiCorrected).length, trend: 'AI Active', color: 'text-purple-500' },
                            { label: 'Open Incidents', value: tickets.filter(t => t.status === 'Open').length, trend: 'Unassigned', color: 'text-blue-500' },
                            { label: 'Intelligence Accuracy', value: '94.2%', trend: '+2.1%', color: 'text-green-500' },
                            { label: 'Breach Risk Count', value: tickets.filter(t => t.aiSlaRisk > 0.7).length, trend: 'Immediate', color: 'text-red-500' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-slate-800/10 rounded-full group-hover:scale-150 transition-all duration-700"></div>
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                                    <div className="px-2 py-0.5 bg-slate-800 rounded-full text-[9px] font-black text-slate-400 border border-slate-700 group-hover:border-purple-500/30 transition-all">
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className={`text-5xl font-black tracking-tighter ${stat.color} relative z-10`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                        <div className="p-4 md:p-8 border-b border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-900/50">
                            <div className="flex items-center gap-6 md:gap-10 border-b xl:border-b-0 border-slate-800/50 w-full xl:w-auto pb-6 xl:pb-0 overflow-x-auto scrollbar-hide">
                                {['Stream', 'Validation', 'Assigned', 'Strategic'].map((tab, i) => (
                                    <button
                                        key={tab}
                                        className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative whitespace-nowrap ${i === 0 ? 'text-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {tab}
                                        {i === 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 rounded-full"></div>}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-4 w-full xl:w-auto justify-end">
                                <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 md:px-5 py-2.5 border border-slate-800 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest leading-none">
                                    <Filter size={14} /> Filter
                                </button>
                                <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-4 md:px-5 py-2.5 bg-purple-600 rounded-2xl text-white hover:bg-purple-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-900/20 leading-none">
                                    <Download size={14} /> Sync
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-950/40 text-slate-500 text-[9px] font-black uppercase tracking-[0.25em] border-b border-slate-800">
                                        <th className="px-6 md:px-10 py-6 whitespace-nowrap">Incident ID</th>
                                        <th className="px-6 md:px-10 py-6 whitespace-nowrap">Contextual Payload</th>
                                        <th className="px-6 md:px-10 py-6 whitespace-nowrap">AI Assessment</th>
                                        <th className="px-6 md:px-10 py-6 whitespace-nowrap">Breach Risk %</th>
                                        <th className="px-6 md:px-10 py-6 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-10 py-8"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                                                <td className="px-10 py-8 space-y-2">
                                                    <div className="h-5 bg-slate-800 rounded w-48" />
                                                    <div className="h-3 bg-slate-800 rounded w-32" />
                                                </td>
                                                <td className="px-10 py-8 space-y-2">
                                                    <div className="h-4 bg-slate-800 rounded w-24" />
                                                    <div className="h-3 bg-slate-800 rounded w-16" />
                                                </td>
                                                <td className="px-10 py-8"><div className="h-2 bg-slate-800 rounded w-32" /></td>
                                                <td className="px-10 py-8"><div className="h-8 bg-slate-800 rounded w-24 float-right" /></td>
                                            </tr>
                                        ))
                                    ) : tickets.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-24 text-slate-600 font-bold uppercase tracking-widest">Stream Clean. Systematic operational integrity maintained.</td></tr>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            {tickets.map((ticket) => (
                                                <motion.tr
                                                    key={ticket._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    layout
                                                    className="hover:bg-purple-600/[0.03] transition-all cursor-pointer group"
                                                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                                                >
                                                    <td className="px-10 py-8">
                                                        <div className="flex flex-col">
                                                            <span className="text-purple-500 font-black text-[11px] mb-1 tracking-widest underline decoration-purple-500/20">{ticket.ticketId}</span>
                                                            <div className="flex items-center gap-2 text-[9px] font-black tracking-widest uppercase">
                                                                <span className="text-slate-600">SLA:</span>
                                                                <SLATimer deadline={ticket.slaDeadline} status={ticket.status} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="max-w-md">
                                                            <div className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition-all leading-snug">{ticket.title}</div>
                                                            <div className="text-slate-500 text-xs line-clamp-1 italic font-medium">// {ticket.description}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex flex-col gap-3">
                                                            <div className="flex items-center gap-2">
                                                                {getCategoryBadge(ticket.aiCategory || ticket.category)}
                                                            </div>
                                                            <span className={`w-fit px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getPriorityColor(ticket.aiPriority || ticket.priority)}`}>
                                                                {ticket.aiPriority || ticket.priority}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex-1 w-32 h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${ticket.aiSlaRisk > 0.7 ? 'bg-red-500' : ticket.aiSlaRisk > 0.4 ? 'bg-orange-600' : 'bg-green-600'}`}
                                                                    style={{ width: `${(ticket.aiConfidence || 0.5) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[11px] font-black text-white tracking-widest">{(ticket.aiConfidence || 0.5) * 100}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all">
                                                            <button 
                                                                onClick={(e) => handleResolve(e, ticket._id)}
                                                                className={`p-3 border rounded-[1rem] transition-all ${ticket.status === 'Resolved' ? 'bg-green-500 text-white border-green-400' : 'bg-green-500/5 text-green-500 border-green-500/10 hover:bg-green-500 hover:text-white'}`}
                                                                title="Resolve Ticket"
                                                            >
                                                                <CheckCircle2 size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/tickets/${ticket._id}`);
                                                                }}
                                                                className="p-3 bg-purple-600 border border-purple-500 rounded-[1rem] text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/40"
                                                                title="View Details"
                                                            >
                                                                <ArrowRight size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 border-t border-slate-800 flex justify-between items-center bg-slate-950/20">
                            <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Viewing Index: 001 - {String(tickets.length).padStart(3, '0')} // Operational Context</span>
                            <div className="flex gap-4">
                                <button className="flex items-center justify-center px-6 py-2.5 border border-slate-800 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest">
                                    <ChevronLeft size={16} className="mr-2" /> Previous Block
                                </button>
                                <button className="flex items-center justify-center px-6 py-2.5 border border-slate-800 rounded-2xl text-slate-500 hover:text-white hover:bg-slate-800 transition-all text-[10px] font-black uppercase tracking-widest">
                                    Next Block <ChevronRight size={16} className="ml-2" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AgentDashboard;
