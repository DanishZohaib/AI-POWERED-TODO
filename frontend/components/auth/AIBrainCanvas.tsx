"use client";

import React, { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  pulseOffset: number;
}

export function AIBrainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Generate Brain-like oval constellation nodes
    const nodeCount = 55;
    const nodes: Node[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = Math.min(width, height) * 0.32;
    const radiusY = Math.min(width, height) * 0.38;

    for (let i = 0; i < nodeCount; i++) {
      // Golden spiral distribution inside an ellipse (brain shape)
      const angle = i * 2.399963;
      const r = Math.sqrt(i / nodeCount);
      const x = centerX + r * radiusX * Math.cos(angle) + (Math.random() - 0.5) * 20;
      const y = centerY + r * radiusY * Math.sin(angle) + (Math.random() - 0.5) * 20;

      nodes.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseRadius: Math.random() * 2 + 1.5,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw faint futuristic grid lines
      ctx.strokeStyle = "rgba(30, 58, 138, 0.08)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw glowing central aura
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        radiusX * 1.4
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.15)");
      gradient.addColorStop(0.5, "rgba(29, 78, 216, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radiusX * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Update and draw connections
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Move slightly
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        // Soft rebound inside brain bounds
        const dx = nodeA.x - centerX;
        const dy = nodeA.y - centerY;
        const distFromCenter = Math.sqrt((dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY));

        if (distFromCenter > 1.1) {
          nodeA.vx *= -1;
          nodeA.vy *= -1;
        }

        // Draw synapse lines to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const distSq = (nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2;
          const maxDist = 95;

          if (distSq < maxDist * maxDist) {
            const distance = Math.sqrt(distSq);
            const alpha = (1 - distance / maxDist) * 0.45;
            const pulse = Math.sin(time * 2 + nodeA.pulseOffset) * 0.15 + 0.85;

            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * pulse})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw neural nodes with glowing pulses
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 3 + node.pulseOffset) * 0.8 + 1.2;
        const currentRadius = node.baseRadius * pulse;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.fill();

        // Inner node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#60a5fa";
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[350px] md:min-h-[500px] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10 text-center px-6 pointer-events-none select-none">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4 backdrop-blur-md">
          <svg className="w-8 h-8 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent mb-2">
          AI Workflow System
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
          Intelligent category-driven task tracking & corporate workflow management
        </p>
      </div>
    </div>
  );
}
