import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { getTotalStock } from '../../lib/utils';

export function DeleteModal({ isOpen, onClose, product, onDeleted, showToast }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !product) return null;

  const totalUnits = getTotalStock(product.product_variants || []);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const { error: delErr } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (delErr) throw delErr;

      showToast?.(`Prenda ${product.name} eliminada`, 'info');
      onDeleted?.(product.id);
      onClose();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError(err.message || 'Error al eliminar el producto.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-border w-full max-w-md shadow-modal rounded-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-crimson">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-serif text-2xl font-normal text-ink">
              Eliminar Prenda
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
        <div className="p-6 space-y-4">
          <p className="font-sans text-xs text-neutral-600 leading-relaxed">
            ¿Estás seguro de que deseas eliminar permanentemente esta prenda del inventario de Dav's?
          </p>

          <div className="p-3 bg-alabaster border border-border rounded space-y-1">
            <p className="font-serif text-lg text-ink font-normal">{product.name}</p>
            <p className="font-sans text-xs text-neutral-500 uppercase tracking-wider">
              {product.category}
            </p>
            <p className="font-sans text-xs text-[#991B1B] font-medium pt-1">
              Se eliminarán {product.product_variants?.length || 0} variantes y {totalUnits} unidades de stock físico.
            </p>
          </div>

          <p className="font-sans text-[11px] text-neutral-400">
            Esta acción no se puede deshacer.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-crimson rounded">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border bg-alabaster/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

