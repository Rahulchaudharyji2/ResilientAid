"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe, Lock, Activity } from "lucide-react";

export const ThreeDHero = () => {
  return (
    <div className="relative w-full h-[600px] flex items-center justify-center perspective-[1200px]">
      
      {/* Central Rotating Core */}
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-64 h-64 relative preserve-3d"
      >
        {/* Core Sphere/Cube Representation */}
        <div className="absolute inset-0 border-2 border-accent/30 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute inset-4 border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        
        {/* Floating Satellite Elements */}
        {[
          { icon: <ShieldCheck size={24} />, color: "text-success", bg: "bg-success/20", label: "Verified", delay: 0, x: 140, y: -40, z: 50 },
          { icon: <Zap size={24} />, color: "text-yellow-400", bg: "bg-yellow-400/20", label: "Instant", delay: 1, x: -120, y: 60, z: -50 },
          { icon: <Lock size={24} />, color: "text-blue-400", bg: "bg-blue-400/20", label: "Secure", delay: 2, x: 80, y: 120, z: 100 },
          { icon: <Activity size={24} />, color: "text-pink-400", bg: "bg-pink-400/20", label: "Live", delay: 3, x: -80, y: -100, z: -20 },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ 
              y: [0, -20, 0],
              rotateY: -360 // Counter-rotate to keep face forward
            }}
            transition={{ 
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: item.delay },
              rotateY: { duration: 20, repeat: Infinity, ease: "linear" }
             }}
            style={{ 
              transform: `translate3d(${item.x}px, ${item.y}px, ${item.z}px)` 
            }}
          >
            <div className={`p-4 rounded-2xl glass-panel border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <div className="text-sm font-bold text-white tracking-wide">{item.label}</div>
            </div>
            {/* Connection Line to Center */}
            <div className="absolute top-1/2 right-full w-20 h-px bg-gradient-to-r from-transparent to-accent/30 origin-right -z-10" 
                 style={{ transform: `rotate(${i * 45}deg) translateX(-20px)` }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Background Grid Floor */}
      <div className="absolute bottom-0 w-[200%] h-[200%] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none transform rotate-x-[60deg] opacity-20" />
      
    </div>
  );
};
