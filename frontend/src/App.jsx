import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AgentDashboard from './pages/AgentDashboard';
import TicketDetail from './pages/TicketDetail';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import AITraining from './pages/AITraining';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Dashboard Redirect Component
const DashboardRedirect = () => {
    const { user } = useAuth();
    if (user?.role === 'admin' || user?.role === 'agent') {
        return <Navigate to="/tickets" replace />;
    }
    return <Navigate to="/dashboard" replace />;
};

const GlobalListeners = () => {
    const socket = useSocket();
    const { addNotification } = useNotifications();
    const { user } = useAuth();

    useEffect(() => {
        if (!socket) return;

        socket.on('ticket_created', (ticket) => {
            // Only notify agents or if it's the user's own ticket (though creation is usually by the user)
            if (user?.role === 'agent' || user?.role === 'admin') {
                addNotification({
                    title: 'New Ticket Received',
                    message: `Ticket ${ticket.ticketId}: ${ticket.title}`,
                    type: 'info'
                });
            }
        });

        socket.on('ticket_updated', (ticket) => {
            // Notify if the user is the owner or an agent
            if (user?.role !== 'user' || ticket.user === user?._id || ticket.user?._id === user?._id) {
                addNotification({
                    title: 'Ticket Updated',
                    message: `Ticket ${ticket.ticketId} has been updated.`,
                    type: 'success'
                });
            }
        });

        return () => {
            socket.off('ticket_created');
            socket.off('ticket_updated');
        };
    }, [socket, addNotification, user]);

    return null;
};

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
    >
        {children}
    </motion.div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    console.log('Current Path:', location.pathname);

    return (
        <AnimatePresence mode="wait">
            <Routes key={location.pathname}>
                <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<PageTransition><UserDashboard /></PageTransition>} />
                    <Route path="/tickets" element={<PageTransition><AgentDashboard /></PageTransition>} />
                    <Route path="/analytics" element={<PageTransition><AdminDashboard /></PageTransition>} />
                    <Route path="/tickets/:id" element={<PageTransition><TicketDetail /></PageTransition>} />
                    <Route path="/ai-training" element={<PageTransition><AITraining /></PageTransition>} />
                    <Route path="/logs" element={<PageTransition><Logs /></PageTransition>} />
                    <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                    <Route path="/home" element={<DashboardRedirect />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <NotificationProvider>
                    <GlobalListeners />
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <AnimatedRoutes />
                    </Router>
                </NotificationProvider>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
