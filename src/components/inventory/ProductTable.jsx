import React, { useState } from 'react';
import {
  formatMoney,
  getTotalStock,
  getStockStatus
} from '../../lib/utils';
import { Badge, ColorIndicator } from '../ui/Badge';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

export function ProductTable({
  products = [],
  onAdjustStock,
  onEdit,
  onDelete,
  updatingVariantId,
}) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="card-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-ink bg-white">
              <th className="py-3 px-3 w-8"></th>
              <th className="py-3 px-3 w-12 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Foto
              </th>
              <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Prenda / SKU
              </th>
              <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Categoría
              </th>
              <th className="py-3 px-4 font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Variantes
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Stock Físico
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Costo
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Venta
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Ganancia / Prenda
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Ganancia Total
              </th>
              <th className="py-3 px-4 text-center font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Estado
              </th>
              <th className="py-3 px-4 text-right font-sans text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-neutral-400 font-sans text-xs">
                  No se encontraron prendas con los filtros aplicados.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = getTotalStock(p.product_variants || []);
                const status = getStockStatus(p.product_variants || []);
                const unitProfit = Math.max(0, (Number(p.sale_price) || 0) - (Number(p.cost_price) || 0));
                const totalProfit = unitProfit * totalStock;
                const isExpanded = !!expandedRows[p.id];

                // Resumen de colores únicos
                const uniqueColors = Array.from(
                  new Set((p.product_variants || []).map((v) => v.color_hex))
                );
                // Resumen de tallas únicas
                const uniqueSizes = Array.from(
                  new Set((p.product_variants || []).map((v) => v.size))
                );

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={`hover:bg-alabaster/60 transition-colors ${
                        isExpanded ? 'bg-alabaster/40' : ''
                      }`}
                    >
                      {/* Expand trigger */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(p.id)}
                          className="p-1 text-neutral-400 hover:text-ink transition-colors"
                          title={isExpanded ? 'Ocultar variantes' : 'Ver variantes'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-10 h-12 bg-alabaster border border-border rounded overflow-hidden flex items-center justify-center">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-serif text-sm text-neutral-400 italic">
                              {p.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <p className="font-serif text-base text-ink font-normal leading-tight">
                          {p.name}
                        </p>
                        <p className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider mt-0.5">
                          {p.sku}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-sans text-xs text-neutral-600">
                        {p.category}
                      </td>

                      {/* Variants overview chips */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {/* Color dots */}
                          <div className="flex items-center -space-x-1 mr-1">
                            {uniqueColors.slice(0, 4).map((hex, i) => (
                              <span
                                key={i}
                                className="w-3.5 h-3.5 rounded-full border border-white inline-block shadow-sm"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          {/* Size badges */}
                          {uniqueSizes.slice(0, 5).map((sz) => (
                            <span
                              key={sz}
                              className="font-mono text-[10px] px-1.5 py-0.2 bg-white border border-border rounded text-neutral-600"
                            >
                              {sz}
                            </span>
                          ))}
                          {uniqueSizes.length > 5 && (
                            <span className="text-[10px] text-neutral-400">
                              +{uniqueSizes.length - 5}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-ink">
                        {totalStock} uds
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-sans text-xs text-neutral-500">
                        {formatMoney(p.cost_price)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-4 text-right font-sans text-xs font-medium text-ink">
                        {formatMoney(p.sale_price)}
                      </td>

                      {/* Ganancia por prenda */}
                      <td className="py-3 px-4 text-right font-sans text-xs text-emerald-700 font-medium">
                        +{formatMoney(unitProfit)}
                      </td>

                      {/* Ganancia total al vender todo */}
                      <td className="py-3 px-4 text-right font-sans text-xs text-emerald-800 font-semibold">
                        +{formatMoney(totalProfit)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <Badge status={status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-neutral-400 hover:text-ink hover:bg-neutral-100 rounded transition-colors"
                            title="Editar prenda"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
                            className="p-1.5 text-neutral-400 hover:text-crimson hover:bg-red-50 rounded transition-colors"
                            title="Eliminar prenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expandable Variants Matrix */}
                    {isExpanded && (
                      <tr className="bg-alabaster/70 border-b border-border">
                        <td colSpan={12} className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                                Ajuste de Stock por Variante
                              </span>
                              <span className="font-sans text-[11px] text-neutral-400">
                                Los ajustes con + y - actualizan el stock físico de forma inmediata.
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                              {(!p.product_variants || p.product_variants.length === 0) ? (
                                <p className="text-xs text-neutral-400">
                                  Sin variantes registradas. Haz clic en Editar para agregarlas.
                                </p>
                              ) : (
                                p.product_variants.map((v) => {
                                  const isUpdating = updatingVariantId === v.id;
                                  const isLow = v.stock > 0 && v.stock < 3;
                                  const isOut = v.stock === 0;

                                  return (
                                    <div
                                      key={v.id}
                                      className="bg-white border border-border p-2.5 rounded flex items-center justify-between shadow-subtle"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-alabaster border border-border rounded min-w-[32px] text-center text-ink">
                                          {v.size}
                                        </span>
                                        <ColorIndicator hex={v.color_hex} label={v.color} />
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          disabled={v.stock <= 0 || isUpdating}
                                          onClick={() => onAdjustStock(v, -1, p.name)}
                                          className="w-7 h-7 rounded border border-border bg-white text-ink flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-alabaster transition-all"
                                          title="Descontar 1 unidad (Venta)"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>

                                        <span
                                          className={`w-8 text-center font-mono text-xs font-semibold ${
                                            isLow
                                              ? 'text-[#B89B72]'
                                              : isOut
                                              ? 'text-neutral-400'
                                              : 'text-ink'
                                          }`}
                                        >
                                          {isUpdating ? '...' : v.stock}
                                        </span>

                                        <button
                                          type="button"
                                          disabled={isUpdating}
                                          onClick={() => onAdjustStock(v, 1, p.name)}
                                          className="w-7 h-7 rounded border border-border bg-white text-ink flex items-center justify-center active:scale-95 disabled:opacity-30 hover:bg-alabaster transition-all"
                                          title="Sumar 1 unidad (Reposición)"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

