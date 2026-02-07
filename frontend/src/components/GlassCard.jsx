// frontend/src/components/GlassCard.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GlassCard({
  children,
  className = '',
  variant = 'default',
  hover = true,
  glow = false,
  padding = 'p-6',
  onClick
}) {
  const variants = {
    default: 'bg-white/10 border-white/20',
    light: 'bg-white/20 border-white/30',
    dark: 'bg-black/20 border-white/10',
    primary: 'bg-primary-500/10 border-primary-500/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-red-500/10 border-red-500/30',
  };

  const glowColors = {
    default: 'shadow-white/5',
    primary: 'shadow-primary-500/20',
    success: 'shadow-emerald-500/20',
    warning: 'shadow-amber-500/20',
    danger: 'shadow-red-500/20',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-2xl backdrop-blur-xl border shadow-xl',
        variants[variant],
        glow && `shadow-2xl ${glowColors[variant] || glowColors.default}`,
        hover && 'cursor-pointer transition-all duration-300',
        padding,
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}