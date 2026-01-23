"use client";

import React, { useEffect, useRef } from 'react';

export const GlobeNetwork = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = 800;
        let height = canvas.height = 800;
        let globeRadius = 280;
        let dots: { x: number, y: number, z: number, xProjected: number, yProjected: number, r: number, phi: number, theta: number }[] = [];
        let rotation = 0;

        // Initialize dots Sphere
        const initDots = () => {
            dots = [];
            const numDots = 600; // Increased Density
            for (let i = 0; i < numDots; i++) {
                const phi = Math.acos(-1 + (2 * i) / numDots);
                const theta = Math.sqrt(numDots * Math.PI) * phi;
                
                dots.push({
                    x: 0, 
                    y: 0, 
                    z: 0,
                    xProjected: 0,
                    yProjected: 0,
                    r: 1.5,
                    phi,
                    theta
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Background Glow (Aurora Effect)
            const gradient = ctx.createRadialGradient(width/2, height/2, globeRadius * 0.4, width/2, height/2, globeRadius * 1.8);
            gradient.addColorStop(0, 'rgba(0, 242, 255, 0.05)');
            gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.02)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            rotation += 0.002;

            // Update Positions & Projections
            dots.forEach(dot => {
                // Spherical to Cartesian with Rotation
                const x = globeRadius * Math.sin(dot.phi) * Math.cos(dot.theta + rotation);
                const y = globeRadius * Math.cos(dot.phi);
                const z = globeRadius * Math.sin(dot.phi) * Math.sin(dot.theta + rotation);

                // Project 3D to 2D
                const scale = 350 / (350 + z); // Perspective Scale
                const xProjected = (x * scale) + width / 2;
                const yProjected = (y * scale) + height / 2;

                // Store projected values for line drawing
                dot.x = x;
                dot.y = y;
                dot.z = z;
                dot.xProjected = xProjected;
                dot.yProjected = yProjected;
                
                // Opacity based on Z-depth
                const alpha = (z + globeRadius) / (2 * globeRadius); 
                
                if (z > -globeRadius * 0.8) { // Draw front-facing logic
                    ctx.beginPath();
                    ctx.arc(xProjected, yProjected, dot.r * scale, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 242, 255, ${Math.max(0.1, alpha)})`;
                    ctx.fill();
                }
            });

            // Draw Connections (Triangulation Effect)
            // Limit checks for performance
            for (let i = 0; i < dots.length; i++) {
                if (dots[i].z < -globeRadius * 0.5) continue; // Skip back-facing dots

                for (let j = i + 1; j < dots.length; j++) {
                     if (dots[j].z < -globeRadius * 0.5) continue;
                     
                     // Fast Distance Check (Squared Euclidean)
                     const dx = dots[i].x - dots[j].x;
                     const dy = dots[i].y - dots[j].y;
                     const dz = dots[i].z - dots[j].z;
                     const distSq = dx*dx + dy*dy + dz*dz;

                     if (distSq < 1600) { // Max distance squared ~40px
                         const alpha = (1 - distSq / 1600) * 0.3; // Fade out with distance
                         if (alpha > 0.05) {
                            ctx.beginPath();
                            ctx.moveTo(dots[i].xProjected, dots[i].yProjected);
                            ctx.lineTo(dots[j].xProjected, dots[j].yProjected);
                            ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                         }
                     }
                }
            }

            requestAnimationFrame(draw);
        };

        initDots();
        draw();

        // Cleanup
        return () => {
            // Cancel animation frame if needed loop handles it via closure but nice to check
        };
    }, []);

    return (
        <div className="relative flex items-center justify-center w-[600px] h-[600px] pointer-events-none">
            <canvas ref={canvasRef} width={800} height={800} className="w-[800px] h-[800px] scale-75 opacity-90 mix-blend-screen" />
            
            {/* Overlay Rings for "Tech" Feel */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-[500px] h-[500px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
                <div className="absolute w-[350px] h-[350px] border border-dashed border-accent/20 rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-50" />
            </div>
            
            {/* Floating Info Cards - Styled for Premium Look */}
            <div className="absolute top-24 right-10 p-4 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 flex items-center gap-4 animate-float shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 transition-transform hover:scale-105 duration-300">
                <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-success blur-sm animate-pulse" />
                </div>
                <div>
                     <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Node Status</div>
                     <div className="font-mono text-sm font-bold text-white">Online • 14ms</div>
                </div>
            </div>

             <div className="absolute bottom-24 left-0 p-4 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 flex items-center gap-4 animate-float shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10" style={{ animationDelay: '1.5s' }}>
                <div className="p-2 bg-accent/10 rounded-lg">
                    <div className="w-4 h-4 text-accent">⚡</div>
                </div>
                <div>
                    <div className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">Volume</div>
                    <div className="font-mono text-sm font-bold text-white">$42,500.00</div>
                </div>
            </div>

        </div>
    );
};
