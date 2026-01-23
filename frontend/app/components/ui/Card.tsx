"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  delay?: number;
}

export const Card = ({ 
  children, 
  className = "", 
  hoverEffect = true,
  delay = 0 
}: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={hoverEffect ? { 
        y: -5,
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px rgba(0, 242, 255, 0.1)"
      } : {}}
      className={`
        relative overflow-hidden rounded-2xl
        bg-glass backdrop-blur-xl border border-glass-border
        p-6
        ${className}
      `}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
