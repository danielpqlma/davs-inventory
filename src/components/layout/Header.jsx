import React, { useState } from 'react';
import { Download, RefreshCw, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../auth/SupabaseConfigModal';

export function Header({ onExportCSV, onRefresh, isRefreshing }) {
  const [showConfig, setShowConfig] = useState(false);
  const configured = isSupabaseConfigured();

  return (
    <header className="md:hidden bg-white border-b border-border sticky top-0 z-30 px-4 py-3.5 flex items-center justify-between no-print">
      <div className="flex items-center gap-2">
        <span className="font-serif text-2xl font-light text-ink tracking-tight">
          Dav's
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
          title={configured ? 'Conectado a Supabase' : 'Supabase no configurado'}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-neutral-500 hover:text-ink hover:bg-neutral-100 rounded transition-colors"
          title="Actualizar datos desde Supabase"
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

        <button
          onClick={() => setShowConfig(true)}
          className="p-2 text-neutral-500 hover:text-ink hover:bg-neutral-100 rounded transition-colors"
          title="Configurar Supabase"
        >
          <Database className="w-4 h-4" />
        </button>
      </div>

      <SupabaseConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </header>
  );
}

