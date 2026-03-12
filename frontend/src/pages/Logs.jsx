import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Terminal, Database, Shield, Zap, Search, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';

const Logs = () => {
    const socket = useSocket();
    const [logs, setLogs] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const scrollRef = useRef(null);

    const logTemplates = [
        { type: 'info', msg: 'Neural triage engine calibrated' },
        { type: 'success', msg: 'System check: 0 vulnerabilities found' },
        { type: 'zap', msg: 'AI predictive confidence increased to 99%' }
    ];

    useEffect(() => {
        if (!socket) return;

        const handleLog = (log) => {
            setLogs(prev => {
                // Prevent duplicates if simulation and real stream coincide
                if (prev.some(l => l.id === log.id)) return prev;
                return [...prev.slice(-49), log];
            });
        };

        socket.on('system_log', handleLog);
        return () => {
            socket.off('system_log', handleLog);
        };
    }, [socket]);

    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
            const newLog = {
                id: Date.now(),
                time: new Date().toLocaleTimeString(),
                ...template
            };
            setLogs(prev => [...prev.slice(-49), newLog]);
        }, 3000);

        return () => clearInterval(interval);
    }, [isSimulating]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex bg-slate-950 min-h-screen text-white">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 flex flex-col h-[calc(100vh-4rem)]">
                    <header className="mb-8">
                        <h1 className="text-3xl font-black tracking-tight uppercase flex items-center gap-3">
                            <Terminal className="text-purple-500" /> System Telemetry Stream
                        </h1>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                Pulse: <span className="text-green-500">Normal</span> | Channel: <span className="text-purple-500">{socket?.connected ? 'Real-Time-Live' : 'Synchronizing'}</span>
                            </p>
                            <button
                                onClick={() => setIsSimulating(!isSimulating)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isSimulating ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}
                            >
                                <Activity size={12} className={isSimulating ? 'animate-pulse' : ''} />
                                {isSimulating ? 'Simulation Active' : 'Real Stream Only'}
                            </button>
                        </div>
                    </header>

                    <div
                        ref={scrollRef}
                        className="flex-1 bg-black/40 border border-slate-800 rounded-3xl p-6 font-mono text-xs overflow-y-auto scrollbar-hide flex flex-col gap-2"
                    >
                        <AnimatePresence initial={false}>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-4 items-start py-1 border-b border-white/[0.03]"
                                >
                                    <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                    <span className={`font-black uppercase tracking-tighter shrink-0 w-16 ${log.type === 'error' ? 'text-red-500' :
                                        log.type === 'warning' ? 'text-yellow-500' :
                                            log.type === 'success' ? 'text-green-500' :
                                                log.type === 'zap' ? 'text-purple-500' : 'text-blue-500'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-slate-300 italic">{log.msg}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                                <Search className="animate-spin" />
                                <span className="uppercase tracking-[0.3em] font-black italic">Synchronizing Stream...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Database className="text-purple-500" size={20} />
                            <h2 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Node Status</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { node: 'AMS-01', load: '12%', status: 'green' },
                                { node: 'NYC-04', load: '45%', status: 'green' },
                                { node: 'HKG-02', load: '89%', status: 'yellow' },
                            ].map(node => (
                                <div key={node.node} className="p-3 bg-black/40 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-300">{node.node}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-slate-500">{node.load}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'green' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 shadow-[0_0_8px_#eab308]'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-purple-600/5 border border-purple-500/10 rounded-3xl p-6 relative overflow-hidden group">
                        <Shield className="absolute -bottom-4 -right-4 text-purple-600 opacity-10 group-hover:scale-125 transition-all duration-700" size={100} />
                        <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-2">Audit Integrity</h3>
                        <p className="text-slate-400 text-[10px] leading-relaxed relative z-10">
                            Every event in this stream is cryptographically hashed and mirrored across 3 redundant nodes for absolute audit reliability.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Logs;
