import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    Settings,
    Users,
    MessageSquare,
    TrendingUp,
    LogOut,
    BrainCircuit,
    Database,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Ticket, label: 'Tickets', path: '/tickets' },
        { icon: BrainCircuit, label: 'AI Training', path: '/ai-training' },
        { icon: MessageSquare, label: 'Logs', path: '/logs' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    if (user?.role === 'admin') {
        menuItems.splice(3, 0, { icon: TrendingUp, label: 'Analytics', path: '/analytics' });
    }

    return (
        <>
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <BrainCircuit className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-white tracking-widest text-sm uppercase italic">ProBugs</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-400 hover:text-white transition-all"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed lg:sticky top-0 left-0 w-72 h-screen bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-4 mb-10 px-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                            <BrainCircuit className="text-white" size={24} />
                        </div>
                        <div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tighter italic whitespace-nowrap">ProBugs AI</span>
                            <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] leading-none mt-1">Neural Node</div>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-slate-700 rounded-[1rem] flex items-center justify-center text-purple-400 font-bold border border-slate-600 shadow-inner">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/30 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-700 transition-all"
                        >
                            <LogOut size={14} /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
