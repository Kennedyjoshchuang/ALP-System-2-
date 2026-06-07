import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Hammer, Shield } from 'lucide-react';

const MaintenanceOverlay = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: '#030712',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#065f46]/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#d4af37]/20 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card p-12 max-w-2xl w-full mx-4 text-center relative overflow-hidden"
        style={{ background: 'rgba(17, 24, 39, 0.8)', border: '1px solid rgba(212, 175, 55, 0.3)' }}
      >
        <div className="flex justify-center mb-10">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-15px] border-2 border-dashed border-[#d4af37]/40 rounded-full"
            />
            <div className="bg-gradient-to-br from-[#065f46] to-[#10b981] p-8 rounded-[2rem] shadow-[0_0_50px_rgba(6,95,70,0.5)]">
              <Hammer className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl mb-6 shimmer-text tracking-tighter font-bold" style={{ background: 'linear-gradient(to right, #d4af37, #f1c40f, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          UNDER MAINTENANCE
        </h1>
        
        <p className="text-xl text-[#ecfdf5]/70 mb-12 leading-relaxed max-w-lg mx-auto">
          We're currently polishing the <span className="text-[#d4af37] font-bold">ALP Freight System</span>. We'll be back online shortly with a better experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <Clock className="w-6 h-6 text-[#d4af37] mb-3" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Status</span>
            <span className="text-xs font-bold text-emerald-400">UPGRADING</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <Shield className="w-6 h-6 text-[#d4af37] mb-3" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Security</span>
            <span className="text-xs font-bold text-emerald-400">ENCRYPTED</span>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <AlertTriangle className="w-6 h-6 text-[#d4af37] mb-3" />
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Impact</span>
            <span className="text-xs font-bold text-emerald-400">LOCALIZED</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            Optimizing database clusters...
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="btn-gold px-12 py-4 rounded-full font-bold hover:scale-110 transition-all active:scale-95 shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
          >
            REFRESH SYSTEM
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MaintenanceOverlay;
