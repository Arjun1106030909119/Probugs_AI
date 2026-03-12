import Sidebar from '../components/Sidebar';
import { BrainCircuit, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const AITraining = () => {
    return (
        <div className="flex bg-slate-950 min-h-screen text-white">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 flex flex-col items-center justify-center text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl p-12 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <BrainCircuit size={120} className="text-purple-500" />
                    </div>

                    <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center text-purple-500 mb-8 mx-auto border border-purple-500/20">
                        <Zap size={40} />
                    </div>

                    <h1 className="text-4xl font-black mb-4 tracking-tight uppercase">Neural Training Chamber</h1>
                    <p className="text-slate-400 text-lg mb-8 leading-relaxed italic">
                        The AI models are currently digesting historical incident data. High-fidelity training sessions will be available shortly.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "65%" }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                className="h-full bg-purple-600"
                            />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">Synchronization in progress... 65%</span>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default AITraining;
