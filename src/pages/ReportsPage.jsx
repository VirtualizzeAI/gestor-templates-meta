import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle } from 'lucide-react'

const reportFields = [
  { key: 'created_at', label: 'Data do envio' },
  { key: 'nome_cliente', label: 'Nome cliente' },
  { key: 'id_cliente', label: 'ID cliente' },
  { key: 'template_enviado', label: 'Template enviado' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'valor', label: 'Valor' }
]

function formatDate(dateString) {
  if (!dateString) return '-'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

function normalizeRow(row) {
  return {
    created_at: row.created_at || row.data?.created_at || null,
    nome_cliente:
      row.nome_cliente || row.nomeCliente || row.client_name || row.cliente || row.nome || '-',
    id_cliente:
      row.id_cliente || row.cliente_id || row.customer_id || row.client_id || row.id_cliente || '-',
    template_enviado:
      row.template_enviado || row.templateEnviado || row.template || row.template_name || '-',
    categoria: row.categoria || row.category || '-',
    valor: row.valor || row.value || row.price || '-'
  }
}

export default function ReportsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadReports() {
      setLoading(true)
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('templates')
          .select(
            'created_at, nome_cliente, id_cliente, template_enviado, categoria, valor'
          )
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        if (!isMounted) return
        setRows((data || []).map(normalizeRow))
      } catch (err) {
        if (!isMounted) return
        setError(
          err.message ||
            'Não foi possível carregar o relatório. Verifique se a tabela `templates` existe no Supabase.'
        )
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (user?.id) {
      loadReports()
    }

    return () => {
      isMounted = false
    }
  }, [user?.id])

  return (
    <div className="fade-in">
      <div className="mb-8">
        <p className="font-mono text-[0.62rem] tracking-widest uppercase text-muted mb-2">
          Relatórios · Templates enviados
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Relatórios</h1>
      </div>

      {error && (
        <div className="text-xs font-mono text-red/90 bg-red/5 border border-red/20 rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Erro ao carregar relatório</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface2 text-xs uppercase tracking-wider text-muted">
            <tr>
              {reportFields.map((field) => (
                <th key={field.key} className="px-4 py-3 font-medium">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {loading ? (
              <tr>
                <td colSpan={reportFields.length} className="px-4 py-12 text-center">
                  <Loader2 className="spin mx-auto text-accent2" size={28} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={reportFields.length} className="px-4 py-12 text-center text-muted">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className="hover:bg-surface/80">
                  <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3">{row.nome_cliente}</td>
                  <td className="px-4 py-3">{row.id_cliente}</td>
                  <td className="px-4 py-3 break-words">{row.template_enviado}</td>
                  <td className="px-4 py-3">{row.categoria}</td>
                  <td className="px-4 py-3">{row.valor}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
