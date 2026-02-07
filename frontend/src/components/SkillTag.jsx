// frontend/src/components/SkillTag.jsx
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { X } from 'lucide-react';

const categories = {
  programming: 'bg-blue-100 text-blue-700 border-blue-200',
  frontend: 'bg-purple-100 text-purple-700 border-purple-200',
  backend: 'bg-green-100 text-green-700 border-green-200',
  database: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cloud: 'bg-orange-100 text-orange-700 border-orange-200',
  ml_ai: 'bg-pink-100 text-pink-700 border-pink-200',
  soft_skills: 'bg-teal-100 text-teal-700 border-teal-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function SkillTag({
  skill,
  category = 'default',
  removable = false,
  onRemove,
  onClick,
  className = ''
}) {
  const colorClass = categories[category] || categories.default;

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border',
        colorClass,
        onClick && 'cursor-pointer',
        className
      )}
    >
      {skill}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(skill);
          }}
          className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </motion.span>
  );
}