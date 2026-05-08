import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top',
  className,
  delay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'bottom-[-3px] left-1/2 -translate-x-1/2 border-b border-r border-white/10',
    bottom: 'top-[-3px] left-1/2 -translate-x-1/2 border-t border-l border-white/10',
    left: 'right-[-3px] top-1/2 -translate-y-1/2 border-t border-r border-white/10',
    right: 'left-[-3px] top-1/2 -translate-y-1/2 border-b border-l border-white/10'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: position === 'top' || position === 'bottom' ? '-50%' : 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "fixed z-[9999] px-2 py-1 text-[10px] font-bold text-white bg-neutral-900 dark:bg-neutral-800 rounded-lg whitespace-nowrap shadow-2xl pointer-events-none select-none border border-white/10 uppercase tracking-widest",
              positionClasses[position],
              className
            )}
          >
            {content}
            <div className={cn(
              "absolute w-1.5 h-1.5 bg-neutral-900 dark:bg-neutral-800 rotate-45",
              arrowClasses[position]
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
