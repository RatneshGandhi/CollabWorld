import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_STYLES = {
  success: 'bg-emerald-900/90 text-white border-emerald-700/60 shadow-emerald-950/20',
  error: 'bg-red-900/90 text-white border-red-700/60 shadow-red-950/20',
  info: 'bg-slate-900/90 text-white border-slate-700/60 shadow-slate-950/20',
  warning: 'bg-amber-900/90 text-white border-amber-700/60 shadow-amber-950/20',
};

const ICON_STYLES = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-amber-400',
};

export const ToastContainer = ({ toasts = [], onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const IconComponent = TOAST_ICONS[t.type] || Info;
        const colorClass = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        const iconColor = ICON_STYLES[t.type] || ICON_STYLES.info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-xs font-medium transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in ${colorClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <IconComponent className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
              <p className="truncate leading-relaxed">{t.message}</p>
            </div>

            <button
              type="button"
              onClick={() => onClose(t.id)}
              className="text-white/60 hover:text-white p-1 rounded-md transition-colors cursor-pointer flex-shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};