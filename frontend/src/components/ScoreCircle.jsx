// frontend/src/components/ScoreCircle.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ScoreCircle({
  score,
  size = 'md',
  showLabel = true,
  label = 'Score',
  className = ''
}) {
  const sizes = {
    sm: { container: 'w-16 h-16', stroke: 4, text: 'text-lg' },
    md: { container: 'w-24 h-24', stroke: 6, text: 'text-2xl' },
    lg: { container: 'w-32 h-32', stroke: 8, text: 'text-3xl' },
    xl: { container: 'w-40 h-40', stroke: 10, text: 'text-4xl' }
  };

  const { container, stroke, text } = sizes[size];
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-blue-500';
    if (score >= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className={clsx('relative', container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-gray-200"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <motion.circle
            className={getColor()}
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('font-bold', text, getColor())}>
            {score}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-2 text-sm text-gray-500">{label}</span>
      )}
    </div>
  );
}