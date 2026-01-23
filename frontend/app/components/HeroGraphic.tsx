"use client";

import React, { useEffect, useRef } from 'react';

export const HeroGraphic = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let rotation = 0;
        let time = 0;

        // Globe Config
        const globeRadius = 180;
        const dotCount = 200; // High density for smooth glass look
        const dots: { phi: number, theta: number }[] = [];

        // Fibonacci Sphere
        const phi = Math.PI * (3 - Math.sqrt(5)); 
        for (let i = 0; i < dotCount; i++) {
            const y = 1 - (i / (dotCount - 1)) * 2;
            const theta = phi * i;
            dots.push({ phi: Math.acos(y), theta });
        }

        const resize = () => {
             width = canvas.width = container.clientWidth;
             height = canvas.height = container.clientHeight;
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            
            rotation += 0.001; // Slower, elegant rotation
            time += 0.01;

            const cx = width / 2;
            const cy = height / 2;
            
            // Responsive Radius
            const minDim = Math.min(width, height);
            const activeRadius = minDim * 0.38;

            // 1. Glass Orb Background (Subtle Gradient)
            const orbGrad = ctx.createRadialGradient(cx, cy, activeRadius * 0.2, cx, cy, activeRadius);
            orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
            orbGrad.addColorStop(1, 'rgba(0, 242, 255, 0.05)');
            
            ctx.fillStyle = orbGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, activeRadius, 0, Math.PI*2);
            ctx.fill();
            
            // Glass Highlight (Top Left)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.beginPath();
            ctx.ellipse(cx - activeRadius * 0.3, cy - activeRadius * 0.3, activeRadius * 0.4, activeRadius * 0.2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();


            // Project Points
            const projected = dots.map(dot => {
                const x = activeRadius * Math.sin(dot.phi) * Math.cos(dot.theta + rotation);
                const y = activeRadius * Math.cos(dot.phi);
                const z = activeRadius * Math.sin(dot.phi) * Math.sin(dot.theta + rotation);

                const scale = 400 / (400 - z);
                const alpha = (z + activeRadius) / (activeRadius * 2);

                return {
                    x: cx + x * scale,
                    y: cy + y * scale,
                    z: z,
                    alpha: Math.min(1, Math.max(0.05, alpha))
                };
            });

            // 2. Draw Sleek Connections (Thin Lines)
            ctx.lineWidth = 0.5; // Razor thin
            
            projected.forEach((p1, i) => {
                if (p1.z > -activeRadius * 0.2) { // Allow some back visibility for glass effect
                    // Find closest neighbor in array (approximation)
                    // We only draw a few "longitude" lines effectively by connecting sequence
                   
                    const p2 = projected[(i + 1) % projected.length];
                    const distSq = (p1.x-p2.x)**2 + (p1.y-p2.y)**2;
                    
                    if(distSq < (activeRadius*0.3)**2) {
                        ctx.strokeStyle = `rgba(200, 255, 255, ${p1.alpha * 0.15})`; // White/Cyan mix
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                    
                    // Cross connections for "Net" look
                    const p3 = projected[(i + 13) % projected.length]; // varying step
                    const distSq3 = (p1.x-p3.x)**2 + (p1.y-p3.y)**2;
                     if(distSq3 < (activeRadius*0.3)**2) {
                        ctx.strokeStyle = `rgba(0, 242, 255, ${p1.alpha * 0.1})`; 
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p3.x, p3.y);
                        ctx.stroke();
                    }
                }
            });

            // 3. Draw Nodes (Tiny, Sharp)
            projected.forEach(p => {
                // Front nodes brighter
                const size = p.z > 0 ? 1.5 : 1;
                ctx.fillStyle = p.z > 0 ? '#ffffff' : 'rgba(0, 242, 255, 0.5)';
                
                if (p.z > activeRadius * 0.5 && Math.random() > 0.99) {
                     // Occasional sparkle
                     ctx.shadowBlur = 10;
                     ctx.shadowColor = '#ffffff';
                     ctx.fillStyle = '#ffffff';
                } else {
                     ctx.shadowBlur = 0;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.shadowBlur = 0;

            // 4. Floating Particles (Background Depth)
             // ... kept simple, actually remove for "Sleek" look to avoid clutter

            requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        resize();
        
        const animId = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden">
             {/* Central glow core */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-accent/20 blur-[50px] rounded-full pointer-events-none" />
             <canvas ref={canvasRef} className="absolute inset-0 z-10" />
        </div>
    );
};
