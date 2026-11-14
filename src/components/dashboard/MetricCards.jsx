import React from 'react';
import { formatMoney } from '../../lib/utils';
import { Layers, DollarSign, TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';

export function MetricCards({ products = [] }) {
  // Cálculos en vivo
  let totalUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let lowStockVariantsCount = 0;
  let outOfStockVariantsCount = 0;
  const categoryMap = {};

  products.forEach((p) => {
    const cost = Number(p.cost_price) || 0;
    const price = Number(p.sale_price) || 0;

    if (p.product_variants && p.product_variants.length > 0) {
      p.product_variants.forEach((v) => {
        const qty = Number(v.stock) || 0;
        totalUnits += qty;
        totalCostValue += qty * cost;
        totalRetailValue += qty * price;

        if (qty === 0) outOfStockVariantsCount++;
        else if (qty < 3) lowStockVariantsCount++;

        categoryMap[p.category] = (categoryMap[p.category] || 0) + qty;
      });
    }
  });

  const potentialProfit = Math.max(0, totalRetailValue - totalCostValue);
  const averageMargin =
    totalRetailValue > 0
      ? Math.round(((totalRetailValue - totalCostValue) / totalRetailValue) * 100)
      : 0;

  const topCategoryEntry = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* 4 Main Minimalist KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Physical Items */}
        <div className="card-surface p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="font-sans text-[10px] uppercase tracking-widest font-semibold">
              Prendas Físicas
            </span>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-light text-ink">
              {totalUnits.toLocaleString('es-DO')}
            </p>
            <p className="font-sans text-[11px] text-neutral-500 mt-1">
              En {products.length} referencias activas
            </p>
          </div>
        </div>

        {/* Cost Value */}
        <div className="card-surface p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="font-sans text-[10px] uppercase tracking-widest font-semibold">
              Valor a Costo
            </span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-light text-ink truncate">
              {formatMoney(totalCostValue)}
            </p>
            <p className="font-sans text-[11px] text-neutral-500 mt-1">
              Capital invertido en stock
            </p>
          </div>
        </div>

        {/* Retail Value & Potential Profit */}
        <div className="card-surface p-4 md:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="font-sans text-[10px] uppercase tracking-widest font-semibold">
              Valor a Venta
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-light text-ink truncate">
              {formatMoney(totalRetailValue)}
            </p>
            <div className="flex items-center gap-1.5 mt-1 font-sans text-[11px] text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{formatMoney(potentialProfit)} ({averageMargin}%)</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card-surface p-4 md:p-5 flex flex-col justify-between border-l-2 border-l-[#B89B72]">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#B89B72]">
              Alertas de Stock
            </span>
            <AlertTriangle className="w-4 h-4 text-[#B89B72]" />
          </div>
          <div>
            <p className="font-serif text-3xl md:text-4xl font-light text-[#B89B72]">
              {lowStockVariantsCount + outOfStockVariantsCount}
            </p>
            <p className="font-sans text-[11px] text-neutral-500 mt-1">
              {outOfStockVariantsCount} agotadas · {lowStockVariantsCount} con &lt;3 uds
            </p>
          </div>
        </div>
      </div>

      {/* Category distribution bar */}
      {topCategoryEntry && (
        <div className="card-surface p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
              Distribución por Categorías
            </span>
            <span className="font-sans text-xs text-neutral-600">
              Categoría líder: <strong className="text-ink">{topCategoryEntry[0]}</strong> ({topCategoryEntry[1]} uds)
            </span>
          </div>

          <div className="h-2 w-full bg-alabaster rounded overflow-hidden flex">
            {Object.entries(categoryMap).map(([cat, qty], idx) => {
              const pct = totalUnits > 0 ? (qty / totalUnits) * 100 : 0;
              const opacities = ['bg-ink', 'bg-neutral-800', 'bg-neutral-600', 'bg-neutral-400', 'bg-[#B89B72]'];
              const bgClass = opacities[idx % opacities.length];
              return (
                <div
                  key={cat}
                  style={{ width: `${pct}%` }}
                  title={`${cat}: ${qty} unidades (${pct.toFixed(1)}%)`}
                  className={`${bgClass} h-full transition-all`}
                />
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs font-sans text-neutral-600">
            {Object.entries(categoryMap).slice(0, 5).map(([cat, qty]) => (
              <span key={cat} className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ink inline-block" />
                <span>{cat}:</span>
                <strong className="text-ink">{qty}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

