import React, { useState } from 'react';
import { formatMoney } from '../../lib/utils';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';

const DEFAULT_WHATSAPP = '584242313462';

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  whatsappNumber,
  storeName = "Dav's",
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  if (!isOpen) return null;

  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendWhatsApp = () => {
    if (cart.length === 0) return;

    const brandName = storeName || "Dav's";
    let message = `✨ *¡Hola ${brandName}! Deseo realizar el siguiente pedido:*\n\n`;

    if (customerName.trim()) {
      message += `👤 *Cliente:* ${customerName.trim()}\n`;
    }

    message += `🛍️ *PRENDAS SOLICITADAS:*\n`;

    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      message += `\n${index + 1}. *${item.name}*\n`;
      message += `   • Talla: ${item.size} | Color: ${item.color}\n`;
      message += `   • Cantidad: ${item.quantity} ud(s) × ${formatMoney(item.price)}\n`;
      message += `   • Subtotal: *${formatMoney(subtotal)}*\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💵 *TOTAL ESTIMADO: ${formatMoney(totalPrice)}*\n`;
    message += `📦 *Total Prendas:* ${totalUnits} unidad(es)\n`;

    if (customerNotes.trim()) {
      message += `📝 *Nota del cliente:* ${customerNotes.trim()}\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `¿Tienen disponibilidad de estas prendas para coordinar la entrega y forma de pago? ¡Muchas gracias!`;

    const rawNumber = (whatsappNumber || DEFAULT_WHATSAPP).replace(/\D/g, '');
    const targetNumber = rawNumber || DEFAULT_WHATSAPP;
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${targetNumber}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-border shadow-2xl flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-alabaster/40">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-ink" />
              <div>
                <h2 className="font-serif text-2xl font-light text-ink tracking-tight">
                  Bolsa de Compras
                </h2>
                <p className="font-sans text-[11px] text-neutral-400 uppercase tracking-widest mt-0.5">
                  {totalUnits} {totalUnits === 1 ? 'prenda' : 'prendas'} seleccionadas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-ink transition-colors rounded"
              title="Cerrar bolsa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-alabaster border border-border flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="font-serif text-lg text-ink font-light">Tu bolsa está vacía</p>
                <p className="font-sans text-xs text-neutral-400 max-w-xs">
                  Explora nuestra colección y añade las prendas que más te gusten.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="p-3 bg-white border border-border rounded flex gap-3 text-xs"
                >
                  {/* Photo thumbnail */}
                  <div className="w-16 h-20 bg-alabaster border border-border rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif text-sm text-neutral-400 italic">
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif text-sm text-ink font-medium leading-tight truncate">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.productId, item.variantId)}
                          className="text-neutral-400 hover:text-crimson p-0.5"
                          title="Eliminar de la bolsa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="font-sans text-[11px] text-neutral-500 mt-1">
                        Talla: <strong className="text-ink font-mono">{item.size}</strong> · Color:{' '}
                        <strong className="text-ink">{item.color}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-border rounded bg-alabaster/60">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-1 text-neutral-500 hover:text-ink transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono text-xs text-ink font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 text-neutral-500 hover:text-ink disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-sans text-xs font-semibold text-ink">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {cart.length > 0 && (
              <div className="pt-2 space-y-3">
                {/* Customer name input */}
                <div className="space-y-1">
                  <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                    Tu Nombre (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. María Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-minimal text-xs"
                  />
                </div>

                {/* Customer notes */}
                <div className="space-y-1">
                  <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-medium">
                    Nota o Dirección de Entrega (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Entrega en Caracas / Envío nacional"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="input-minimal text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Checkout Button */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-border bg-alabaster/40 space-y-4">
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Prendas en total:</span>
                  <span className="font-mono text-ink font-medium">{totalUnits} uds</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-border">
                  <span className="font-serif text-lg text-ink font-normal">Total a Pagar:</span>
                  <span className="font-serif text-2xl text-ink font-medium">
                    {formatMoney(totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-sans text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Enviar Pedido por WhatsApp</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <p className="font-sans text-[10px] text-center text-neutral-400">
                Se abrirá WhatsApp con el resumen de tu compra listo para enviar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
