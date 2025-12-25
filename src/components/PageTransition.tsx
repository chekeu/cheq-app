import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }} // Starts slightly down and small
      animate={{ opacity: 1, y: 0, scale: 1 }}     // Slides up and grows
      exit={{ opacity: 0, y: -20, scale: 0.98 }}   // Fades out upward
      transition={{ duration: 0.2, ease: "easeOut" }} // Snappy timing
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

