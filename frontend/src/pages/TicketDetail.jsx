import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Send,
    Paperclip,
    MoreVertical,
    Clock,
    MessageSquare,
    ShieldAlert,
    Zap,
    CheckCircle2,
    Trash2,
    ArrowUpRight,
    TrendingDown
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Activity Log');
    const [activeViewers, setActiveViewers] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const socket = useSocket();

    useEffect(() => {
        const fetchTicket = async () => {
            if (authLoading || !user) return;
            try {
                const res = await axios.get(`/api/tickets/${id}`);
                setTicket(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id, authLoading, user]);

    useEffect(() => {
        if (!socket || !id || !user) return;

        // Join ticket track
        socket.emit('join_ticket', { ticketId: id, user: { id: user._id, name: user.name, role: user.role } });

        socket.on('ticket_updated', (updatedTicket) => {
            if (updatedTicket._id === id) {
                setTicket(updatedTicket);
            }
        });

        socket.on('viewers_updated', (viewers) => {
            setActiveViewers(viewers.filter(v => v.id !== user._id));
        });

        socket.on('user_typing', ({ user: typingUser }) => {
            setTypingUser(typingUser);
            setTimeout(() => setTypingUser(null), 3000);
        });

        return () => {
            socket.emit('leave_ticket', { ticketId: id, user: { id: user._id } });
            socket.off('ticket_updated');
            socket.off('viewers_updated');
            socket.off('user_typing');
        };
    }, [socket, id, user]);

    // Live SLA Timer
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!ticket?.slaDeadline) return;

        const timer = setInterval(() => {
            const now = new Date();
            const deadline = new Date(ticket.slaDeadline);
            const diff = deadline - now;

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
    }, [ticket?.slaDeadline]);

    const handleCommentChange = (e) => {
        setComment(e.target.value);
        if (socket && id) {
            socket.emit('typing', { ticketId: id, user: { name: user.name } });
        }
    };

    const handleSendComment = async () => {
        if (!comment.trim()) return;
        try {
            const res = await axios.post(`/api/tickets/${id}/activity`, {
                message: comment,
                type: 'comment'
            });
            setTicket(res.data.data);
            setComment('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            await axios.put(`/api/tickets/${id}`, { status: newStatus });
            // Activity log for status change
            await axios.post(`/api/tickets/${id}/activity`, {
                message: `Status changed to ${newStatus}`,
                type: 'status_change'
            });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading || authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Synchronizing Neural Link...</p>
        </div>
    </div>;
    
    if (!ticket) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Incident Node Not Found</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">The requested ticket identifier does not exist in the current registry or you do not have authorization to access it.</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white hover:bg-slate-800 transition-all text-sm font-bold">
                Return to Command Center
            </button>
        </div>
    </div>;

    return (
        <div className="flex bg-slate-950 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
                <header className="flex justify-between items-start mb-8">
                    <div className="flex items-start gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="text-slate-500 font-bold text-xs md:text-sm">Tickets / {ticket.category}</span>
                                <span className="text-slate-400 text-xs md:text-sm"># {ticket.ticketId}</span>
                            </div>
                            <h1 className="text-xl md:text-3xl font-bold text-white mb-2">{ticket.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={14} /> Created {new Date(ticket.createdAt).toLocaleString()} by <span className="text-slate-300 font-medium ml-1">{ticket.user?.name}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {activeViewers.map((viewer) => (
                                        <div
                                            key={viewer.socketId}
                                            className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-purple-400 border border-purple-500/20"
                                            title={`${viewer.name} (${viewer.role})`}
                                        >
                                            {viewer.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                                {activeViewers.length > 0 && (
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        {activeViewers.length} agent{activeViewers.length > 1 ? 's' : ''} viewing
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 flex-wrap">
                        <span className={`px-2 md:px-4 py-1.5 rounded-lg border text-[10px] md:text-xs font-bold uppercase tracking-wider ${ticket.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {ticket.priority}
                        </span>
                        <button className="flex items-center gap-2 px-2 md:px-4 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] md:text-xs font-bold hover:bg-slate-800 transition-all">
                            <ArrowUpRight size={14} /> <span className="hidden md:inline">Escalate</span>
                        </button>
                        <button
                            onClick={() => handleStatusUpdate('Resolved')}
                            className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] md:text-xs font-bold hover:bg-purple-700 transition-all">
                            <CheckCircle2 size={14} /> Resolve <span className="hidden md:inline">Ticket</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex gap-6">
                                {['Activity Log', 'Attachments', 'Sub-tasks'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`text-sm font-bold pb-2 border-b-2 transition-all ${activeTab === tab ? 'text-purple-500 border-purple-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                                    >
                                        {tab} {tab === 'Attachments' && <span className="ml-1 px-1.5 py-0.5 bg-slate-800 rounded-md text-[10px]">3</span>}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 space-y-8 min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'Activity Log' ? (
                                        <motion.div
                                            key="activity-log"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-8"
                                        >
                                            {/* Original Description */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-4"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-purple-400 font-bold shrink-0">
                                                    {ticket.user?.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-white">{ticket.user?.name}</span>
                                                        <span className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="p-4 bg-slate-800/50 border border-slate-800 rounded-2xl text-slate-300 text-sm leading-relaxed">
                                                        {ticket.description}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Dynamic Activity Log */}
                                            {ticket.activityLog?.map((log, i) => (
                                                <motion.div
                                                    key={log._id || `log-${i}`}
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    layout
                                                    className="flex gap-4"
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${log.type === 'comment' ? 'bg-slate-800 text-blue-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                                        {log.user?.name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="font-bold text-white flex items-center gap-2">
                                                                {log.user?.name || 'System'}
                                                                {log.type !== 'comment' && <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] rounded border border-purple-500/20 uppercase">{log.type}</span>}
                                                            </span>
                                                            <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className={`p-4 border rounded-2xl text-sm ${log.type === 'comment' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-purple-900/10 border-purple-500/20 text-purple-100 italic'}`}>
                                                            {log.message}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : activeTab === 'Attachments' ? (
                                        <motion.div
                                            key="attachments"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="grid grid-cols-2 md:grid-cols-3 gap-4"
                                        >
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-purple-500/30 transition-all">
                                                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-all">
                                                        <Paperclip size={24} />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-bold text-slate-300">system_log_0{i}.txt</p>
                                                        <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">12.4 KB • TEXT</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="sub-tasks"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-4"
                                        >
                                            {[
                                                { title: 'Verify Neural Link', status: 'Completed' },
                                                { title: 'Reset Proxy Buffer', status: 'In Progress' },
                                                { title: 'Broadcase Sync Protocol', status: 'Pending' }
                                            ].map((task, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-800 rounded-2xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : task.status === 'In Progress' ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
                                                        <span className="text-sm text-slate-200 font-medium">{task.title}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${task.status === 'Completed' ? 'text-green-500' : 'text-slate-500'}`}>{task.status}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {typingUser && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-[10px] text-purple-400 italic mt-2 animate-bounce"
                                    >
                                        {typingUser.name} is typing...
                                    </motion.div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 focus-within:ring-2 focus-within:ring-purple-600 transition-all">
                                    <textarea
                                        value={comment}
                                        onChange={handleCommentChange}
                                        className="w-full bg-transparent border-none outline-none text-white text-sm resize-none mb-4"
                                        placeholder="Write a reply or leave an internal note..."
                                        rows="4"
                                    ></textarea>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-3 text-slate-400">
                                            <button className="hover:text-white transition-all"><Paperclip size={18} /></button>
                                            <button className="hover:text-white transition-all"><MessageSquare size={18} /></button>
                                        </div>
                                        <button
                                            onClick={handleSendComment}
                                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all">
                                            <Send size={16} /> Send Reply
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-4 italic text-center">Type / for AI commands</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SLA Countdown</span>
                                <ShieldAlert className={timeLeft === 'EXPIRED' ? 'text-red-500 animate-pulse' : 'text-slate-500'} size={18} />
                            </div>
                            <div className={`text-4xl font-bold mb-2 font-mono tracking-tighter ${timeLeft === 'EXPIRED' ? 'text-red-600' : 'text-white'}`}>
                                {timeLeft || '00:00:00'}
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                                <div className="w-[85%] h-full bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Resolution Target: {new Date(ticket.slaDeadline).toLocaleTimeString()}</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="text-purple-500" /> AI Insights
                                </span>
                                <MoreVertical size={16} className="text-slate-500" />
                            </div>

                            <div className="mb-6">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-3">Triage Reasoning</p>
                                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed mb-4">
                                    {ticket.aiExplanation?.map((exp, i) => (
                                        <div key={i} className="mb-2 last:mb-0">• {exp}</div>
                                    )) || 'AI analysis pending...'}
                                </div>
                                <div className="flex gap-2 mb-6">
                                    <span className="px-2 py-1 bg-slate-800 text-purple-400 rounded-lg text-[10px] font-bold">Confidence: {(ticket.aiConfidence * 100).toFixed(0)}%</span>
                                    <span className="px-2 py-1 bg-slate-800 text-red-400 rounded-lg text-[10px] font-bold">SLA Risk: {(ticket.aiSlaRisk * 100).toFixed(0)}%</span>
                                </div>

                                {ticket.aiSolution && (
                                    <div className="mb-6">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-3 flex items-center gap-2">
                                            <TrendingDown size={14} className="text-green-500" /> AI Solution Node
                                        </p>
                                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-2xl text-[11px] text-green-100 italic leading-relaxed">
                                            {ticket.aiSolution}
                                            {ticket.aiAutoResolved && (
                                                <div className="mt-3 flex items-center gap-2 text-green-400 font-black uppercase text-[9px]">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    Autonomous Fix Applied
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Status</label>
                                    <select
                                        value={ticket.status}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none">
                                        <option>Open</option>
                                        <option>In Progress</option>
                                        <option>Resolved</option>
                                        <option>Closed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TicketDetail;
