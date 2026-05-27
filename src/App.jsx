import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import TemplatesPage from './pages/TemplatesPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'
import { Loader2 } from 'lucide-react'

function PrivateRoute({ children }) {
  const { session, loading, configured } = useAuth()
  if (!configured) {
    return <ConfigError />
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="spin text-accent2" size={32} />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-3">
          Supabase não configurado
        </h1>
        <p className="font-mono text-sm text-muted leading-relaxed">
          Esta instância da plataforma não foi configurada com credenciais Supabase.
          Defina <code className="text-accent2">VITE_SUPABASE_URL</code> e{' '}
          <code className="text-accent2">VITE_SUPABASE_ANON_KEY</code> no arquivo{' '}
          <code className="text-accent2">.env</code> antes do build, ou em{' '}
          <code className="text-accent2">env.js</code> em runtime no Docker.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/templates" replace />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
