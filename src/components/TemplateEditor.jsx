import { useState, useEffect, useMemo } from 'react'
import {
  createTemplate,
  editTemplate,
  countPlaceholders,
  renderBodyExample,
  META_CATEGORIES,
  META_LANGUAGES
} from '../lib/meta'
import { X, Loader2, AlertCircle, Save, Smartphone } from 'lucide-react'

const emptyForm = {
  name: '',
  category: 'UTILITY',
  language: 'pt_BR',
  header: '',
  body: '',
  footer: '',
  body_examples: [], // array of example strings, one per placeholder
  buttons: [] // [{type, text, url?, phone_number?}]
}

function templateToForm(t) {
  const header = t.components?.find((c) => c.type === 'HEADER')
  const body = t.components?.find((c) => c.type === 'BODY')
  const footer = t.components?.find((c) => c.type === 'FOOTER')
  const buttons = t.components?.find((c) => c.type === 'BUTTONS')
  const headerText = header?.format === 'TEXT' ? header.text || '' : ''
  return {
    name: t.name || '',
    category: t.category || 'UTILITY',
    language: t.language || 'pt_BR',
    header: headerText,
    body: body?.text || '',
    footer: footer?.text || '',
    body_examples: body?.example?.body_text?.[0] || [],
    buttons:
      buttons?.buttons?.map((b) => ({
        type: b.type,
        text: b.text || '',
        url: b.url || '',
        phone_number: b.phone_number || ''
      })) || []
  }
}

function buildComponents(form) {
  const components = []
  if (form.header.trim()) {
    components.push({
      type: 'HEADER',
      format: 'TEXT',
      text: form.header.trim()
    })
  }
  const bodyComp = { type: 'BODY', text: form.body.trim() }
  const placeholderCount = countPlaceholders(form.body)
  if (placeholderCount > 0) {
    bodyComp.example = {
      body_text: [
        form.body_examples
          .slice(0, placeholderCount)
          .map((v) => (v || '').trim() || 'exemplo')
      ]
    }
  }
  components.push(bodyComp)
  if (form.footer.trim()) {
    components.push({ type: 'FOOTER', text: form.footer.trim() })
  }
  if (form.buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: form.buttons.map((b) => {
        const btn = { type: b.type, text: b.text.trim() }
        if (b.type === 'URL') btn.url = b.url.trim()
        if (b.type === 'PHONE_NUMBER') btn.phone_number = b.phone_number.trim()
        return btn
      })
    })
  }
  return components
}

