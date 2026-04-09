import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
      style={{
        backgroundSize: '200% 100%',
        backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        animationDuration: '1.5s'
      }}
    />
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 w-full">
      <div className="h-10 bg-gray-100 rounded-xl w-full" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 items-center p-4 border border-gray-50 rounded-2xl">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 space-y-4 shadow-sm">
      <div className="flex justify-between items-start">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-1/3" />
      </div>
      <div className="pt-4 border-t border-gray-50 flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};
