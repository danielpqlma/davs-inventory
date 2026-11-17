import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { X, MessageCircle, Copy, Check, Store, ExternalLink } from 'lucide-react';

export function StoreSettingsModal({ isOpen, onClose, showToast }) {
  const { user } = useAuth();

  const [whatsapp, setWhatsapp] = useState('');
  const [storeName, setStoreName] = useState("Dav's");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (!isOpen || !user) return;

    // 1. From user metadata
    const metaWa = user.user_metadata?.whatsapp_number || '';
    const metaStore = user.user_metadata?.store_name || "Dav's";

    // 2. From localStorage
    const localWa = localStorage.getItem(`davs_wa_${user.id}`) || '';
    const localStore = localStorage.getItem(`davs_store_${user.id}`) || '';

    setWhatsapp(metaWa || localWa || '');
    setStoreName(metaStore || localStore || "Dav's");

    // 3. Try to fetch from 'profiles' table if it exists
    supabase
      .from('profiles')
      .select('whatsapp_number, store_name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          if (data.whatsapp_number) setWhatsapp(data.whatsapp_number);
          if (data.store_name) setStoreName(data.store_name);
        }
      });
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Clean WhatsApp number (digits only for wa.me link)
  const cleanNumber = whatsapp.replace(/\D/g, '');

  // Generate unique catalog link for this account
  const catalogUrl = `${window.location.origin}/catalogo?tienda=${user.id}${
    cleanNumber ? `&wa=${cleanNumber}` : ''
  }`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    showToast?.('Enlace personal de tu catálogo copiado', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const digitsOnly = whatsapp.replace(/\D/g, '');

    try {
      // 1. Save in localStorage for instant fallback
      localStorage.setItem(`davs_wa_${user.id}`, digitsOnly);
      localStorage.setItem(`davs_store_${user.id}`, storeName.trim());

      // 2. Save in Supabase User Metadata
      await supabase.auth.updateUser({
        data: {
          whatsapp_number: digitsOnly,
          store_name: storeName.trim(),
        },
      });

      // 3. Try to save in 'profiles' table
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          whatsapp_number: digitsOnly,
          store_name: storeName.trim(),
          updated_at: new Date().toISOString(),
        });
      } catch (tableErr) {
        // Table may not exist yet, fallback already handled in metadata
        console.warn('Profiles table upsert skipped:', tableErr);
      }

      showToast?.('Número de WhatsApp y tienda guardados con éxito', 'success');
      onClose();
    } catch (err) {
      console.error('Error al guardar ajustes:', err);
      showToast?.(err.message || 'Error al guardar los ajustes', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-white border border-border w-full max-w-md shadow-2xl rounded-lg overflow-hidden my-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-alabaster/40">
          <div className="flex items-center gap-2 text-ink">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <div>
              <h3 className="font-serif text-xl font-normal text-ink">
                Configurar WhatsApp de Pedidos
              </h3>
              <p className="font-sans text-[11px] text-neutral-400 mt-0.5">
                Cada cuenta recibe pedidos en su propio número
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-ink transition-colors rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* WhatsApp input */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-semibold block">
              Tu Número de WhatsApp *
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="Ej. +58 424 2313462"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="input-minimal text-xs pl-3 font-mono"
              />
            </div>
            <p className="font-sans text-[11px] text-neutral-400">
              Incluye el código de país (ej: +58 para Venezuela, +1 para USA, etc.).
            </p>
          </div>

          {/* Store Name input */}
          <div className="space-y-1.5">
            <label className="font-sans text-[11px] uppercase tracking-wider text-neutral-600 font-semibold block">
              Nombre de tu Tienda / Marca
            </label>
            <input
              type="text"
              placeholder="Dav's"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="input-minimal text-xs"
            />
          </div>

          {/* Your Unique Catalog Link */}
          <div className="p-3.5 bg-alabaster border border-border rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Enlace Único de tu Catálogo
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-[11px] font-sans text-neutral-600 hover:text-ink flex items-center gap-1 font-medium"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-neutral-500 break-all select-all bg-white p-2 border border-border rounded">
              {catalogUrl}
            </p>
            <p className="font-sans text-[10px] text-neutral-400">
              Comparte este enlace con tus clientes. Los pedidos que hagan desde este enlace llegarán directamente a tu WhatsApp.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary !text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary !text-xs !px-5"
            >
              {saving ? 'Guardando...' : 'Guardar Ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
