import React from 'react';

export const EditorSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-pulse">
      {/* Top Header Skeleton */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200 flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-4 bg-slate-200 rounded w-48 sm:w-64" />
            <div className="h-2.5 bg-slate-100 rounded w-24" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-20 h-8 rounded-lg bg-slate-200" />
        </div>
      </header>

      {/* Toolbar Skeleton Placeholder */}
      <div className="w-full bg-white border-b border-slate-200 py-2.5 px-6 flex items-center justify-center gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="w-6 h-6 rounded bg-slate-200" />
        ))}
      </div>

      {/* Google Docs Canvas Workspace Skeleton */}
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="w-full max-w-[816px] min-h-[900px] bg-white rounded-sm shadow-md border border-slate-200/80 p-14 space-y-4">
          <div className="h-7 bg-slate-200 rounded w-2/5 mb-6" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-11/12" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-4/5 mb-6" />

          <div className="h-5 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-10/12" />
          <div className="h-3 bg-slate-100 rounded w-full" />
          <div className="h-3 bg-slate-100 rounded w-9/12" />
        </div>
      </main>
    </div>
  );
};