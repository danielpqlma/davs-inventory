import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { CATEGORIES, exportInventoryToCSV, getStockStatus, getTotalStock } from './lib/utils';

// Layout & UI
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { Toast } from './components/ui/Toast';

// Views & Modals
import { MetricCards } from './components/dashboard/MetricCards';
import { ProductTable } from './components/inventory/ProductTable';
import { ProductCard } from './components/inventory/ProductCard';
import { ProductModal } from './components/inventory/ProductModal';
import { DeleteModal } from './components/inventory/DeleteModal';
import { MovementsList } from './components/movements/MovementsList';
import { ImagePreviewModal } from './components/ui/ImagePreviewModal';
import { CustomerCatalog } from './components/catalog/CustomerCatalog';
import { StoreSettingsModal } from './components/settings/StoreSettingsModal';

// Icons
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

export function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // Mode: 'catalog' (public store) | 'admin' (internal inventory)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === 'undefined') return 'catalog';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();

    if (path.startsWith('/admin') || hash === '#admin' || search.includes('admin')) {
      return 'admin';
    }
    if (path.startsWith('/catalogo') || hash === '#catalogo' || search.includes('catalogo')) {
      return 'catalog';
    }
    return 'catalog';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') setViewMode('admin');
      else if (hash === '#catalogo') setViewMode('catalog');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation State: 'dashboard' | 'inventory' | 'movements'
  const [currentView, setCurrentView] = useState('inventory');

  // Supabase Data State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingVariantId, setUpdatingVariantId] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'disponible' | 'bajo' | 'agotado'

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Fetch all products with their variants from Supabase (strictly for current user)
  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!isSupabaseConfigured() || !user?.id) {
      setLoadingProducts(false);
      return;
    }

    if (!isSilent) setLoadingProducts(true);
    else setIsRefreshing(true);

    try {
      const PRIMARY_STORE_ID = 'dca68e83-9c30-4d1e-84e4-00bd2eb0b9b5';
      let query = supabase
        .from('products')
        .select(`
          id,
          user_id,
          sku,
          name,
          category,
          cost_price,
          sale_price,
          image_url,
          created_at,
          product_variants (
            id,
            product_id,
            size,
            color,
            color_hex,
            stock,
            created_at
          )
        `);

      if (user.id === PRIMARY_STORE_ID) {
        query = query.or(`user_id.eq.${PRIMARY_STORE_ID},user_id.is.null`);
        // Reclamar en segundo plano las prendas iniciales sin user_id
        supabase
          .from('products')
          .update({ user_id: PRIMARY_STORE_ID })
          .is('user_id', null)
          .then(() => {});
      } else {
        query = query.eq('user_id', user.id);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      showToast('Error al conectar con el servidor', 'error');
    } finally {
      setLoadingProducts(false);
      setIsRefreshing(false);
    }
  }, [user?.id, showToast]);

  // Initial load when user authenticates or changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchProducts();
    }
  }, [isAuthenticated, user?.id, fetchProducts]);

  // Real-time optimistic stock adjustment (+1 / -1)
  const handleAdjustStock = async (variant, delta, productName) => {
    if (updatingVariantId) return;

    const newStock = Math.max(0, (variant.stock || 0) + delta);
    setUpdatingVariantId(variant.id);

    // 1. Optimistic local update
    setProducts((prev) =>
      prev.map((p) => {
        if (!p.product_variants) return p;
        return {
          ...p,
          product_variants: p.product_variants.map((v) =>
            v.id === variant.id ? { ...v, stock: newStock } : v
          ),
        };
      })
    );

    try {
      // 2. Update stock in Supabase 'product_variants'
      const { error: updateErr } = await supabase
        .from('product_variants')
        .update({ stock: newStock })
        .eq('id', variant.id);

      if (updateErr) throw updateErr;

      // 3. Log movement in Supabase 'inventory_logs'
      const reason = delta > 0 ? 'Reposición' : 'Venta';
      await supabase.from('inventory_logs').insert({
        variant_id: variant.id,
        change_amount: delta,
        reason,
      });

      showToast(
        `${productName} (${variant.size} - ${variant.color}): ${delta > 0 ? '+' : ''}${delta} (${reason})`,
        'success'
      );
    } catch (err) {
      console.error('Error ajustando stock:', err);
      showToast('Error al sincronizar el stock', 'error');
      // Rollback on error
      fetchProducts(true);
    } finally {
      setUpdatingVariantId(null);
    }
  };

  // Open modal for editing
  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  // Open modal for new product
  const handleNewProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    exportInventoryToCSV(products);
    showToast('Archivo CSV de inventario exportado con éxito', 'success');
  };

  // Filtered Products Memo
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Stock Status
      if (selectedStatus !== 'all') {
        const st = getStockStatus(p.product_variants || []);
        if (st !== selectedStatus) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  // Global low stock count for badges
  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const st = getStockStatus(p.product_variants || []);
      return st === 'bajo' || st === 'agotado';
    }).length;
  }, [products]);

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border border-ink flex items-center justify-center rounded-full mb-4 animate-pulse">
          <span className="font-serif text-3xl font-normal italic text-ink">D</span>
        </div>
        <p className="font-serif text-2xl font-light text-ink tracking-tight">Dav's</p>
        <p className="font-sans text-[11px] uppercase tracking-widest text-neutral-400 mt-1">
          Cargando...
        </p>
      </div>
    );
  }

  // Handle navigation to customer catalog with store parameters
  const handleOpenCatalog = () => {
    if (user?.id) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('tienda', user.id);
        const savedWa = localStorage.getItem(`davs_wa_${user.id}`);
        if (savedWa) url.searchParams.set('wa', savedWa.replace(/\D/g, ''));
        window.history.replaceState({}, '', url.toString());
      } catch (e) {}
    }
    window.location.hash = 'catalogo';
    setViewMode('catalog');
  };

  const handleCopyCatalogLink = () => {
    if (!user?.id) return;
    const savedWa = localStorage.getItem(`davs_wa_${user.id}`);
    const cleanWa = savedWa ? savedWa.replace(/\D/g, '') : '';
    const url = `${window.location.origin}/catalogo?tienda=${user.id}${cleanWa ? `&wa=${cleanWa}` : ''}`;
    navigator.clipboard.writeText(url);
    showToast('Enlace de tu catálogo copiado para compartir con clientes', 'success');
  };

  // 1. Customer Catalog View (Public)
  if (viewMode === 'catalog') {
    return (
      <div className="relative">
        {/* Top Admin Switch Bar if owner is authenticated */}
        {isAuthenticated && (
          <aside className="bg-ink text-white px-4 py-2 text-xs flex items-center justify-between border-b border-neutral-800 sticky top-0 z-50">
            <span className="font-sans text-[11px] uppercase tracking-wider text-[#B89B72] font-semibold">
              ✦ Modo Vista Previa · Catálogo de Clientes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCatalogLink}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-sans transition-colors"
              >
                Copiar Enlace
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = 'admin';
                  setViewMode('admin');
                }}
                className="px-3 py-1 bg-white text-ink hover:bg-neutral-100 rounded text-[11px] font-sans font-medium transition-colors"
              >
                Volver al Panel
              </button>
            </div>
          </aside>
        )}

        <CustomerCatalog
          currentUserId={user?.id}
          onAdminAccess={() => {
            window.location.hash = 'admin';
            setViewMode('admin');
          }}
        />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // 2. Admin Login Guard: If not authenticated and admin mode requested
  if (!isAuthenticated) {
    return (
      <LoginView
        onBackToCatalog={() => {
          window.location.hash = 'catalogo';
          setViewMode('catalog');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex text-ink">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onNewProduct={handleNewProduct}
        onExportCSV={handleExportCSV}
        onOpenCatalog={handleOpenCatalog}
        onOpenStoreSettings={() => setIsStoreSettingsOpen(true)}
        itemCount={products.length}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 md:pb-8">
        {/* Mobile Header */}
        <Header
          onExportCSV={handleExportCSV}
          onRefresh={() => fetchProducts(true)}
          isRefreshing={isRefreshing}
          onOpenCatalog={handleOpenCatalog}
          onOpenStoreSettings={() => setIsStoreSettingsOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* VIEW 1: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-light text-ink tracking-tight">
                    Resumen Ejecutivo
                  </h1>
                  <p className="font-sans text-xs text-neutral-400 uppercase tracking-widest mt-1">
                    Métricas del inventario en tiempo real
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProducts(true)}
                    disabled={isRefreshing}
                    className="btn-secondary !py-2 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                  <button onClick={handleNewProduct} className="btn-primary !py-2 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nueva Prenda</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <MetricCards products={products} />

              {/* Low stock alert callout */}
              {lowStockCount > 0 && (
                <div className="p-4 bg-[#FAF6EE] border border-[#EFE7D8] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink font-normal">
                      Hay {lowStockCount} prendas que requieren reposición inmediata.
                    </p>
                    <p className="font-sans text-xs text-neutral-600 mt-0.5">
                      Revisa las tallas con menos de 3 unidades o agotadas.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStatus('bajo');
                      setCurrentView('inventory');
                    }}
                    className="btn-primary !py-2 !px-4 text-xs whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>Ver alertas de stock</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: INVENTORY CATALOG */}
          {currentView === 'inventory' && (
            <div className="space-y-5 animate-fade-in">
              {/* Top View Title */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border pb-4">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-light text-ink tracking-tight">
                    Catálogo de Prendas
                  </h1>
                  <p className="font-sans text-xs text-neutral-400 uppercase tracking-widest mt-1">
                    Control de stock por variante de talla y color
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchProducts(true)}
                    disabled={isRefreshing}
                    className="btn-secondary !py-2 text-xs hidden sm:flex"
                    title="Actualizar catálogo"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>

                  <button onClick={handleNewProduct} className="btn-primary !py-2 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Prenda</span>
                  </button>
                </div>
              </div>

              {/* Filters Toolbar */}
              <div className="space-y-3 bg-white p-3.5 border border-border rounded no-print">
                {/* Search Bar + Fast Selectors */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Buscar por prenda o categoría..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-minimal pl-10 text-xs"
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

                  {/* Status Filter */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="input-minimal sm:w-44 text-xs bg-white"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="disponible">En Stock</option>
                    <option value="bajo">Stock Bajo (&lt;3)</option>
                    <option value="agotado">Agotados</option>
                  </select>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-ink text-white font-medium'
                        : 'bg-alabaster text-neutral-600 hover:bg-neutral-200/70'
                    }`}
                  >
                    Todas ({products.length})
                  </button>
                  {CATEGORIES.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    if (count === 0 && selectedCategory !== cat) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-ink text-white font-medium'
                            : 'bg-alabaster text-neutral-600 hover:bg-neutral-200/70'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products View */}
              {loadingProducts ? (
                <div className="card-surface py-20 text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-ink" />
                  <p className="font-serif text-lg text-ink font-light">
                    Cargando inventario...
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <ProductTable
                      products={filteredProducts}
                      onAdjustStock={handleAdjustStock}
                      onEdit={handleEditProduct}
                      onDelete={(p) => setProductToDelete(p)}
                      updatingVariantId={updatingVariantId}
                      onPreviewImage={setPreviewImage}
                    />
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="card-surface p-8 text-center text-xs text-neutral-400 font-sans">
                        No se encontraron prendas con los filtros aplicados.
                      </div>
                    ) : (
                      filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onAdjustStock={handleAdjustStock}
                          onEdit={handleEditProduct}
                          onDelete={(prod) => setProductToDelete(prod)}
                          updatingVariantId={updatingVariantId}
                          onPreviewImage={setPreviewImage}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 3: MOVEMENTS / AUDIT LOG */}
          {currentView === 'movements' && (
            <div className="animate-fade-in">
              <MovementsList showToast={showToast} />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onNewProduct={handleNewProduct}
      />

      {/* Product Create / Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaved={() => fetchProducts(true)}
        showToast={showToast}
      />

      {/* Product Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onDeleted={() => fetchProducts(true)}
        showToast={showToast}
      />

      {/* Image Preview Lightbox Modal */}
      <ImagePreviewModal
        preview={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Store & WhatsApp Settings Modal */}
      <StoreSettingsModal
        isOpen={isStoreSettingsOpen}
        onClose={() => setIsStoreSettingsOpen(false)}
        showToast={showToast}
      />

      {/* Feedback Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

