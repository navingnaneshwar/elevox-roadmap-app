import { motion } from 'framer-motion';

export default function AnimatedSection({ 
  children, 
  delay = 0, 
  className = '', 
  direction = 'up',
  duration = 0.6
}) {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
    none: { x: 0, y: 0 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] // Custom ease-out cubic
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
