import React, { useState, useEffect, useMemo } from 'react';
import { formatMoney } from '../../lib/utils';
import { X, Plus, Minus, ShoppingBag, Check } from 'lucide-react';

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart, showToast }) {
  if (!isOpen || !product) return null;

  const variants = product.product_variants || [];

  // Group variants by size and color
  const availableVariants = useMemo(() => {
    return variants.filter((v) => (Number(v.stock) || 0) > 0);
  }, [variants]);

  const availableSizes = useMemo(() => {
    return Array.from(new Set(availableVariants.map((v) => v.size)));
  }, [availableVariants]);

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Available colors for the chosen size
  const colorsForSize = useMemo(() => {
    return availableVariants
      .filter((v) => v.size === selectedSize)
      .map((v) => ({
        color: v.color,
        color_hex: v.color_hex,
        stock: v.stock,
        variantId: v.id,
      }));
  }, [availableVariants, selectedSize]);

  // Sync color when size changes
  useEffect(() => {
    if (colorsForSize.length > 0) {
      setSelectedColor(colorsForSize[0].color);
      setQuantity(1);
    } else {
      setSelectedColor('');
    }
  }, [selectedSize, colorsForSize]);

  // Selected variant
  const currentVariant = useMemo(() => {
    return availableVariants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
  }, [availableVariants, selectedSize, selectedColor]);

  const maxStock = currentVariant ? Number(currentVariant.stock) || 0 : 0;

  const handleAdd = () => {
    if (!currentVariant || maxStock <= 0) return;

    onAddToCart({
      productId: product.id,
      variantId: currentVariant.id,
      name: product.name,
      category: product.category,
      imageUrl: product.image_url,
      price: Number(product.sale_price) || 0,
      size: selectedSize,
      color: selectedColor,
      quantity,
      maxStock,
    });

    setAddedAnimation(true);
    showToast?.(`Agregado: ${product.name} (Talla ${selectedSize})`, 'success');
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-white border border-border w-full max-w-lg shadow-2xl rounded-lg overflow-hidden my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B89B72] font-semibold">
            {product.category}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-ink transition-colors rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Photo & Basic Info */}
          <div className="flex gap-4 items-center">
            <div className="w-24 h-32 bg-alabaster border border-border rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-serif text-2xl text-neutral-400 italic">
                  {product.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-2xl text-ink font-normal leading-tight">
                {product.name}
              </h3>
              <p className="font-serif text-2xl text-ink font-medium mt-1">
                {formatMoney(product.sale_price)}
              </p>
              <p className="font-sans text-xs text-neutral-500 mt-1">
                {availableVariants.length > 0 ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ En existencia ({availableVariants.reduce((sum, v) => sum + v.stock, 0)} uds)
                  </span>
                ) : (
                  <span className="text-crimson font-medium">Agotado temporalmente</span>
                )}
              </p>
            </div>
          </div>

          {availableVariants.length > 0 ? (
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Size selector */}
              <div>
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-semibold block mb-2">
                  Selecciona tu Talla:
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`font-mono text-xs px-3.5 py-2 rounded border transition-all ${
                        selectedSize === sz
                          ? 'border-ink bg-ink text-white font-semibold shadow-sm'
                          : 'border-border bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div>
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-semibold block mb-2">
                  Color disponible en talla {selectedSize}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorsForSize.map((col) => (
                    <button
                      key={col.color}
                      type="button"
                      onClick={() => setSelectedColor(col.color)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-sans transition-all ${
                        selectedColor === col.color
                          ? 'border-ink bg-alabaster text-ink font-semibold ring-1 ring-ink'
                          : 'border-border bg-white text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: col.color_hex || '#1A1A1A' }}
                      />
                      <span>{col.color}</span>
                      <span className="text-[10px] text-neutral-400">({col.stock} disp.)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between pt-2">
                <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-semibold">
                  Cantidad:
                </label>
                <div className="flex items-center border border-border rounded bg-alabaster">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 text-neutral-500 hover:text-ink disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 font-mono text-sm text-ink font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    disabled={quantity >= maxStock}
                    className="p-2 text-neutral-500 hover:text-ink disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-sans text-xs text-neutral-500 text-center py-4">
              Esta prenda no tiene unidades disponibles en este momento.
            </p>
          )}

          {/* Add to bag button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!currentVariant || maxStock <= 0}
              className={`w-full py-3.5 px-4 font-sans text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-all ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-white hover:bg-neutral-800 disabled:opacity-40'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado a la Bolsa!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Añadir a la Bolsa — {formatMoney(Number(product.sale_price) * quantity)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
