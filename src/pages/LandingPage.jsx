import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedSection from '../components/AnimatedSection';
import HoverCard from '../components/HoverCard';

export default function LandingPage() {
  const { profile } = useAuth();
  
  // Fallbacks if profile isn't populated yet
  const fullName = profile?.full_name || 'Executive Name';
  const currentTitle = profile?.current_title || 'Industry Leader';
  const archetype = profile?.archetype || 'The Visionary';
  const reputationNow = profile?.reputation_now || 'Leading complex industry transformations.';
  const corePillars = profile?.topics_owned ? profile.topics_owned.split(',') : ['Strategic Leadership', 'Digital Transformation', 'Operational Excellence'];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F1F5F9] font-['Inter',sans-serif] selection:bg-[#6366f1] selection:text-white overflow-hidden">
      
      {/* ── Background Ambient Glows ── */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-[#070B14]/70 backdrop-blur-xl border-b border-[#1E2A3E]/50">
        <div className="text-xl font-bold font-['Outfit',sans-serif] tracking-tight text-white flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          {fullName.split(' ')[0]}
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-[#94A3B8]">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#expertise" className="hover:text-white transition-colors">Expertise</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
        <button className="px-5 py-2.5 bg-white text-[#0f172a] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg shadow-white/10">
          Book Consultation
        </button>
      </nav>

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-6xl mx-auto relative z-10">
        
        {/* ── Hero Section ── */}
        <AnimatedSection direction="up" className="min-h-[70vh] flex flex-col items-center justify-center text-center mt-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-widest uppercase"
          >
            {archetype}
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold font-['Outfit',sans-serif] tracking-tight mb-8 leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-[#94A3B8]">
              {reputationNow.replace('.', '')}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl font-light leading-relaxed mb-10">
            Hi, I'm {fullName}, a {currentTitle} specializing in scaling ambitious companies and building high-performance cultures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-1">
              Read My Newsletter
            </button>
            <button className="px-8 py-4 bg-[#1E2A3E]/30 text-white font-semibold rounded-xl border border-[#1E2A3E] hover:bg-[#1E2A3E]/70 transition-colors hover:border-indigo-500/50">
              Listen to Podcast
            </button>
          </div>
        </AnimatedSection>

        {/* ── Core Expertise Section ── */}
        <AnimatedSection direction="up" delay={0.2} className="py-32" id="expertise">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-['Outfit'] mb-4 text-white">Areas of Command</h2>
            <p className="text-[#64748B] max-w-xl mx-auto">The strategic pillars that drive my executive philosophy and content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {corePillars.map((pillar, index) => (
              <HoverCard key={index} className="p-8 border border-[#1E2A3E]/50">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 text-xl">
                  {index === 0 ? '◈' : index === 1 ? '◎' : '◆'}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{pillar.trim()}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  Deep frameworks and contrarian insights acquired through years of leading in the trenches of the modern enterprise.
                </p>
              </HoverCard>
            ))}
          </div>
        </AnimatedSection>

        {/* ── Micro-Interaction Call-To-Action ── */}
        <AnimatedSection direction="up" delay={0.1} className="py-24">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-[#070B14] z-0" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/20 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 font-['Outfit']">Ready to transform your trajectory?</h2>
              <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto mb-10">
                Join 10,000+ leaders receiving my weekly unvarnished strategic breakdowns.
              </p>
              
              <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="flex-1 px-5 py-4 rounded-xl bg-[#0D1220] border border-[#1E2A3E] text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/10 whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </AnimatedSection>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E2A3E]/40 bg-[#0A0F1C] py-12 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-[#64748B]">
          <div className="font-['Outfit'] font-bold text-lg text-white mb-4 md:mb-0">
            {fullName}
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-indigo-400 transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Speaking</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
