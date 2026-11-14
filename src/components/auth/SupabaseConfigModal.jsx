import React, { useState } from 'react';
import { Database, Key, CheckCircle, ExternalLink, X } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '../../lib/supabase';

export function SupabaseConfigModal({ isOpen, onClose, onSaved }) {
  const [url, setUrl] = useState(
    supabaseUrl === 'https://tu-proyecto.supabase.co' ? '' : supabaseUrl
  );
  const [key, setKey] = useState(
    supabaseAnonKey === 'tu-anon-key-aqui' ? '' : supabaseAnonKey
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) return;

    localStorage.setItem('davs_supabase_url', url.trim());
    localStorage.setItem('davs_supabase_key', key.trim());

    if (onSaved) onSaved();
    window.location.reload();
  };

  const handleClear = () => {
    localStorage.removeItem('davs_supabase_url');
    localStorage.removeItem('davs_supabase_key');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-border w-full max-w-lg shadow-modal rounded-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-ink" />
            <h3 className="font-serif text-2xl font-normal text-ink">
              Conexión Supabase
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-ink transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="font-sans text-xs text-neutral-600 leading-relaxed">
            Ingresa las credenciales de tu proyecto Supabase (disponibles en{' '}
            <strong className="text-ink">Project Settings → API</strong>). También puedes
            definirlas en el archivo <code className="bg-alabaster px-1 py-0.5 border border-border rounded text-[11px]">.env</code>.
          </p>

          <div className="space-y-1.5">
            <label className="font-sans text-xs uppercase tracking-wider text-neutral-500 font-medium">
              Project URL
            </label>
            <div className="relative">
              <Database className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="url"
                required
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input-minimal pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-xs uppercase tracking-wider text-neutral-500 font-medium">
              API Key (Anon / Public)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                required
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="input-minimal pl-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border">
            {isSupabaseConfigured() ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-crimson hover:underline"
              >
                Restablecer a valores .env
              </button>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Conectar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

