import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Sparkles, ShieldCheck, ArrowRight, Gem, ArrowLeft } from 'lucide-react';
import { loginApi } from '../services/api';

export default function LoginView({ onLoginSuccess, onBackToStore }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await loginApi(username.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      console.error('Error login:', err);
      setError(err.message || 'Credenciales incorrectas. Verifique usuario o contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Luces sutiles de fondo (Luxury Ambient Glow) */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none" />

      {/* Botón Volver a la Tienda Pública */}
      {onBackToStore && (
        <button
          onClick={onBackToStore}
          className="absolute top-6 left-6 z-20 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la Tienda</span>
        </button>
      )}

      {/* Contenedor Principal de la Tarjeta */}
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10 space-y-6">
        
        {/* Marca & Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black border border-zinc-800 shadow-md mb-1">
            <Gem className="w-7 h-7 stroke-[2]" />
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black tracking-widest uppercase font-serif text-white">
            GUTSY
          </h1>
          <p className="text-[11px] text-zinc-400 tracking-widest uppercase font-medium">
            Panel de Gestión & Administración
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in-50">
            <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Inicio de Sesión */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Usuario */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Usuario
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. admin"
                className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium text-white placeholder-zinc-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-zinc-500 hover:text-zinc-300 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón de Ingreso */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white hover:bg-zinc-200 text-black font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition disabled:opacity-50 mt-2 uppercase tracking-wider"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Acceder al Panel</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Seguro */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Acceso Seguro Encriptado</span>
          </div>

          {onBackToStore && (
            <button
              onClick={onBackToStore}
              className="text-zinc-400 hover:text-white underline transition"
            >
              Ver Tienda
            </button>
          )}
        </div>
      </div>

      {/* Marca de agua / Versión */}
      <div className="mt-8 text-center text-xs text-zinc-600 space-y-0.5">
        <p>© {new Date().getFullYear()} GUTSY — Tu propio estilo, tu propia esencia</p>
      </div>
    </div>
  );
}
