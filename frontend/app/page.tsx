"use client";

import Link from 'next/link';
import Navbar from './components/Navbar';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { PageWrapper } from './components/ui/PageWrapper';
import { ArrowRight, PlayCircle, ShieldCheck, Zap, Globe, Smartphone, User, Landmark, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { NetworkMesh } from './components/NetworkMesh';
import { HeroGraphic } from './components/HeroGraphic';

export default function Home() {
  return (
    <PageWrapper className="min-h-screen bg-background text-white selection:bg-accent/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 md:pt-32 md:pb-20 px-6 overflow-hidden">
        {/* Responsive Network Background */}
        <div className="absolute inset-0 z-0 opacity-80">
            <NetworkMesh />
        </div>

        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-accent/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto flex flex-col-reverse lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10 pointer-events-none">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left pointer-events-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/5 border border-white/10 text-success text-[10px] md:text-xs font-bold tracking-widest mb-6 md:mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,157,0.1)]">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_#00ff9d]" />
              LIVE ON POLYGON AMOY
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-8xl font-extrabold leading-[1.1] md:leading-[0.95] mb-6 md:mb-8 font-outfit tracking-tight">
              Aid that actually <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-white to-success animate-gradient-x">
                reaches people.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-2xl text-slate-400 font-light max-w-xl mb-8 md:mb-12 leading-relaxed tracking-wide">
              The world's first <span className="text-white font-medium">offline-capable</span> aid distribution protocol. 
              Zero middlemen, 100% on-chain verification, and <span className="text-accent">instant settlement</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/donor" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto justify-center" rightIcon={<ArrowRight size={20} />}>
                  Start Donating
                </Button>
              </Link>

              <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center" leftIcon={<PlayCircle size={20} />}>
                Watch Demo
              </Button>
            </div>

            {/* Metrics */}
            <div className="mt-10 md:mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-8 md:gap-12">
              <div>
                <div className="text-2xl md:text-3xl font-bold font-outfit text-white">0%</div>
                <div className="text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium mt-1">Platform Fees</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold font-outfit text-white">100%</div>
                <div className="text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium mt-1">Transparency</div>
              </div>
               <div>
                <div className="text-2xl md:text-3xl font-bold font-outfit text-white">&lt;2s</div>
                <div className="text-xs md:text-sm text-slate-500 uppercase tracking-wider font-medium mt-1">Settlement</div>
              </div>
            </div>
          </motion.div>

          
          {/* Right Spacer for Layout Balanced with Mesh */}
          <div className="flex mt-8 lg:mt-0 h-[280px] sm:h-[350px] md:h-[450px] lg:h-[600px] w-full max-w-full relative items-center justify-center overflow-hidden">
            <HeroGraphic />
          </div>
          
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 md:py-32 bg-[#020617] relative border-t border-white/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
              <div className="text-center mb-16 md:mb-24">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-[10px] md:text-xs font-bold tracking-widest text-slate-300 mb-4 md:mb-6 uppercase"
                  >
                    Simple & Secure Process
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 font-outfit"
                  >
                    How Resilient-Aid Works
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
                  >
                    Seamlessly connecting donors to beneficiaries with cryptographic guarantees and zero intermediaries.
                  </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                      { icon: <Globe size={20} />, title: "1. Donate", desc: "Donors contribute to specific campaigns via crypto or fiat on-ramp instantly." },
                      { icon: <ShieldCheck size={20} />, title: "2. Verify", desc: "Admins verify beneficiaries and issue Soulbound Identities for fraud prevention." },
                      { icon: <Smartphone size={20} />, title: "3. Receive", desc: "Beneficiaries receive credits on offline-first mobile wallets via QR codes." },
                      { icon: <Store size={20} />, title: "4. Spend", desc: "Vendors accept payments via POS terminals, instantly settling in stablecoins." }
                  ].map((step, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-primary/20 transition-all group relative overflow-hidden"
                      >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                          
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                              {step.icon}
                          </div>
                          
                          <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 font-outfit group-hover:text-white transition-colors">{step.title}</h3>
                          <p className="text-slate-400 text-xs md:text-sm leading-relaxed group-hover:text-slate-300 transition-colors">{step.desc}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 md:py-16 border-y border-white/5 bg-[#030712]">
        <div className="container mx-auto text-center px-4">
          <p className="text-slate-600 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mb-8 md:mb-10">Trusted By Industry Leaders</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['POLYGON', 'CHAINLINK', 'THE GRAPH', 'BYBIT', 'ALCHEMY'].map(logo => (
              <span key={logo} className="text-lg md:text-2xl font-black font-outfit text-white tracking-tighter hover:scale-110 transition-transform cursor-default">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Interfaces */}
      <section className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        {/* Ambient Bg */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-accent/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4 md:mb-6">Ecosystem Interfaces</h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Tailored interfaces for every stakeholder in the aid distribution process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <FeatureCard 
              title="Admin Portal"
              desc="Government/NGO dashboard for whitelisting & distribution."
              icon={<Landmark size={28} />}
              href="/admin"
              delay={0.1}
            />
            <FeatureCard 
              title="Donor Platform"
              desc="Global funding bridge with real-time impact tracking."
              icon={<Globe size={28} />}
              href="/donor"
              delay={0.2}
            />
            <FeatureCard 
              title="Beneficiary App"
              desc="Lite-wallet for offline QR payments & balance checks."
              icon={<Smartphone size={28} />}
              href="/beneficiary"
              delay={0.3}
            />
            <FeatureCard 
              title="Vendor POS"
              desc="Merchant point-of-sale for instant voucher redemption."
              icon={<Store size={28} />}
              href="/vendor"
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 px-6 border-t border-white/5 bg-[#020617] relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[300px] md:h-[500px] bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 relative z-10">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">
                Resilient<span className="text-accent">Aid</span>
              </span>
            </Link>
            <p className="text-slate-400 mt-4 md:mt-6 max-w-sm leading-relaxed text-base md:text-lg">
              Building the future of humanitarian aid with <span className="text-white">decentralization</span>, <span className="text-white">privacy</span>, and <span className="text-white">dignity</span> at its core.
            </p>
            
            <div className="mt-6 md:mt-8 flex gap-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-white">
                    <Globe size={18} />
                 </div>
               ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-bold text-white mb-6 md:mb-8 font-outfit tracking-wider text-xs md:text-sm uppercase text-accent">Platform</h5>
            <div className="flex flex-col gap-3 md:gap-4 text-slate-400 text-sm md:text-base">
              <Link href="/governance" className="hover:text-white hover:translate-x-1 transition-all">Governance</Link>
              <Link href="/analytics" className="hover:text-white hover:translate-x-1 transition-all">Analytics</Link>
              <Link href="/docs" className="hover:text-white hover:translate-x-1 transition-all">Documentation</Link>
              <Link href="/status" className="hover:text-white hover:translate-x-1 transition-all">System Status</Link>
            </div>
          </div>

          <div>
             <h5 className="font-bold text-white mb-6 md:mb-8 font-outfit tracking-wider text-xs md:text-sm uppercase text-accent">Stay Updated</h5>
             <div className="flex flex-col gap-3 md:gap-4">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 transition-colors w-full text-sm"
                />
                <Button variant="primary" size="sm" className="w-full">Subscribe</Button>
             </div>
          </div>
        </div>

        <div className="container mx-auto mt-12 md:mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs md:text-sm text-center md:text-left gap-4">
          <div>© 2026 Resilient-Aid Protocol. All rights reserved.</div>
          <div className="flex gap-6 md:gap-8">
             <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
}

function FeatureCard({ title, desc, icon, href, delay }: any) {
  return (
    <Link href={href} className="block h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: delay }}
        className="h-full p-8 rounded-3xl bg-[#0a0f1e] border border-white/5 hover:border-primary/30 hover:bg-white/[0.03] transition-all duration-500 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:bg-primary group-hover:text-black transition-all duration-300">
          {icon}
        </div>
        
        <h3 className="text-2xl font-bold font-outfit mb-3 text-white group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-slate-400 leading-relaxed mb-8 text-sm">{desc}</p>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-white transition-colors">
          Access Portal <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </Link>
  );
}

function ProcessStep({ number, title, desc, icon }: any) {
  return (
    <div className="relative p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
      <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-[#02040a] border border-white/10 flex items-center justify-center text-3xl font-bold text-white/20 font-outfit">
        {number}
      </div>
      <div className="mt-8 mb-6">{icon}</div>
      <h3 className="text-2xl font-bold font-outfit mb-4">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
