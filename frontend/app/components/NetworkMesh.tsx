"use client";

import React, { useEffect, useRef } from 'react';

export const NetworkMesh = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = container.clientWidth;
        let height = canvas.height = container.clientHeight;
        
        let time = 0;
        const particles: {x: number, y: number, z: number, baseZ: number}[] = [];
        
        // Grid Configuration
        const cols = 40;
        const rows = 40;
        const spacing = width / 20; // Dynamic spacing

        // Initialize Grid
        for(let i = 0; i < cols; i++) {
            for(let j = 0; j < rows; j++) {
                particles.push({
                    x: (i - cols / 2) * spacing,
                    y: (j - rows / 2) * spacing,
                    z: 0,
                    baseZ: 0
                });
            }
        }

        const draw = () => {
            width = canvas.width = container.clientWidth;
            height = canvas.height = container.clientHeight;
            
            ctx.clearRect(0, 0, width, height);
            
            // Background Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(2, 6, 23, 0)');
            gradient.addColorStop(1, 'rgba(2, 6, 23, 1)'); 
            
            time += 0.02;

            ctx.save();
            ctx.translate(width / 2, height / 2 + 100);
            
            // Isometric Tilt
            ctx.scale(1, 0.6); 
            ctx.rotate(Math.PI / 4); 

            // Update & Draw Particles
            particles.forEach(p => {
                // Wave Math
                const dist = Math.sqrt(p.x * p.x + p.y * p.y);
                p.z = Math.sin(dist * 0.05 - time) * 30 + Math.cos(p.x * 0.1 + time) * 20;
                
                // Color based on height
                const alpha = Math.max(0.1, (p.z + 50) / 100);
                const isHigh = p.z > 20;

                ctx.fillStyle = isHigh ? `rgba(0, 255, 157, ${alpha})` : `rgba(0, 168, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                // Simple Circle for performance
                ctx.rect(p.x, p.y, 4, 4); 
                ctx.fill();
            });

            ctx.restore();

            // Overlay vignette
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            requestAnimationFrame(draw);
        };

        const animation = requestAnimationFrame(draw);

        const handleResize = () => {
            if(container) {
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animation);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} className="opacity-60" />
            
            {/* Holographic Overlays */}
            {/* Holographic Overlays - Hidden on Mobile */}
            <div className="hidden xl:block absolute top-[15%] right-[5%] p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl animate-float z-0">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-2 bg-accent/20 rounded-lg text-accent">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Live Flow</div>
                        <div className="text-xl font-bold font-mono text-white">425 tx/s</div>
                    </div>
                </div>
                {/* Mini Graph */}
                <div className="h-10 flex items-end gap-1">
                    {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-accent/30 rounded-t-sm hover:bg-accent/80 transition-colors" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>

             <div className="hidden xl:block absolute bottom-[15%] right-[20%] p-6 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl animate-float z-0" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full bg-success animate-pulse shadow-[0_0_15px_#00ff9d]" />
                     <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Network State</div>
                        <div className="text-lg font-bold font-mono text-success">Optimized</div>
                     </div>
                </div>
            </div>

        </div>
    );
};
