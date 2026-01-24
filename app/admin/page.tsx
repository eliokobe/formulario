"use client";

import { useEffect, useMemo, useState } from 'react';

type Bloqueo = {
  id: string;
  inicio: string;
  fin: string;
  motivo?: string;
};

const STORAGE_KEY = 'adminPassword';

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [error, setError] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPassword(saved);
      setIsAuthed(true);
    }
  }, []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-admin-password': password,
  }), [password]);

  const loadBloqueos = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bloqueos', { headers });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data?.error === 'string' ? data.error : 'No autorizado');
      }
      const data = await response.json();
      setBloqueos(Array.isArray(data?.bloqueos) ? data.bloqueos : []);
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Error al cargar bloqueos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    sessionStorage.setItem(STORAGE_KEY, password.trim());
    setIsAuthed(true);
    await loadBloqueos();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inicio || !fin) {
      setError('Debes indicar inicio y fin');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bloqueos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ inicio, fin, motivo }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data?.error === 'string' ? data.error : 'No autorizado');
      }
      setInicio('');
      setFin('');
      setMotivo('');
      await loadBloqueos();
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Error al crear bloqueo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/bloqueos?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data?.error === 'string' ? data.error : 'No autorizado');
      }
      setBloqueos(prev => prev.filter(b => b.id !== id));
    } catch (err: any) {
      setError(typeof err?.message === 'string' ? err.message : 'Error al eliminar bloqueo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed && password) {
      loadBloqueos();
    }
  }, [isAuthed, password]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Acceso Admin</h1>
          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="Introduce la contraseña"
          />
          <button
            type="submit"
            className="mt-4 w-full bg-[#008606] hover:bg-[#008606]/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Bloqueo de Franjas</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem(STORAGE_KEY);
              setIsAuthed(false);
              setPassword('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cerrar sesión
          </button>
        </div>

        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="inicio">
                Inicio
              </label>
              <input
                id="inicio"
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="fin">
                Fin
              </label>
              <input
                id="fin"
                type="datetime-local"
                value={fin}
                onChange={(e) => setFin(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="motivo">
                Motivo (opcional)
              </label>
              <input
                id="motivo"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                placeholder="Mantenimiento, festivo..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#008606] hover:bg-[#008606]/90 disabled:bg-[#008606]/50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Guardando...' : 'Bloquear franja'}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bloqueos existentes</h2>
          {isLoading && bloqueos.length === 0 ? (
            <p className="text-gray-500">Cargando...</p>
          ) : bloqueos.length === 0 ? (
            <p className="text-gray-500">No hay bloqueos registrados.</p>
          ) : (
            <div className="space-y-3">
              {bloqueos.map(bloqueo => (
                <div key={bloqueo.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="text-sm text-gray-900">
                      {formatDateTime(bloqueo.inicio)} → {formatDateTime(bloqueo.fin)}
                    </div>
                    {bloqueo.motivo && (
                      <div className="text-xs text-gray-500 mt-1">{bloqueo.motivo}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(bloqueo.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
