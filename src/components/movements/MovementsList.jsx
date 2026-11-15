import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { History, ArrowUpRight, ArrowDownLeft, RefreshCw, Filter } from 'lucide-react';
import { ColorIndicator } from '../ui/Badge';

export function MovementsList({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterReason, setFilterReason] = useState('all');

  const fetchLogs = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Query inventory_logs joined with product_variants and products
      const { data, error } = await supabase
        .from('inventory_logs')
        .select(`
          id,
          change_amount,
          reason,
          created_at,
          product_variants (
            id,
            size,
            color,
            color_hex,
            products (
              id,
              name,
              sku,
              category
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error al cargar movimientos de Supabase:', err);
      showToast?.('Error al cargar el historial de movimientos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterReason === 'all') return true;
    return log.reason === filterReason;
  });

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-light text-ink tracking-tight">
            Historial de Movimientos
          </h2>
          <p className="font-sans text-xs text-neutral-400 uppercase tracking-widest mt-0.5">
            Registro de movimientos y ventas en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reason Filter */}
          <div className="flex items-center gap-1 bg-white border border-border rounded px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="font-sans text-xs bg-transparent text-ink focus:outline-none"
            >
              <option value="all">Todos los motivos</option>
              <option value="Venta">Ventas</option>
              <option value="Reposición">Reposiciones</option>
              <option value="Ajuste manual">Ajustes manuales</option>
              <option value="Creación inicial">Creación inicial</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary !py-2 !px-3"
            title="Refrescar historial"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-sans text-neutral-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-ink" />
            <span>Cargando historial...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs font-sans text-neutral-400">
            No hay movimientos registrados en la base de datos todavía.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map((log) => {
              const isPositive = log.change_amount > 0;
              const product = log.product_variants?.products;
              const variant = log.product_variants;
              const dateObj = new Date(log.created_at);
              const formattedDate = dateObj.toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString('es-DO', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-alabaster/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-crimson'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-serif text-base text-ink font-normal leading-tight">
                          {product?.name || 'Prenda Desconocida'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 flex-wrap">
                        {variant && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-ink">
                              Talla {variant.size}
                            </span>
                            <span>·</span>
                            <ColorIndicator hex={variant.color_hex} label={variant.color} />
                          </span>
                        )}
                        <span>·</span>
                        <span className="text-neutral-400">
                          {formattedDate} a las {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-mono text-base font-semibold block ${
                        isPositive ? 'text-emerald-700' : 'text-crimson'
                      }`}
                    >
                      {isPositive ? `+${log.change_amount}` : log.change_amount}
                    </span>
                    <span className="font-sans text-[11px] text-neutral-500 uppercase tracking-wider">
                      {log.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

