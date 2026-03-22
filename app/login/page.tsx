'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Giriş başarısız.' }));
        setError(data.message || 'Giriş başarısız.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">NeuroPharm Giriş</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Sisteme erişmek için parolayı girin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm text-[var(--text-muted)] block mb-2">
              Parola
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Parolayı girin"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password}
            className="w-full rounded-xl bg-blue-600 text-white py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Kontrol ediliyor...' : 'Giriş Yap'}
          </button>
        </form>
      </section>
    </main>
  );
}
