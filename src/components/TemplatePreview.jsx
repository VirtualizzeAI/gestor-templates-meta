import { X, Smartphone, Tag } from 'lucide-react'
import { STATUS_COLOR } from '../lib/meta'

export default function TemplatePreview({ template, onClose }) {
  const header = template.components?.find((c) => c.type === 'HEADER')
  const body = template.components?.find((c) => c.type === 'BODY')
  const footer = template.components?.find((c) => c.type === 'FOOTER')
  const buttons = template.components?.find((c) => c.type === 'BUTTONS')

  const color = STATUS_COLOR[template.status] || 'muted'
  const colorClasses = {
    green: 'text-green bg-green/10 border-green/25',
    amber: 'text-amber bg-amber/10 border-amber/25',
    red: 'text-red bg-red/10 border-red/25',
    orange: 'text-orange bg-orange/10 border-orange/25',
    muted: 'text-muted bg-white/[0.03] border-border2'
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-stretch md:items-center md:justify-center md:p-4 overflow-y-auto">
      <div className="bg-bg md:card w-full md:max-w-2xl max-h-screen md:max-h-[90vh] flex flex-col fade-in">
        <div className="flex items-center justify-between px-5 md:px-7 py-4 border-b border-border">
          <div className="min-w-0">
            <p className="font-mono text-[0.6rem] tracking-widest uppercase text-muted">
              Template
            </p>
            <h2 className="font-display text-lg font-bold mt-0.5 truncate">
              {template.name}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-2">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-7 space-y-5">
          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-[0.65rem] font-mono px-2 py-1 rounded border ${colorClasses[color]}`}>
              {template.status}
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-1 rounded border border-border2 text-muted">
              {template.category}
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-1 rounded border border-border2 text-muted">
              {template.language}
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-1 rounded border border-border2 text-muted">
              ID: {template.id}
            </span>
          </div>

          {template.rejected_reason && template.rejected_reason !== 'NONE' && (
            <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-3">
              <strong>Motivo da rejeição:</strong> {template.rejected_reason}
            </div>
          )}

          {/* Components */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-accent2" />
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted">
                Componentes
              </span>
            </div>
            <div className="space-y-3">
              {header && (
                <ComponentBlock label="Header" type={header.format || 'TEXT'}>
                  <p className="font-serif text-sm">{header.text || '—'}</p>
                </ComponentBlock>
              )}
              {body && (
                <ComponentBlock label="Body">
                  <p className="font-serif text-sm whitespace-pre-wrap">{body.text}</p>
                </ComponentBlock>
              )}
              {footer && (
                <ComponentBlock label="Footer">
                  <p className="font-serif text-sm italic text-muted">{footer.text}</p>
                </ComponentBlock>
              )}
              {buttons && (
                <ComponentBlock label="Buttons">
                  <div className="space-y-1.5">
                    {buttons.buttons.map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-text">{b.text}</span>
                        <span className="text-accent2">{b.type}</span>
                      </div>
                    ))}
                  </div>
                </ComponentBlock>
              )}
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone size={14} className="text-accent2" />
              <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted">
                Visualização WhatsApp
              </span>
            </div>
            <div className="bg-[#0b141a] rounded-xl p-3">
              <div
                className="bg-[#1f2c33] rounded-lg p-3 shadow-md"
                style={{ maxWidth: '320px' }}
              >
                {header?.text && (
                  <p className="font-serif text-sm font-bold text-white mb-1.5">
                    {header.text}
                  </p>
                )}
                <p
                  className="font-serif text-[0.85rem] text-[#e9edef] whitespace-pre-wrap leading-relaxed"
                  style={{ wordBreak: 'break-word' }}
                >
                  {body?.text || ''}
                </p>
                {footer?.text && (
                  <p className="font-serif text-[0.7rem] text-muted mt-2 italic">
                    {footer.text}
                  </p>
                )}
                <p className="font-mono text-[0.6rem] text-muted text-right mt-1.5">
                  12:34
                </p>
              </div>
              {buttons?.buttons && buttons.buttons.length > 0 && (
                <div className="space-y-1 mt-1.5" style={{ maxWidth: '320px' }}>
                  {buttons.buttons.map((b, i) => (
                    <div
                      key={i}
                      className="bg-[#1f2c33] text-[#00a884] text-xs text-center py-2 rounded-md font-medium"
                    >
                      {b.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-5 md:px-7 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-border2 text-muted hover:text-text rounded-md text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function ComponentBlock({ label, type, children }) {
  return (
    <div className="border border-border2 rounded-lg p-3.5 bg-surface/40">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-accent2">
          {label}
        </span>
        {type && (
          <span className="font-mono text-[0.6rem] text-muted">{type}</span>
        )}
      </div>
      {children}
    </div>
  )
}
