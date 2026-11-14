import React, { useState } from 'react';
import {
  formatMoney,
  calculateMargin,
  getTotalStock,
  getStockStatus
} from '../../lib/utils';
import { Badge, ColorIndicator } from '../ui/Badge';
import { ChevronDown, Plus, Minus, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';

export function ProductCard({
  product,
  onAdjustStock,
  onEdit,
  onDelete,
  updatingVariantId,
}) {
  const [expanded, setExpanded] = useState(false);

  const totalStock = getTotalStock(product.product_variants || []);
  const status = getStockStatus(product.product_variants || []);
  const margin = calculateMargin(product.cost_price, product.sale_price);

  return (
    <div className="card-surface overflow-hidden">
      {/* Main summary row */}
      <div className="p-4 flex gap-3.5">
        {/* Product photo */}
        <div className="w-18 h-22 w-16 h-20 bg-alabaster border border-border rounded flex-shrink-0 overflow-hidden flex items-center justify-center relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-alabaster">
              <span className="font-serif text-lg text-neutral-400 font-light italic">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-serif text-base font-normal text-ink leading-tight truncate">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1 text-neutral-400 hover:text-ink transition-colors"
                  title="Editar prenda"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-1 text-neutral-400 hover:text-crimson transition-colors"
                  title="Eliminar prenda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="font-mono text-[11px] text-neutral-400 uppercase mt-0.5">
              {product.sku} · {product.category}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/60">
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-sm font-medium text-ink">
                {formatMoney(product.sale_price)}
              </span>
              <span className="font-sans text-[10px] text-neutral-400">
                (Margen {margin}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={status} />
              <span className="font-sans text-xs text-neutral-500 font-medium">
                {totalStock} uds
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Variants Button */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 bg-alabaster/60 border-t border-border flex items-center justify-between text-xs font-sans text-neutral-600 hover:bg-alabaster transition-colors"
      >
        <span className="font-medium text-[11px] uppercase tracking-wider text-neutral-500">
          Variantes ({product.product_variants?.length || 0})
        </span>
        <div className="flex items-center gap-1 text-[11px]">
          <span>{expanded ? 'Ocultar tallas' : 'Ajustar stock'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expandable Variants with Thumb-Friendly Controls */}
      {expanded && (
        <div className="p-3 bg-white border-t border-border divide-y divide-border/60">
          {(!product.product_variants || product.product_variants.length === 0) ? (
            <p className="text-center py-3 text-xs text-neutral-400 font-sans">
              Sin variantes registradas.
            </p>
          ) : (
            product.product_variants.map((v) => {
              const isUpdating = updatingVariantId === v.id;
              const isLow = v.stock > 0 && v.stock < 3;
              const isOut = v.stock === 0;

              return (
                <div
                  key={v.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-alabaster border border-border rounded min-w-[32px] text-center text-ink">
                      {v.size}
                    </span>
                    <ColorIndicator hex={v.color_hex} label={v.color} />
                    {isLow && (
                      <span className="text-[10px] text-[#B89B72] font-medium">
                        (Bajo)
                      </span>
                    )}
                    {isOut && (
                      <span className="text-[10px] text-neutral-400">
                        (Agotado)
                      </span>
                    )}
                  </div>

                  {/* Tactile +1 / -1 Buttons for Single Thumb */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      disabled={v.stock <= 0 || isUpdating}
                      onClick={() => onAdjustStock(v, -1, product.name)}
                      className="w-8 h-8 rounded border border-border bg-white text-ink flex items-center justify-center active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-alabaster transition-all"
                      aria-label="Disminuir una unidad"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={`w-9 text-center font-mono text-xs font-semibold ${
                        isLow ? 'text-[#B89B72]' : isOut ? 'text-neutral-400' : 'text-ink'
                      }`}
                    >
                      {isUpdating ? '...' : v.stock}
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onAdjustStock(v, 1, product.name)}
                      className="w-8 h-8 rounded border border-border bg-white text-ink flex items-center justify-center active:scale-95 disabled:opacity-30 hover:bg-alabaster transition-all"
                      aria-label="Aumentar una unidad"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

