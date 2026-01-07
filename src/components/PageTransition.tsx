import { motion } from 'framer-motion';
import { type ReactNode, useEffect } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  
  useEffect(() => {
    // 1. Reset Window
    window.scrollTo(0, 0);

    // 2. Reset specific containers by ID or Tag
    const containers = document.querySelectorAll('main, .overflow-y-auto');
    containers.forEach(el => {
      el.scrollTop = 0;
    });
  }, []); // Run once on mount

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};