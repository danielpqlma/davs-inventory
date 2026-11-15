import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { ArrowRight, Lock, Mail, AlertCircle, Settings, ShieldCheck } from 'lucide-react';

export function LoginView() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegistering) {
        await signUp(email, password);
        setSuccessMsg(
          'Cuenta creada con éxito. Si tu proyecto requiere confirmación por correo, revisa tu bandeja de entrada.'
        );
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      let msg = err.message || 'Error al autenticar';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este correo electrónico ya está registrado.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-6 md:p-12 selection:bg-ink selection:text-white">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-ink">
            Dav's
          </span>
        </div>
      </header>

      {/* Centered Editorial Form */}
      <main className="w-full max-w-sm mx-auto my-auto py-12">
        <div className="text-center mb-8">
          {/* Logo Monogram */}
          <div className="w-14 h-14 mx-auto mb-5 border border-ink flex items-center justify-center rounded-full">
            <span className="font-serif text-2xl font-normal italic text-ink">
              D
            </span>
          </div>

          <h1 className="font-serif text-3xl font-light text-ink tracking-tight mb-2">
            Gestión Interna
          </h1>
          <p className="font-sans text-xs text-neutral-500 tracking-wide uppercase">
            Control de Inventario y Movimientos
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-crimson flex-shrink-0 mt-0.5" />
            <p className="font-sans text-xs text-crimson leading-tight">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded flex items-start gap-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <p className="font-sans text-xs text-emerald-800 leading-tight">
              {successMsg}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="personal@davs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-minimal pl-10 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-minimal pl-10 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full !py-3 mt-2"
          >
            {loading ? (
              <span className="inline-block animate-pulse">Accediendo...</span>
            ) : (
              <>
                <span>{isRegistering ? 'Crear Cuenta' : 'Acceder al Sistema'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccessMsg(null);
            }}
            className="font-sans text-xs text-neutral-500 hover:text-ink transition-colors"
          >
            {isRegistering ? (
              <span>
                ¿Ya tienes una cuenta de acceso?{' '}
                <strong className="text-ink underline">Inicia Sesión</strong>
              </span>
            ) : (
              <span>
                ¿Nuevo colaborador en el equipo?{' '}
                <strong className="text-ink underline">Crear Acceso</strong>
              </span>
            )}
          </button>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center font-sans text-[11px] text-neutral-400">
        <p>Dav's © {new Date().getFullYear()} — Uso exclusivo del personal autorizado.</p>
      </footer>
    </div>
  );
}

