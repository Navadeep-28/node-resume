// frontend/src/components/Card.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({ 
  children, 
  className = '', 
  hover = true,
  padding = 'p-6',
  onClick
}) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      onClick={onClick}
      className={clsx(
        'glass rounded-2xl',
        padding,
        hover && 'cursor-pointer card-hover',
        className
      )}
    >
      {children}
    </motion.div>
  );
}