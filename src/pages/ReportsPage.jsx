import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle, RefreshCw, Send, Megaphone, Wrench, DollarSign, Calendar, FileSpreadsheet, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const DATE_FILTERS = [
  { key: 'today',   label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: '7d',      label: 'Últimos 7 dias' },
  { key: '30d',     label: 'Últimos 30 dias' },
  { key: 'custom',  label: 'Selecionar período', icon: Calendar },
]

function formatDateShort(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function getDateRange(filter, customStart, customEnd) {
  const now = new Date()
  const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
  const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }

  if (filter === 'today')     return { from: startOfDay(now), to: endOfDay(now) }
  if (filter === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1)
    return { from: startOfDay(y), to: endOfDay(y) }
  }
  if (filter === '7d')  { const d = new Date(now); d.setDate(d.getDate() - 6); return { from: startOfDay(d), to: endOfDay(now) } }
  if (filter === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); return { from: startOfDay(d), to: endOfDay(now) } }
  if (filter === 'custom' && customStart && customEnd) {
    return { from: startOfDay(new Date(customStart + 'T00:00:00')), to: endOfDay(new Date(customEnd + 'T00:00:00')) }
  }
  return null
}

function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateString))
  } catch { return dateString }
}

function formatValor(valor) {
  if (valor === null || valor === undefined || valor === '') return '-'
  const num = parseFloat(valor)
  if (isNaN(num)) return '-'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

function StatCard({ label, value, icon: Icon, color = 'text-text', accent = 'bg-surface2' }) {
  return (
    <div className="card px-5 py-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${accent}`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="font-mono text-[0.6rem] tracking-widest uppercase text-muted">{label}</p>
        <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('custos_meta')
        .select('id, created_at, nome_cliente, numero_cliente, nome_template, categoria, valor')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setRows(data || [])
    } catch (err) {
      setError(err.message || 'Não foi possível carregar o relatório.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (user?.id) loadReports() }, [user?.id])

  const filtered = useMemo(() => {
    const range = getDateRange(dateFilter, customStart, customEnd)
    if (!range) return rows
    return rows.filter(r => {
      const d = new Date(r.created_at)
      return d >= range.from && d <= range.to
    })
  }, [rows, dateFilter, customStart, customEnd])

  const totalMarketing     = filtered.filter(r => r.categoria === 'marketing').length
  const totalUtility       = filtered.filter(r => r.categoria === 'utility').length
  const totalGastos        = filtered.reduce((acc, r) => acc + (parseFloat(r.valor) || 0), 0)
  const totalGastosFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGastos)

  const periodoLabel = useMemo(() => {
    const range = getDateRange(dateFilter, customStart, customEnd)
    if (!range) return ''
    return `${formatDateShort(range.from)} - ${formatDateShort(range.to)}`
  }, [dateFilter, customStart, customEnd])

  function getExportRows() {
    return filtered.map(r => ({
      Data: formatDate(r.created_at),
      Nome: r.nome_cliente || '-',
      Telefone: r.numero_cliente ? String(r.numero_cliente) : '-',
      Template: r.nome_template || '-',
      Categoria: r.categoria || '-',
      Valor: r.valor != null ? parseFloat(r.valor) : '-',
    }))
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()

    // Aba de resumo
    const summaryData = [
      ['Resumo do Relatório'],
      ['Período', periodoLabel],
      [],
      ['Total de mensagens', filtered.length],
      ['Total Marketing',    totalMarketing],
      ['Total Utility',      totalUtility],
      ['Total de gastos',    totalGastosFormatado],
      [],
      [`Exportado em: ${formatDate(new Date().toISOString())}`],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

    // Aba de detalhes
    const wsDetail = XLSX.utils.json_to_sheet(getExportRows())
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalhes')

    XLSX.writeFile(wb, `relatorio_luna_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  function exportPDF() {
    const doc = new jsPDF()
    const dateStr = formatDate(new Date().toISOString())
    const filename = `relatorio_luna_${new Date().toISOString().slice(0, 10)}.pdf`

    // Título
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(30)
    doc.text('Relatório de Mensagens Enviadas', 14, 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text(`Exportado em ${dateStr}  ·  Período: ${periodoLabel}`, 14, 23)

    // Tabela de resumo
    autoTable(doc, {
      startY: 28,
      head: [['Resumo', 'Quantidade']],
      body: [
        ['Período',                      periodoLabel],
        ['Total de mensagens enviadas',  String(filtered.length)],
        ['Total Marketing',              String(totalMarketing)],
        ['Total Utility',                String(totalUtility)],
        ['Total de gastos',              totalGastosFormatado],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
      tableWidth: 90,
    })

    // Tabela de detalhes
    const afterSummary = doc.lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30)
    doc.text('Detalhamento', 14, afterSummary)

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['Data', 'Nome', 'Telefone', 'Template', 'Categoria', 'Valor']],
      body: getExportRows().map(r => [r.Data, r.Nome, r.Telefone, r.Template, r.Categoria,
        typeof r.Valor === 'number'
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.Valor)
          : r.Valor
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
    })

    doc.save(filename)
  }

  const customRangeReady = dateFilter === 'custom' && customStart && customEnd && customStart <= customEnd

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.62rem] tracking-widest uppercase text-muted mb-2">
            Relatórios · Mensagens enviadas
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Relatórios</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            disabled={filtered.length === 0}
            title="Exportar Excel"
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border2 text-muted hover:text-green hover:border-green/40 text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>
          <button
            onClick={exportPDF}
            disabled={filtered.length === 0}
            title="Exportar PDF"
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border2 text-muted hover:text-red hover:border-red/40 text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FileText size={13} />
            PDF
          </button>
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border2 text-muted hover:text-text hover:border-border text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Date filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {DATE_FILTERS.map(f => {
            const Icon = f.icon
            return (
              <button
                key={f.key}
                onClick={() => setDateFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[0.65rem] font-mono tracking-widest uppercase transition-all ${
                  dateFilter === f.key
                    ? 'border-accent bg-accent/10 text-accent2'
                    : 'border-border2 text-muted hover:text-text hover:border-border'
                }`}
              >
                {Icon && <Icon size={11} />}
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Custom range inputs */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="font-mono text-[0.6rem] tracking-widest uppercase text-muted">De</label>
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={e => setCustomStart(e.target.value)}
                className="bg-surface border border-border2 rounded-md px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-mono text-[0.6rem] tracking-widest uppercase text-muted">Até</label>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={e => setCustomEnd(e.target.value)}
                className="bg-surface border border-border2 rounded-md px-3 py-1.5 text-xs font-mono text-text focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {customStart && customEnd && !customRangeReady && (
              <p className="font-mono text-[0.6rem] text-red">Data final deve ser maior ou igual à inicial.</p>
            )}
          </div>
        )}

        {/* Period label */}
        {periodoLabel && (
          <p className="font-mono text-[0.65rem] text-muted">
            Período: <span className="text-text">{periodoLabel}</span>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total de mensagens" value={filtered.length} icon={Send} color="text-accent2" accent="bg-accent/10" />
        <StatCard label="Total Marketing"    value={totalMarketing}  icon={Megaphone} color="text-amber" accent="bg-amber/10" />
        <StatCard label="Total Utility"      value={totalUtility}    icon={Wrench}    color="text-green" accent="bg-green/10" />
        <StatCard label="Total de gastos"    value={totalGastosFormatado} icon={DollarSign} color="text-orange" accent="bg-orange/10" />
      </div>

      {error && (
        <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">Erro ao carregar relatório</p>
            <p className="text-muted">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-mono font-medium">Data</th>
              <th className="px-4 py-3 font-mono font-medium">Nome</th>
              <th className="px-4 py-3 font-mono font-medium">Telefone</th>
              <th className="px-4 py-3 font-mono font-medium">Template</th>
              <th className="px-4 py-3 font-mono font-medium">Categoria</th>
              <th className="px-4 py-3 font-mono font-medium">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <Loader2 className="spin mx-auto text-accent2" size={28} />
                </td>
              </tr>
            ) : dateFilter === 'custom' && !customRangeReady ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted font-mono text-xs">
                  Selecione o período de início e fim para visualizar os dados.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted font-mono text-xs">
                  Nenhum registro no período selecionado.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-surface/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.nome_cliente || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.numero_cliente || '-'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.nome_template || '-'}</td>
                  <td className="px-4 py-3">
                    {row.categoria ? (
                      <span className={`inline-block px-2 py-0.5 rounded border text-[0.65rem] font-mono font-semibold tracking-widest uppercase ${
                        row.categoria === 'MARKETING' ? 'text-amber bg-amber/10 border-amber/20'
                        : row.categoria === 'UTILITY' ? 'text-green bg-green/10 border-green/20'
                        : 'text-muted bg-surface2 border-border'
                      }`}>
                        {row.categoria}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{formatValor(row.valor)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-right font-mono text-[0.6rem] text-muted">
          {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
