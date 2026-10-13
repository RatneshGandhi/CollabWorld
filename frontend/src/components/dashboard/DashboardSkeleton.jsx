import React from 'react';

export const DashboardSkeleton = ({ viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2.5 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 sm:px-5 bg-white border border-slate-200/70 rounded-xl"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex-shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
            <div className="w-6 h-6 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="bg-white border border-slate-200/70 rounded-2xl shadow-xs overflow-hidden flex flex-col"
        >
          {/* Canvas Preview Area Skeleton */}
          <div className="w-full aspect-[16/10] bg-slate-100 p-5 flex flex-col justify-between border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
            <div className="space-y-1.5 opacity-60">
              <div className="h-1.5 bg-slate-300 rounded w-3/4" />
              <div className="h-1.5 bg-slate-300 rounded w-full" />
              <div className="h-1.5 bg-slate-300 rounded w-5/6" />
              <div className="h-1.5 bg-slate-300 rounded w-1/2" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-2.5 bg-slate-200 rounded w-16" />
              <div className="h-3.5 bg-slate-200 rounded-full w-12" />
            </div>
          </div>

          {/* Card Footer Skeleton */}
          <div className="p-4 flex items-center justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="w-6 h-6 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
};