import { FiStar } from 'react-icons/fi';

export default function StarRating({ rating = 0, size = 'sm' }) {
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300 dark:text-slate-600'
          }
        />
      ))}
    </div>
  );
}
