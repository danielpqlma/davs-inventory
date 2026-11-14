import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-crimson flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-ink flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 animate-fade-in no-print">
      <div className="bg-white border border-border shadow-elevated px-4 py-3 rounded flex items-center gap-3 min-w-[280px] max-w-md">
        {icons[toast.type] || icons.info}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-medium text-ink leading-tight">
            {toast.message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-ink transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

