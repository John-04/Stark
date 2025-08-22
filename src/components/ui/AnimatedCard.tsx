import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  rotation?: boolean;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  hover = true,
  delay = 0,
  direction = 'up',
  rotation = false,
  glow = false,
  gradient = false,
  onClick
}) => {
  const directionVariants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: 50, opacity: 0 },
    right: { x: -50, opacity: 0 }
  };

  const baseClasses = `group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 p-5 md:p-6 ${
    onClick ? 'cursor-pointer' : ''
  } ${gradient ? 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900' : ''}`;

  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      initial={directionVariants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ 
        delay, 
        duration: 0.6, 
        type: "spring", 
        stiffness: 100, 
        damping: 10 
      }}
      whileHover={{}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default AnimatedCard;
