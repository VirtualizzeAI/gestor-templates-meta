import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  listTemplates,
  deleteTemplate,
  STATUS_COLOR
} from '../lib/meta'
import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Pencil,
  Search,
  Settings as SettingsIcon
} from 'lucide-react'
import TemplateEditor from '../components/TemplateEditor'
import TemplatePreview from '../components/TemplatePreview'

export default function TemplatesPage() {
  const { user } = useAuth()
  const [credentials, setCredentials] = useState(null)
  const [credsLoaded, setCredsLoaded] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [editor, setEditor] = useState(null) // null | { mode: 'create' } | { mode: 'edit', template }
  const [previewing, setPreviewing] = useState(null) // template
  const [confirmDelete, setConfirmDelete] = useState(null) // template

  // Load credentials
  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await supabase
        .from('meta_credentials')
        .select('waba_id, access_token')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!mounted) return
      setCredentials(data || null)
      setCredsLoaded(true)
    }
    load()
    return () => {
      mounted = false
    }
  }, [user.id])

  const fetchTemplates = useCallback(async () => {
    if (!credentials?.waba_id || !credentials?.access_token) return
    setLoading(true)
    setError('')
    try {
      const result = await listTemplates({
        wabaId: credentials.waba_id,
        accessToken: credentials.access_token,
        limit: 100
      })
      setTemplates(result?.data || [])
    } catch (err) {
      setError(err.message || 'Falha ao carregar templates')
    } finally {
      setLoading(false)
    }
  }, [credentials])

  useEffect(() => {
    if (credsLoaded && credentials) fetchTemplates()
  }, [credsLoaded, credentials, fetchTemplates])

  const doDelete = async (template) => {
    setConfirmDelete(null)
    setLoading(true)
    setError('')
    try {
      await deleteTemplate({
        wabaId: credentials.waba_id,
        accessToken: credentials.access_token,
        name: template.name,
        hsm_id: template.id
      })
      await fetchTemplates()
    } catch (err) {
      setError(err.message || 'Falha ao excluir template')
      setLoading(false)
    }
  }

  // Not configured yet
  if (credsLoaded && !credentials) {
    return (
      <div className="fade-in">
        <div className="mb-8">
          <p className="font-mono text-[0.62rem] tracking-widest uppercase text-muted mb-2">
            Templates WABA
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Templates</h1>
        </div>
        <div className="card p-8 text-center max-w-lg">
          <SettingsIcon size={28} className="text-accent2 mx-auto mb-4" />
          <h2 className="font-display text-lg font-bold mb-2">
            Conecte sua conta Meta primeiro
          </h2>
          <p className="text-muted text-sm font-mono mb-6">
            Para gerenciar templates você precisa configurar o WABA ID e o token de
            acesso.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent2 text-white rounded-md text-sm"
          >
            <SettingsIcon size={14} />
            Configurar agora
          </Link>
        </div>
      </div>
    )
  }

  // Filtered list
  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(t.components || []).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'ALL' || t.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
        <div>
          <p className="font-mono text-[0.62rem] tracking-widest uppercase text-muted mb-2">
            Gestão · Templates WABA
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted text-sm font-mono mt-2">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'} ·
            WABA {credentials?.waba_id?.slice(-6)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="px-4 py-2 border border-border2 text-muted hover:text-text hover:border-accent2 rounded-md text-xs flex items-center gap-2"
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setEditor({ mode: 'create' })}
            className="px-4 py-2 bg-accent hover:bg-accent2 text-white rounded-md text-xs flex items-center gap-2"
          >
            <Plus size={14} />
            Novo template
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nome ou conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="ALL">Todos status</option>
          <option value="APPROVED">Aprovados</option>
          <option value="PENDING">Pendentes</option>
          <option value="REJECTED">Rejeitados</option>
          <option value="PAUSED">Pausados</option>
          <option value="DISABLED">Desativados</option>
        </select>
      </div>

      {error && (
        <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-3 mb-5 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && templates.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="spin text-accent2" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-mono text-sm text-muted mb-1">
            {templates.length === 0
              ? 'Nenhum template encontrado nesta WABA'
              : 'Nenhum template corresponde ao filtro'}
          </p>
          {templates.length === 0 && (
            <button
              onClick={() => setEditor({ mode: 'create' })}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent2 text-white rounded-md text-xs"
            >
              <Plus size={12} />
              Criar primeiro template
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <TemplateRow
              key={t.id}
              template={t}
              onPreview={() => setPreviewing(t)}
              onEdit={() => setEditor({ mode: 'edit', template: t })}
              onDelete={() => setConfirmDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editor && (
        <TemplateEditor
          mode={editor.mode}
          template={editor.template}
          credentials={credentials}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null)
            fetchTemplates()
          }}
        />
      )}

      {/* Preview modal */}
      {previewing && (
        <TemplatePreview
          template={previewing}
          onClose={() => setPreviewing(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <DeleteConfirm
          template={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => doDelete(confirmDelete)}
        />
      )}
    </div>
  )
}

function TemplateRow({ template, onPreview, onEdit, onDelete }) {
  const color = STATUS_COLOR[template.status] || 'muted'
  const colorClasses = {
    green: 'text-green bg-green/10 border-green/25',
    amber: 'text-amber bg-amber/10 border-amber/25',
    red: 'text-red bg-red/10 border-red/25',
    orange: 'text-orange bg-orange/10 border-orange/25',
    muted: 'text-muted bg-white/[0.03] border-border2'
  }
  const body = template.components?.find((c) => c.type === 'BODY')?.text || ''
  const preview = body.length > 110 ? body.slice(0, 110) + '…' : body

  return (
    <div className="card p-4 md:p-5 hover:border-accent/30 transition-colors group">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onPreview}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-display text-sm font-bold truncate">{template.name}</h3>
            <span
              className={`text-[0.6rem] font-mono px-2 py-0.5 rounded border ${colorClasses[color]}`}
            >
              {template.status}
            </span>
            <span className="text-[0.6rem] font-mono px-2 py-0.5 rounded border border-border2 text-muted">
              {template.category}
            </span>
            <span className="text-[0.6rem] font-mono text-muted">
              {template.language}
            </span>
          </div>
          {preview && (
            <p className="text-xs text-muted font-serif leading-relaxed line-clamp-2">
              {preview}
            </p>
          )}
          {template.rejected_reason && template.rejected_reason !== 'NONE' && (
            <p className="text-[0.65rem] font-mono text-red/80 mt-1.5">
              Motivo da rejeição: {template.rejected_reason}
            </p>
          )}
        </div>
        <div className="flex gap-2 sm:opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 border border-border2 text-muted hover:text-accent2 hover:border-accent2 rounded-md"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 border border-border2 text-muted hover:text-red hover:border-red/50 rounded-md"
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteConfirm({ template, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="card p-6 max-w-md w-full fade-in">
        <h2 className="font-display text-lg font-bold mb-3 text-red">
          Excluir template?
        </h2>
        <p className="text-sm text-muted font-mono mb-2">
          O template <strong className="text-text">{template.name}</strong> (
          {template.language}) será removido permanentemente da WABA.
        </p>
        <p className="text-[0.7rem] font-mono text-amber bg-amber/5 border border-amber/20 rounded p-2.5 mb-5">
          Esta ação não pode ser desfeita. A Meta pode levar alguns minutos para refletir
          a exclusão.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border2 text-muted hover:text-text rounded-md text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red hover:bg-red/90 text-white rounded-md text-xs flex items-center gap-2"
          >
            <Trash2 size={12} />
            Excluir definitivamente
          </button>
        </div>
      </div>
    </div>
  )
}
