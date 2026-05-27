import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Moon, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { session, signIn, signUp, configured } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const navigate = useNavigate()

  if (session) return <Navigate to="/" replace />

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card p-8 max-w-md">
          <h1 className="font-display text-xl font-bold mb-2">
            Supabase não configurado
          </h1>
          <p className="font-mono text-sm text-muted">
            Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de
            iniciar a aplicação.
          </p>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        navigate('/templates')
      } else {
        const { user } = await signUp(email, password)
        if (user && !user.confirmed_at) {
          setInfo('Cadastro criado. Verifique o email para confirmar a conta.')
        } else {
          navigate('/templates')
        }
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Moon size={28} className="text-accent2" />
            <h1 className="font-display text-3xl font-extrabold">Luna</h1>
          </div>
          <p className="font-mono text-[0.7rem] tracking-widest text-muted uppercase">
            Templates WABA · HPrime Películas
          </p>
        </div>

        <div className="card p-7 md:p-8">
          <div className="flex gap-1 mb-6 p-1 bg-bg rounded-lg border border-border">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-xs rounded-md ${
                mode === 'signin' ? 'bg-surface2 text-text' : 'text-muted hover:text-text'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-xs rounded-md ${
                mode === 'signup' ? 'bg-surface2 text-text' : 'text-muted hover:text-text'
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@hprime.com.br"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-3">
                {error}
              </div>
            )}
            {info && (
              <div className="text-xs font-mono text-green bg-green/5 border border-green/20 rounded-md p-3">
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent2 text-white rounded-md font-medium text-sm flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="spin" />}
              {mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-mono text-[0.65rem] text-muted">
          HPrime Películas · Luna v1.0 · 2025
        </p>
      </div>
    </div>
  )
}
