import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { ...notification, id }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4">
                <AnimatePresence>
                    {notifications.map((n) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl min-w-[320px] max-w-[400px] flex items-start gap-4 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-600" />
                            <div className={`mt-1 ${n.type === 'error' ? 'text-red-500' : n.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
                                {n.type === 'error' ? <AlertCircle size={24} /> : n.type === 'success' ? <CheckCircle2 size={24} /> : <Info size={24} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm mb-1">{n.title}</h4>
                                <p className="text-slate-400 text-xs leading-relaxed">{n.message}</p>
                            </div>
                            <button
                                onClick={() => removeNotification(n.id)}
                                className="text-slate-600 hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
