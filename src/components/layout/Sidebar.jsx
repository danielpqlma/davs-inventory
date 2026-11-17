import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../auth/SupabaseConfigModal';
import {
  LayoutDashboard,
  Package,
  History,
  Plus,
  Download,
  LogOut,
  Database,
  Printer,
  ShoppingBag
} from 'lucide-react';

export function Sidebar({
  currentView,
  onNavigate,
  onNewProduct,
  onExportCSV,
  onOpenCatalog,
  itemCount = 0,
  lowStockCount = 0,
}) {
  const { user, signOut } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Resumen',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alertas` : null,
      badgeType: lowStockCount > 0 ? 'warning' : null,
    },
    {
      id: 'movements',
      label: 'Movimientos',
      icon: History,
      badge: null,
    },
  ];

  const configured = isSupabaseConfigured();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 flex-shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-7 border-b border-border">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-light tracking-tight text-ink">
            Dav's
          </span>
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#B89B72] font-semibold">
            Tienda
          </span>
        </div>
        <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
          Control de Inventario
        </p>

        {/* Status Indicator */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-sans text-[11px] text-neutral-500">
            En línea
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-sans tracking-wide transition-colors rounded ${
                isActive
                  ? 'bg-alabaster text-ink font-medium border border-border'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-ink' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                    item.badgeType === 'warning'
                      ? 'bg-[#FAF6EE] text-[#B89B72] border border-[#EFE7D8]'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Buttons */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <button
          onClick={onNewProduct}
          className="btn-primary w-full !py-2.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Prenda</span>
        </button>

        <button
          onClick={onOpenCatalog}
          className="btn-secondary w-full !py-2 !px-3 text-xs flex items-center justify-center gap-2 border-[#EFE7D8] bg-[#FAF6EE] text-[#B89B72] hover:bg-[#F5EEDC] transition-colors"
          title="Ver o compartir el catálogo de clientes"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#B89B72]" />
          <span>Catálogo de Clientes</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportCSV}
            className="btn-secondary w-full !py-2 !px-2 text-[10px]"
            title="Exportar inventario actual a CSV"
          >
            <Download className="w-3 h-3 text-neutral-500" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-secondary w-full !py-2 !px-2 text-[10px]"
            title="Imprimir listado para inventario físico"
          >
            <Printer className="w-3 h-3 text-neutral-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* User Session & Logout Footer */}
      <div className="p-4 border-t border-border bg-alabaster/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="font-sans text-[10px] uppercase tracking-wider text-neutral-400">
              Operador
            </p>
            <p className="font-sans text-xs font-medium text-ink truncate" title={user?.email}>
              {user?.email || 'Sesión Activa'}
            </p>
          </div>
          <button
            onClick={signOut}
            title="Cerrar Sesión de forma segura"
            className="p-1.5 text-neutral-400 hover:text-crimson hover:bg-red-50 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

