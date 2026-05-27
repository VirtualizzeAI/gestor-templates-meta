import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { pingWaba } from '../lib/meta'
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [hasExistingToken, setHasExistingToken] = useState(false)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', msg: string }

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase
        .from('meta_credentials')
        .select('waba_id, access_token, phone_number_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!mounted) return
      if (error && error.code !== 'PGRST116') {
        setStatus({ type: 'error', msg: error.message })
      } else if (data) {
        setWabaId(data.waba_id || '')
        setPhoneNumberId(data.phone_number_id || '')
        if (data.access_token) {
          setAccessToken(data.access_token)
          setHasExistingToken(true)
        }
      }
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [user.id])

  const save = async (e) => {
    e?.preventDefault()
    setSaving(true)
    setStatus(null)
    try {
      const payload = {
        user_id: user.id,
        waba_id: wabaId.trim(),
        access_token: accessToken.trim(),
        phone_number_id: phoneNumberId.trim() || null,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase
        .from('meta_credentials')
        .upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setStatus({ type: 'success', msg: 'Credenciais salvas com sucesso.' })
      setHasExistingToken(true)
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Erro ao salvar' })
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    setStatus(null)
    try {
      await pingWaba({ wabaId: wabaId.trim(), accessToken: accessToken.trim() })
      setStatus({
        type: 'success',
        msg: 'Conexão validada — token e WABA ID estão funcionando.'
      })
    } catch (err) {
      setStatus({
        type: 'error',
        msg: `Falha na conexão: ${err.message || 'erro desconhecido'}`
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="spin text-accent2" size={28} />
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="mb-8">
        <p className="font-mono text-[0.62rem] tracking-widest uppercase text-muted mb-2">
          Configuração
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Conexão Meta</h1>
        <p className="text-muted text-sm font-mono mt-2">
          Credenciais para integrar à API Oficial Meta (WhatsApp Business)
        </p>
      </div>

      <form onSubmit={save} className="card p-6 md:p-8 space-y-5">
        <div>
          <label htmlFor="waba_id">WhatsApp Business Account ID (WABA ID)</label>
          <input
            id="waba_id"
            value={wabaId}
            onChange={(e) => setWabaId(e.target.value)}
            placeholder="123456789012345"
            required
          />
          <p className="font-mono text-[0.65rem] text-muted mt-1.5">
            Encontrado em Meta Business Manager → Configurações → Contas → WhatsApp.
          </p>
        </div>

        <div>
          <label htmlFor="access_token">Permanent Access Token</label>
          <div className="relative">
            <input
              id="access_token"
              type={showToken ? 'text' : 'password'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={hasExistingToken ? '••••••••••••••••' : 'EAAB...'}
              required
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowToken((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              tabIndex={-1}
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="font-mono text-[0.65rem] text-muted mt-1.5">
            System User token permanente com escopo whatsapp_business_management.
          </p>
        </div>

        <div>
          <label htmlFor="phone_id">Phone Number ID (opcional)</label>
          <input
            id="phone_id"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="123456789012345"
          />
          <p className="font-mono text-[0.65rem] text-muted mt-1.5">
            Necessário apenas para envio direto de mensagens (esta plataforma gerencia
            templates).
          </p>
        </div>

        {status && (
          <div
            className={`text-xs font-mono flex items-start gap-2 rounded-md p-3 border ${
              status.type === 'success'
                ? 'text-green bg-green/5 border-green/20'
                : 'text-red/90 bg-red/5 border-red/20'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            )}
            <span>{status.msg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !wabaId || !accessToken}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-accent hover:bg-accent2 text-white rounded-md text-sm flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            Salvar
          </button>
          <button
            type="button"
            onClick={test}
            disabled={testing || !wabaId || !accessToken}
            className="flex-1 sm:flex-none px-5 py-2.5 border border-border2 text-muted hover:text-text hover:border-accent2 rounded-md text-sm flex items-center justify-center gap-2"
          >
            {testing && <Loader2 size={14} className="spin" />}
            Testar conexão
          </button>
        </div>
      </form>

      <div className="mt-8 card p-6 border-accent/20">
        <h3 className="font-display text-base font-bold mb-3 text-accent2">
          Como conseguir as credenciais
        </h3>
        <ol className="space-y-2.5 text-sm text-muted font-mono leading-relaxed">
          <li>
            <span className="text-accent2">1.</span> Acesse{' '}
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent2 hover:underline"
            >
              business.facebook.com
            </a>{' '}
            e abra Configurações → Usuários → Usuários do Sistema.
          </li>
          <li>
            <span className="text-accent2">2.</span> Crie um System User com permissão de
            administrador.
          </li>
          <li>
            <span className="text-accent2">3.</span> Atribua o ativo "WhatsApp Account"
            com escopos: whatsapp_business_management e whatsapp_business_messaging.
          </li>
          <li>
            <span className="text-accent2">4.</span> Gere um token{' '}
            <strong className="text-text">Never expires</strong> — cole acima.
          </li>
          <li>
            <span className="text-accent2">5.</span> Em Contas → Contas do WhatsApp, copie
            o ID da WABA (não confunda com Phone Number ID).
          </li>
        </ol>
      </div>
    </div>
  )
}
