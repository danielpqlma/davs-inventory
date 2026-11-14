import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

export function Header({ onExportCSV, onRefresh, isRefreshing }) {
  return (
    <header className="md:hidden bg-white border-b border-border sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between no-print">
      <div className="flex items-center gap-2">
        <span className="font-serif text-2xl font-light text-ink tracking-tight">
          Dav's
        </span>
        <span
          className="w-2 h-2 rounded-full bg-emerald-500"
          title="Sistema en línea"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-neutral-500 hover:text-ink hover:bg-neutral-100 rounded transition-colors"
          title="Actualizar inventario"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onExportCSV}
          className="p-2 text-neutral-500 hover:text-ink hover:bg-neutral-100 rounded transition-colors"
          title="Exportar inventario a CSV"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