export default function TemplateEditor({ mode, template, credentials, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'edit' && template) {
      setForm(templateToForm(template))
    } else {
      setForm(emptyForm)
    }
  }, [mode, template])

  const placeholderCount = useMemo(() => countPlaceholders(form.body), [form.body])

  // Keep examples array in sync with placeholders
  useEffect(() => {
    setForm((prev) => {
      const next = [...prev.body_examples]
      while (next.length < placeholderCount) next.push('')
      next.length = placeholderCount
      return { ...prev, body_examples: next }
    })
  }, [placeholderCount])

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const addButton = (type) => {
    if (form.buttons.length >= 3) return
    update({
      buttons: [
        ...form.buttons,
        { type, text: '', url: '', phone_number: '' }
      ]
    })
  }

  const updateButton = (idx, patch) => {
    const next = [...form.buttons]
    next[idx] = { ...next[idx], ...patch }
    update({ buttons: next })
  }

  const removeButton = (idx) => {
    update({ buttons: form.buttons.filter((_, i) => i !== idx) })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const components = buildComponents(form)
      if (mode === 'create') {
        const payload = {
          name: form.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          category: form.category,
          language: form.language,
          components
        }
        await createTemplate({
          wabaId: credentials.waba_id,
          accessToken: credentials.access_token,
          payload
        })
      } else {
        // Edit: name and language cannot be changed. Components and category can.
        const payload = {
          category: form.category,
          components
        }
        await editTemplate({
          templateId: template.id,
          accessToken: credentials.access_token,
          payload
        })
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Falha ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const previewBody = renderBodyExample(form.body, form.body_examples)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-stretch md:items-center md:justify-center md:p-4 overflow-y-auto">
      <div className="bg-bg md:card w-full md:max-w-5xl max-h-screen md:max-h-[92vh] flex flex-col fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-border sticky top-0 bg-bg z-10">
          <div>
            <p className="font-mono text-[0.6rem] tracking-widest uppercase text-muted">
              {mode === 'create' ? 'Novo template' : 'Editar template'}
            </p>
            <h2 className="font-display text-lg font-bold mt-0.5">
              {mode === 'create' ? 'Criar template WABA' : template.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text p-2"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — split */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-[1fr_320px] gap-0">
            {/* Form */}
            <form
              id="template-form"
              onSubmit={submit}
              className="p-5 md:p-7 space-y-5 border-b md:border-b-0 md:border-r border-border"
            >
              {mode === 'edit' && (
                <div className="text-[0.7rem] font-mono text-amber bg-amber/5 border border-amber/20 rounded p-2.5">
                  Em templates existentes só é possível editar categoria e componentes.
                  Nome e idioma são imutáveis na Meta.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label>Nome</label>
                  <input
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="luna_boas_vindas"
                    pattern="[a-z0-9_]+"
                    required
                    disabled={mode === 'edit'}
                  />
                  <p className="font-mono text-[0.6rem] text-muted mt-1">
                    Só letras minúsculas, números e _
                  </p>
                </div>
                <div>
                  <label>Idioma</label>
                  <select
                    value={form.language}
                    onChange={(e) => update({ language: e.target.value })}
                    disabled={mode === 'edit'}
                  >
                    {META_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label>Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {META_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => update({ category: cat })}
                      className={`py-2 rounded-md text-[0.7rem] border transition-colors ${
                        form.category === cat
                          ? 'border-accent2 bg-accent/10 text-accent2'
                          : 'border-border2 text-muted hover:border-accent/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Cabeçalho (opcional)</label>
                <input
                  value={form.header}
                  onChange={(e) => update({ header: e.target.value })}
                  placeholder="Olá!"
                  maxLength={60}
                />
                <p className="font-mono text-[0.6rem] text-muted mt-1">
                  Texto curto · máx 60 caracteres
                </p>
              </div>

              <div>
                <label>Corpo *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => update({ body: e.target.value })}
                  placeholder="Olá {{1}}, recebemos seu cadastro na HPrime."
                  required
                  maxLength={1024}
                  rows={5}
                />
                <p className="font-mono text-[0.6rem] text-muted mt-1">
                  Use {'{{1}}'}, {'{{2}}'}... para variáveis · {form.body.length}/1024
                </p>
              </div>

              {placeholderCount > 0 && (
                <div>
                  <label>
                    Exemplos das variáveis ({placeholderCount}{' '}
                    {placeholderCount === 1 ? 'variável' : 'variáveis'})
                  </label>
                  <div className="space-y-2">
                    {Array.from({ length: placeholderCount }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-mono text-[0.7rem] text-accent2 w-12">
                          {`{{${i + 1}}}`}
                        </span>
                        <input
                          value={form.body_examples[i] || ''}
                          onChange={(e) => {
                            const next = [...form.body_examples]
                            next[i] = e.target.value
                            update({ body_examples: next })
                          }}
                          placeholder={`Exemplo da variável ${i + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label>Rodapé (opcional)</label>
                <input
                  value={form.footer}
                  onChange={(e) => update({ footer: e.target.value })}
                  placeholder="HPrime Películas"
                  maxLength={60}
                />
              </div>

              {/* Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="mb-0">Botões (opcional)</label>
                  <span className="font-mono text-[0.6rem] text-muted">
                    {form.buttons.length}/3
                  </span>
                </div>
                {form.buttons.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {form.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="border border-border2 rounded-md p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[0.65rem] text-accent2">
                            {b.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeButton(i)}
                            className="text-muted hover:text-red"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <input
                          value={b.text}
                          onChange={(e) => updateButton(i, { text: e.target.value })}
                          placeholder="Texto do botão"
                          maxLength={25}
                          required
                        />
                        {b.type === 'URL' && (
                          <input
                            value={b.url}
                            onChange={(e) => updateButton(i, { url: e.target.value })}
                            placeholder="https://..."
                            type="url"
                            required
                          />
                        )}
                        {b.type === 'PHONE_NUMBER' && (
                          <input
                            value={b.phone_number}
                            onChange={(e) =>
                              updateButton(i, { phone_number: e.target.value })
                            }
                            placeholder="+554788548004"
                            required
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {form.buttons.length < 3 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => addButton('QUICK_REPLY')}
                      className="text-[0.7rem] px-3 py-1.5 border border-border2 text-muted hover:text-text rounded-md"
                    >
                      + Resposta rápida
                    </button>
                    <button
                      type="button"
                      onClick={() => addButton('URL')}
                      className="text-[0.7rem] px-3 py-1.5 border border-border2 text-muted hover:text-text rounded-md"
                    >
                      + Link (URL)
                    </button>
                    <button
                      type="button"
                      onClick={() => addButton('PHONE_NUMBER')}
                      className="text-[0.7rem] px-3 py-1.5 border border-border2 text-muted hover:text-text rounded-md"
                    >
                      + Telefone
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Preview */}
            <div className="p-5 md:p-7 bg-surface/30">
              <div className="flex items-center gap-2 mb-3 sticky top-0">
                <Smartphone size={14} className="text-accent2" />
                <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted">
                  Preview WhatsApp
                </span>
              </div>
              <div className="bg-[#0b141a] rounded-xl p-3">
                <div
                  className="bg-[#1f2c33] rounded-lg p-3 shadow-md"
                  style={{ maxWidth: '300px' }}
                >
                  {form.header && (
                    <p className="font-serif text-sm font-bold text-white mb-1.5">
                      {form.header}
                    </p>
                  )}
                  <p
                    className="font-serif text-[0.85rem] text-[#e9edef] whitespace-pre-wrap leading-relaxed"
                    style={{ wordBreak: 'break-word' }}
                  >
                    {previewBody || (
                      <span className="text-muted italic text-xs">
                        Digite o corpo da mensagem para ver o preview…
                      </span>
                    )}
                  </p>
                  {form.footer && (
                    <p className="font-serif text-[0.7rem] text-muted mt-2 italic">
                      {form.footer}
                    </p>
                  )}
                  <p className="font-mono text-[0.6rem] text-muted text-right mt-1.5">
                    12:34
                  </p>
                </div>
                {form.buttons.length > 0 && (
                  <div className="space-y-1 mt-1.5" style={{ maxWidth: '300px' }}>
                    {form.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="bg-[#1f2c33] text-[#00a884] text-xs text-center py-2 rounded-md font-medium"
                      >
                        {b.text || 'Botão'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[0.65rem] font-mono text-muted mt-3 leading-relaxed">
                Após criar, a Meta revisa o template antes de aprovar. Templates de
                marketing custam mais que utilidade ou autenticação.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 md:px-7 py-4 border-t border-border bg-bg sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border2 text-muted hover:text-text rounded-md text-xs"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="template-form"
            disabled={saving}
            className="px-5 py-2 bg-accent hover:bg-accent2 text-white rounded-md text-xs flex items-center gap-2"
          >
            {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
            {mode === 'create' ? 'Enviar para aprovação' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
