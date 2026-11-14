import React from 'react';

export function Badge({ status, text }) {
  if (status === 'agotado') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
        {text || 'Agotado'}
      </span>
    );
  }

  if (status === 'bajo') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-[#FAF6EE] text-[#B89B72] border border-[#EFE7D8]">
        {text || 'Stock Bajo'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
      {text || 'En Stock'}
    </span>
  );
}

export function ColorIndicator({ hex, label }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          backgroundColor: hex || '#000000',
          border: '1px solid rgba(0,0,0,0.12)',
        }}
      />
      {label && <span className="font-sans text-xs text-neutral-600">{label}</span>}
    </div>
  );
}

