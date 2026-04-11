"use client";

import React from "react";
import Link from "next/link";
import { 
  Terminal, 
  Shield, 
  Zap, 
  GitBranch, 
  ArrowRight, 
  Code2, 
  Globe, 
  Layers,
  CheckCircle2,
  Lock,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function LandingPage() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-green-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">DevMatrix</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">How it works</button>
            <button onClick={() => scrollToSection('cli')} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">CLI</button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className={`${!user && "hidden sm:block"}`}>
              <Button variant="ghost" className="text-sm text-neutral-400 hover:text-white">Dashboard</Button>
            </Link>
            {!loading && !user && (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button className="text-sm bg-white text-black hover:bg-neutral-200">Sign Up</Button>
                </Link>
              </>
            )}
            {!loading && user && (
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="text-sm text-neutral-500 hover:text-white transition-colors ml-2"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 text-center mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <BadgeIcon /> v1.0.0 Stable Release is now out
            <ChevronRight className="w-3 h-3" />
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Sync Environments <br /> Without the Friction.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-400 mb-12 leading-relaxed">
            DevMatrix (DMX) tracks every dependency change in your team and keeps everyone&apos;s local environment perfectly aligned. No more &quot;it works on my machine&quot;.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button className="h-12 px-8 text-base font-semibold bg-white text-black rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button 
              onClick={() => scrollToSection('cli')}
              variant="outline" 
              className="h-12 px-8 text-base font-semibold border-white/10 rounded-full hover:bg-white/5 transition-all"
            >
              Install DMX CLI
            </Button>
          </div>

          {/* Hero Image Mockup */}
          <div className="mt-20 relative px-4">
            <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full scale-75 opacity-50 pointer-events-none" />
            <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden max-w-5xl mx-auto">
              <div className="bg-[#151515] border border-white/5 rounded-xl overflow-hidden shadow-inner">
                {/* Mockup Header */}
                <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  <div className="flex-1 text-center text-[10px] text-neutral-600 font-mono">devmatrix.app/dashboard</div>
                </div>
                {/* Mockup Content */}
                <div className="p-8 grid grid-cols-12 gap-6 min-h-[400px]">
                   <div className="col-span-3 space-y-4">
                      {[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg border border-white/5" />)}
                   </div>
                   <div className="col-span-9 grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                         <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 mb-4" />
                         <div className="space-y-2">
                           <div className="h-4 bg-white/10 rounded w-1/2" />
                           <div className="h-3 bg-white/5 rounded w-full" />
                         </div>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                         <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 mb-4" />
                         <div className="space-y-2">
                           <div className="h-4 bg-white/10 rounded w-1/2" />
                           <div className="h-3 bg-white/5 rounded w-full" />
                         </div>
                      </div>
                      <div className="col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                         <div className="flex justify-between items-center mb-6">
                            <div className="h-4 bg-white/10 rounded w-1/4" />
                            <div className="h-4 bg-white/5 rounded w-1/6" />
                         </div>
                         <div className="space-y-3">
                            {[1,2,3].map(i => (
                              <div key={i} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5" />
                                <div className="flex-1 h-3 bg-white/5 rounded" />
                                <div className="w-16 h-3 bg-white/5 rounded" />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to <br /> stay in sync.</h2>
            <p className="text-neutral-500">Built for individual developers and high-growth teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layers className="w-6 h-6" />}
              title="Multi-Language Support"
              description="Native support for Node.js, Python, Go, and Ruby. DMX automatically detects and tracks your package files."
              color="blue"
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Real-time Tracking"
              description="CLI agent watches for changes in your background and instantly updates your team dashboard."
              color="purple"
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Environment Integrity"
              description="Automatic diffs and version history ensure you always know what changed and who changed it."
              color="green"
            />
            <FeatureCard 
              icon={<GitBranch className="w-6 h-6" />}
              title="Git Integration"
              description="Works alongside your Git workflow. Sync dependencies without messy merge conflicts on lockfiles."
              color="amber"
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title="Team Dashboards"
              description="A central hub to see every project's status and ensure your entire team is on the same page."
              color="rose"
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6" />}
              title="Security First"
              description="Local-first data handling with secure cloud synchronization. Your environment keys are never exposed."
              color="cyan"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5 bg-white/[0.01]">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">How DevMatrix Works</h2>
            <p className="text-neutral-500">Get up and running in less than 2 minutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="text-8xl font-black text-white/5 absolute -top-8 -left-4 select-none">01</div>
              <div className="relative">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm">1</div>
                  Install CLI
                </h3>
                <p className="text-neutral-400 leading-relaxed text-sm">
                  Install our lightweight agent on your local machine using npm:
                  <code className="block mt-4 p-3 rounded-lg bg-black border border-white/10 text-green-400 font-mono text-xs">
                    npm install -g devmatrix <span className="text-white">(coming soon)</span>
                  </code>
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-8xl font-black text-white/5 absolute -top-8 -left-4 select-none">02</div>
              <div className="relative">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm">2</div>
                  Initialize Project
                </h3>
                <p className="text-neutral-400 leading-relaxed text-sm">
                  Run <code className="text-white font-mono">dmx init</code> in your project root. DMX will scan your dependencies and create a snapshot.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="text-8xl font-black text-white/5 absolute -top-8 -left-4 select-none">03</div>
              <div className="relative">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-sm">3</div>
                  Stay in Sync
                </h3>
                <p className="text-neutral-400 leading-relaxed text-sm">
                  Share the project ID with your team. Every time someone updates a dependency, DMX notifies the team to keep everyone aligned.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLI Section */}
        <section id="cli" className="max-w-7xl mx-auto px-6 py-32">
          <div className="bg-neutral-950 border border-white/10 rounded-3xl p-8 md:p-16 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[50%] h-full bg-blue-600/10 blur-[100px] pointer-events-none" />
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                    <Code2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight mb-6">Powered by the <br /> DMX CLI.</h2>
                  <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                    Install our powerful command-line interface to start tracking your dependencies. It&apos;s lightweight, fast, and stays out of your way.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Automatic Detection</p>
                        <p className="text-sm text-neutral-500">Scans your files to find dependencies automatically.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold">Interactive Shell</p>
                        <p className="text-sm text-neutral-500">A beautiful dashboard right in your terminal.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-white/10 rounded-2xl p-6 font-mono text-sm overflow-hidden shadow-2xl relative">
                  <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <span className="text-neutral-600">bash</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-neutral-400"><span className="text-green-500">$</span> npm install -g devmatrix</p>
                    <p className="text-neutral-300">Searching for project...</p>
                    <p className="text-neutral-300">Project found: <span className="text-blue-400">DevMatrix Dashboard</span></p>
                    <p className="text-neutral-400 mt-4"><span className="text-green-500">$</span> dmx scan</p>
                    <p className="text-neutral-300">Detected <span className="text-amber-400">22</span> dependencies</p>
                    <p className="text-neutral-300">Detected <span className="text-blue-400">Next.js 16.2</span></p>
                    <p className="text-neutral-300">Syncing to cloud...</p>
                    <p className="text-green-500">✓ Sync complete. Dashboard updated.</p>
                    <div className="h-4 w-1 bg-white animate-pulse inline-block" />
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-6 py-32 text-center">
           <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">Ready to sync?</h2>
           <p className="max-w-xl mx-auto text-neutral-400 mb-12">Join hundreds of developers who have stopped worrying about environment drift.</p>
           <div className="flex items-center justify-center gap-4">
             <Link href="/signup">
               <Button className="h-14 px-10 text-lg font-bold bg-white text-black rounded-full hover:bg-neutral-200 transition-all">
                 Get Started for Free
               </Button>
             </Link>
           </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-5 h-5 text-neutral-500" />
          <span className="font-bold tracking-tight text-neutral-500">DevMatrix</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-neutral-600">
           <span>&copy; 2026 DevMatrix Inc.</span>
           <a href="#" className="hover:text-white transition-colors">Privacy</a>
           <a href="#" className="hover:text-white transition-colors">Terms</a>
           <a href="#" className="hover:text-white transition-colors">Source Code</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  };

  return (
    <div className="group p-8 rounded-3xl bg-neutral-950 border border-white/5 hover:border-white/10 transition-all duration-300 hover:translate-y-[-4px]">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 ${colorMap[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function BadgeIcon() {
  return (
    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-1">
      <Zap className="w-2.5 h-2.5 text-white fill-white" />
    </div>
  );
}
