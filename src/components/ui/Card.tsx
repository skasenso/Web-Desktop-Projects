"use client";

import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Card = ({ children, className = '', interactive = false }: { children: React.ReactNode, className?: string, interactive?: boolean }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
        transformStyle: interactive ? "preserve-3d" : "flat",
      }}
      className={cn(
        "glass-morphism rounded-[2rem] overflow-hidden transition-shadow duration-300 relative group",
        interactive && "cursor-pointer hover:shadow-emerald-500/10 hover:shadow-2xl",
        className
      )}
    >
      <div className={cn(interactive && "relative z-10")}>
        {children}
      </div>
      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none group-hover:border-emerald-500/20 transition-colors duration-500" />
    </motion.div>
  );
};

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-8 pb-0", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={cn("font-black tracking-tight text-white uppercase italic text-sm opacity-80", className)}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("p-8 pt-4", className)}>
    {children}
  </div>
);
