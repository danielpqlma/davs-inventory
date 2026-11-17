import React, { useState, useMemo, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { formatMoney, CATEGORIES } from '../../lib/utils';
import { CartDrawer } from './CartDrawer';
import { ProductDetailModal } from './ProductDetailModal';
import { ImagePreviewModal } from '../ui/ImagePreviewModal';
import { Toast } from '../ui/Toast';
import {
  ShoppingBag,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  RefreshCw,
  MessageCircle,
  Lock
} from 'lucide-react';

const DEFAULT_WHATSAPP = '584242313462';

export function CustomerCatalog({ onAdminAccess }) {
  // Read store parameters from URL
  const searchParams = useMemo(() => {
    return typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  }, []);

  const storeId = searchParams.get('tienda') || searchParams.get('id');
  const waFromUrl = searchParams.get('wa');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [storeWhatsApp, setStoreWhatsApp] = useState(waFromUrl || DEFAULT_WHATSAPP);
  const [storeBrandName, setStoreBrandName] = useState("Dav's");

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Cart State (Persisted in localStorage per store)
  const cartStorageKey = storeId ? `davs_cart_${storeId}` : 'davs_customer_cart';
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(cartStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (e) {
      console.warn('No se pudo guardar el carrito:', e);
    }
  }, [cart, cartStorageKey]);

  // Fetch products public catalog
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      // 1. Fetch store profile if storeId is given
      if (storeId) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('whatsapp_number, store_name')
            .eq('id', storeId)
            .maybeSingle();

          if (profile) {
            if (profile.whatsapp_number) setStoreWhatsApp(profile.whatsapp_number);
            if (profile.store_name) setStoreBrandName(profile.store_name);
          }
        } catch (profErr) {
          console.warn('No se pudo cargar el perfil:', profErr);
        }
      }

      // 2. Fetch products (Nota de seguridad: NO solicitamos 'cost_price' ni datos sensibles)
      let query = supabase
        .from('products')
        .select(`
          id,
          user_id,
          name,
          category,
          sale_price,
          image_url,
          created_at,
          product_variants (
            id,
            product_id,
            size,
            color,
            color_hex,
            stock
          )
        `)
        .order('created_at', { ascending: false });

      // Si se especifica una tienda, aislamos exclusivamente a las prendas de esa cuenta
      if (storeId) {
        query = query.eq('user_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [storeId]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) => ci.productId === item.productId && ci.variantId === item.variantId
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const newQty = Math.min(item.maxStock, currentQty + item.quantity);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleUpdateQuantity = (productId, variantId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId, variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const handleRemoveItem = (productId, variantId) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );
    showToast('Prenda eliminada de la bolsa', 'info');
  };

  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-ink flex flex-col selection:bg-ink selection:text-white">
      {/* Editorial Announcement Bar */}
      <div className="bg-ink text-white py-2 px-4 text-center font-sans text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#B89B72]" />
        <span>Colección {storeBrandName} · Envíos y Entregas por WhatsApp</span>
      </div>

      {/* Main Luxury Storefront Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => setSelectedCategory('all')}>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-ink">
              {storeBrandName}
            </h1>
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#B89B72] font-semibold">
              Tienda
            </span>
          </div>

          {/* Actions: Direct WhatsApp & Bag Button */}
          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/${storeWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${storeBrandName}, tengo una consulta sobre sus prendas.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-sans text-neutral-600 hover:text-ink hover:bg-alabaster rounded border border-border transition-colors"
              title="Contacto directo por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Atención WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 sm:px-4 sm:py-2.5 bg-ink text-white rounded flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm"
              title="Ver mi bolsa de compras"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline font-sans text-xs uppercase tracking-wider font-medium">
                Bolsa
              </span>
              {totalCartUnits > 0 && (
                <span className="w-5 h-5 bg-[#B89B72] text-white rounded-full font-mono text-[11px] font-bold flex items-center justify-center -ml-0.5">
                  {totalCartUnits}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por prenda, vestido, blazer, conjunto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-minimal pl-10 text-xs w-full bg-alabaster/50 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-ink"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Category Chips Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-sans">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-ink text-white font-medium shadow-sm'
                  : 'bg-alabaster text-neutral-600 hover:bg-neutral-200/60'
              }`}
            >
              Todas ({products.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-ink text-white font-medium shadow-sm'
                      : 'bg-alabaster text-neutral-600 hover:bg-neutral-200/60'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Catalog Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-ink" />
            <p className="font-serif text-lg text-ink font-light">
              Cargando colección Dav's...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-3">
            <p className="font-serif text-2xl text-ink font-normal">
              No se encontraron prendas
            </p>
            <p className="font-sans text-xs text-neutral-500">
              Prueba buscando con otro término o seleccionando una categoría diferente.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn-secondary !text-xs mt-2"
            >
              Ver todas las prendas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const variants = p.product_variants || [];
              const availableUnits = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
              const isAvailable = availableUnits > 0;
              const uniqueSizes = Array.from(new Set(variants.filter((v) => v.stock > 0).map((v) => v.size)));

              return (
                <div
                  key={p.id}
                  className="card-surface overflow-hidden group flex flex-col justify-between hover:shadow-card-hover transition-all duration-300"
                >
                  {/* Photo area with zoom trigger */}
                  <div className="relative aspect-[3/4] bg-alabaster overflow-hidden">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-alabaster">
                        <span className="font-serif text-4xl text-neutral-300 italic">
                          {p.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Quick zoom button */}
                    {p.image_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage({
                            url: p.image_url,
                            name: p.name,
                            category: p.category,
                          });
                        }}
                        className="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-sm text-ink opacity-0 group-hover:opacity-100 sm:transition-opacity shadow-sm hover:bg-white"
                        title="Ampliar foto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {isAvailable ? (
                        availableUnits <= 2 ? (
                          <span className="bg-[#FAF6EE] text-[#B89B72] border border-[#EFE7D8] text-[9px] font-sans uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                            Últimas {availableUnits}
                          </span>
                        ) : (
                          <span className="bg-white/90 backdrop-blur-sm text-ink text-[9px] font-sans uppercase tracking-wider font-semibold px-2 py-0.5 rounded shadow-sm">
                            Disponible
                          </span>
                        )
                      ) : (
                        <span className="bg-red-50 text-crimson border border-red-200 text-[9px] font-sans uppercase font-bold px-2 py-0.5 rounded shadow-sm">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info & Add to Bag */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="font-sans text-[10px] uppercase tracking-widest text-[#B89B72] font-semibold block mb-0.5">
                        {p.category}
                      </span>
                      <h3 className="font-serif text-base font-normal text-ink leading-snug line-clamp-2">
                        {p.name}
                      </h3>

                      {/* Sizes chips */}
                      {uniqueSizes.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {uniqueSizes.slice(0, 4).map((sz) => (
                            <span
                              key={sz}
                              className="font-mono text-[9px] px-1.5 py-0.5 bg-alabaster border border-border rounded text-neutral-600"
                            >
                              {sz}
                            </span>
                          ))}
                          {uniqueSizes.length > 4 && (
                            <span className="text-[9px] text-neutral-400">
                              +{uniqueSizes.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <span className="font-serif text-lg font-medium text-ink">
                        {formatMoney(p.sale_price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsDetailModalOpen(true);
                        }}
                        disabled={!isAvailable}
                        className="py-1.5 px-3 bg-ink hover:bg-neutral-800 disabled:opacity-40 text-white rounded text-xs font-sans font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Añadir</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile if items in cart */}
      {totalCartUnits > 0 && !isCartOpen && (
        <div className="sm:hidden fixed bottom-4 inset-x-4 z-40 animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 bg-ink text-white rounded-full shadow-2xl flex items-center justify-between font-sans text-xs uppercase tracking-wider font-semibold active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#B89B72]" />
              <span>Ver Bolsa ({totalCartUnits})</span>
            </div>
            <span className="font-mono text-sm font-bold">
              {formatMoney(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}
            </span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-alabaster/40 mt-12 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-serif text-2xl text-ink font-normal">Dav's</p>
            <p className="font-sans text-xs text-neutral-400 mt-1">
              Catálogo Oficial · Pedidos directos vía WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans text-neutral-500">
            <a
              href={`https://wa.me/${storeWhatsApp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink underline"
            >
              WhatsApp ({storeWhatsApp})
            </a>
            <span>·</span>
            {onAdminAccess && (
              <button
                onClick={onAdminAccess}
                className="flex items-center gap-1 hover:text-ink transition-colors"
                title="Acceso para el administrador de la tienda"
              >
                <Lock className="w-3 h-3" />
                <span>Acceso Administrativo</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
        showToast={showToast}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        whatsappNumber={storeWhatsApp}
        storeName={storeBrandName}
      />

      <ImagePreviewModal
        preview={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
