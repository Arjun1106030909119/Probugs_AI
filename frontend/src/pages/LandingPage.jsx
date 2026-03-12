import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, Zap, FileText, ShieldAlert } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-purple-500/30">
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="text-purple-500 w-8 h-8" />
                    <span className="font-bold text-xl tracking-tight">ProBugs AI || Ticket Manager</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/login')} className="text-sm font-bold hover:text-purple-400 transition-all">Login</button>
                    <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-900/20">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center pt-24 px-6 text-center max-w-6xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/10 border border-purple-500/20 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-8">
                    <Zap size={14} /> V2.0 NOW LIVE — NEW AI AGENTS
                </div>

                <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
                    Automate your support, <br />
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">not just your tickets.</span>
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                    The first AI-native IT management system designed for high-growth enterprises.
                    Triage, summarize, and resolve bugs in seconds.
                </p>

                <div className="flex gap-4">
                    <button onClick={() => navigate('/register')} className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-lg font-bold transition-all shadow-xl shadow-purple-900/40">
                        Get Started Free
                    </button>
                    <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-lg font-bold transition-all">
                        Request Demo
                    </button>
                </div>

                {/* Dashboard Mockup Preview */}
                <div className="mt-24 w-full relative">
                    <div className="absolute inset-0 bg-purple-600/20 blur-[120px] rounded-full opacity-50 -z-10 animate-pulse"></div>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden aspect-video group">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <div className="mx-auto w-48 h-3 bg-white/5 rounded-full"></div>
                            <div className="w-6 h-6 rounded-full bg-white/5"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 h-full">
                            <div className="col-span-1 space-y-3 opacity-30 group-hover:opacity-50 transition-all">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-white/10 rounded-lg w-full"></div>)}
                            </div>
                            <div className="col-span-3 space-y-4">
                                <div className="h-8 bg-purple-500/20 rounded-lg w-1/3"></div>
                                <div className="h-24 bg-white/5 rounded-2xl w-full"></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-white/5 rounded-2xl"></div>
                                    <div className="h-32 bg-white/5 rounded-2xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-32 w-full">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-12">Trusted by industry leaders</p>
                    <div className="flex justify-between items-center opacity-30 grayscale gap-12 px-8">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-slate-700 rounded-lg flex-1"></div>)}
                    </div>
                </div>

                {/* Features Section */}
                <div className="mt-48 grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
                    <div className="flex flex-col items-center text-center">
                        <h2 className="text-4xl font-bold tracking-tight mb-8">Engineered for speed <br />and precision.</h2>
                        <p className="text-slate-400">Our AI agents work alongside your team to handle the heavy lifting of IT management, allowing you to focus on building.</p>
                    </div>
                    <div></div>
                    <div></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full text-left">
                    {[
                        { title: 'AI Triage', desc: 'Route issues to the right engineer instantly with automated ticket categorization and severity assessment based on historical data.', icon: BrainCircuit },
                        { title: 'Smart Summaries', desc: 'Catch up on long incident threads with one click. LLM-generated reports distill hours of debugging into actionable takeaways.', icon: FileText },
                        { title: 'SLA Guard', desc: 'Never miss a deadline with predictive alerts and real-time tracking that flags potential breaches before they happen.', icon: ShieldAlert },
                    ].map((f, i) => (
                        <div key={i} className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 hover:border-purple-500/30 transition-all group">
                            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-all">
                                <f.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{f.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="mt-48 w-full bg-gradient-to-br from-purple-600 to-blue-700 rounded-[40px] p-24 relative overflow-hidden mb-32 group">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <h2 className="text-5xl font-bold tracking-tighter text-white mb-8">Ready to scale your IT support?</h2>
                        <p className="text-xl text-white/80 mb-12 max-w-xl mx-auto">Join over 500+ engineering teams who have automated their workflow with SupportAI.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-white text-purple-700 rounded-xl text-lg font-bold hover:scale-105 transition-all shadow-xl">Get Started Now</button>
                            <button className="px-8 py-4 bg-purple-800/30 border border-white/20 text-white rounded-xl text-lg font-bold hover:bg-purple-800/40 transition-all">View Pricing</button>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700"></div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 px-8 flex justify-between items-center bg-[#050505] text-slate-500 text-xs">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" />
                    <span className="font-bold">SupportAI</span>
                </div>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-white transition-all">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-all">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-all">Twitter</a>
                    <a href="#" className="hover:text-white transition-all">GitHub</a>
                </div>
                <div>© 2024 SupportAI Inc.</div>
            </footer>
        </div>
    );
};

export default LandingPage;
