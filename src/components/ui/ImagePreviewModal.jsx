import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function ImagePreviewModal({ preview, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (preview) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [preview, onClose]);

  if (!preview || !preview.url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        title="Cerrar previsualización (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Container */}
      <div
        className="relative max-w-lg sm:max-w-xl md:max-w-2xl w-full flex flex-col items-center animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Large Image */}
        <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-lg bg-neutral-900/60 shadow-2xl border border-white/10">
          <img
            src={preview.url}
            alt={preview.name || 'Prenda'}
            className="w-full h-auto max-h-[75vh] object-contain select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Minimalist Info Card below photo */}
        {preview.name && (
          <div className="mt-3.5 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-3 text-white text-xs">
            <span className="font-serif text-sm tracking-wide">
              {preview.name}
            </span>
            {preview.category && (
              <>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="font-sans text-[11px] uppercase tracking-widest text-[#B89B72]">
                  {preview.category}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
