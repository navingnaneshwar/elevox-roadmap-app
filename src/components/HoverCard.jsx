import { motion } from 'framer-motion';

export default function HoverCard({ 
  children, 
  className = '', 
  glowColor = 'rgba(99,102,241,0.5)',
  onClick = undefined
}) {
  return (
    <motion.div
      whileHover={{ 
        y: -6,
        scale: 1.01,
        boxShadow: `0 20px 40px -10px ${glowColor}, 0 0 0 1px rgba(255,255,255,0.1) inset`,
        backgroundColor: 'rgba(20,25,35,0.95)'
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ 
        backgroundColor: 'rgba(13,18,32,0.8)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.05) inset'
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 30 
      }}
      className={`rounded-2xl backdrop-blur-md overflow-hidden transition-colors ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}
