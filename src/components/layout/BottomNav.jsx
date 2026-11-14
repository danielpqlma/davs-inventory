import React from 'react';
import { LayoutDashboard, Package, History, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function BottomNav({ currentView, onNavigate, onNewProduct }) {
  const { signOut } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 select-none pb-safe no-print">
      <div className="relative flex items-center justify-around h-16 px-2">
        {/* Resumen */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'dashboard' ? 'text-ink font-medium' : 'text-neutral-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-wide">Resumen</span>
        </button>

        {/* Inventario */}
        <button
          onClick={() => onNavigate('inventory')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'inventory' ? 'text-ink font-medium' : 'text-neutral-400'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-wide">Prendas</span>
        </button>

        {/* Center Floating + Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onNewProduct}
            aria-label="Añadir nueva prenda"
            className="w-13 h-13 w-12 h-12 rounded-full bg-ink text-white flex items-center justify-center shadow-lg border-2 border-white active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Movimientos */}
        <button
          onClick={() => onNavigate('movements')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentView === 'movements' ? 'text-ink font-medium' : 'text-neutral-400'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-wide">Historial</span>
        </button>

        {/* Salir */}
        <button
          onClick={signOut}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-400 hover:text-crimson transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-wide">Salir</span>
        </button>
      </div>
    </nav>
  );
}

