// frontend/src/components/ProgressBar.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  label = '',
  color = 'primary',
  animated = true,
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colors = {
    primary: 'bg-gradient-to-r from-primary-500 to-accent-500',
    success: 'bg-gradient-to-r from-green-400 to-green-600',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    danger: 'bg-gradient-to-r from-red-400 to-red-600',
    info: 'bg-gradient-to-r from-blue-400 to-blue-600'
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-gray-100 rounded-full overflow-hidden', sizes[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: animated ? 1 : 0, ease: 'easeOut' }}
          className={clsx('h-full rounded-full relative', colors[color])}
        >
          {animated && (
            <span className="absolute inset-0 shimmer" />
          )}
        </motion.div>
      </div>
    </div>
  );
}