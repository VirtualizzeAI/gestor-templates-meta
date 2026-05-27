// Meta Graph API client for WhatsApp Business message templates
// Docs: https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates

const GRAPH_VERSION = 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

function buildHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
}

async function handleResponse(res) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const err = data?.error
    const msg =
      err?.error_user_msg ||
      err?.message ||
      `Erro HTTP ${res.status} ao chamar a Meta API`
    const error = new Error(msg)
    error.status = res.status
    error.meta = err
    throw error
  }
  return data
}

/**
 * List message templates for a given WABA.
 * @param {{ wabaId: string, accessToken: string, after?: string, limit?: number }} args
 */
export async function listTemplates({ wabaId, accessToken, after, limit = 50 }) {
  const params = new URLSearchParams({
    fields:
      'name,language,status,category,components,quality_score,id,rejected_reason',
    limit: String(limit)
  })
  if (after) params.set('after', after)
  const url = `${GRAPH_BASE}/${wabaId}/message_templates?${params}`
  const res = await fetch(url, { headers: buildHeaders(accessToken) })
  return handleResponse(res)
}

/**
 * Create a new message template.
 * @param {{ wabaId: string, accessToken: string, payload: object }} args
 */
export async function createTemplate({ wabaId, accessToken, payload }) {
  const url = `${GRAPH_BASE}/${wabaId}/message_templates`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

/**
 * Edit an existing template by its ID. Only certain fields (components, category)
 * can be edited and only for templates with status APPROVED/REJECTED/PAUSED.
 * @param {{ templateId: string, accessToken: string, payload: object }} args
 */
export async function editTemplate({ templateId, accessToken, payload }) {
  const url = `${GRAPH_BASE}/${templateId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload)
  })
  return handleResponse(res)
}

/**
 * Delete a template by name (deletes all language variants of that name).
 * Optionally pass hsm_id to delete a specific language variant.
 * @param {{ wabaId: string, accessToken: string, name: string, hsm_id?: string }} args
 */
export async function deleteTemplate({ wabaId, accessToken, name, hsm_id }) {
  const params = new URLSearchParams({ name })
  if (hsm_id) params.set('hsm_id', hsm_id)
  const url = `${GRAPH_BASE}/${wabaId}/message_templates?${params}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(accessToken)
  })
  return handleResponse(res)
}

/**
 * Validate a token + WABA by attempting a tiny list call.
 */
export async function pingWaba({ wabaId, accessToken }) {
  const url = `${GRAPH_BASE}/${wabaId}/message_templates?fields=name&limit=1`
  const res = await fetch(url, { headers: buildHeaders(accessToken) })
  return handleResponse(res)
}

/**
 * Render a body string with example placeholders replaced.
 * Meta uses {{1}}, {{2}}, etc.
 */
export function renderBodyExample(text, examples = []) {
  if (!text) return ''
  return text.replace(/{{(\d+)}}/g, (_, idx) => {
    const i = parseInt(idx, 10) - 1
    return examples[i] ?? `{{${idx}}}`
  })
}

/**
 * Count placeholders {{1}}..{{N}} in a body string.
 */
export function countPlaceholders(text) {
  if (!text) return 0
  const matches = text.match(/{{(\d+)}}/g) || []
  const ids = new Set(matches.map((m) => parseInt(m.replace(/[{}]/g, ''), 10)))
  return ids.size
}

export const META_CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION']

export const META_LANGUAGES = [
  { code: 'pt_BR', label: 'Português (Brasil)' },
  { code: 'pt_PT', label: 'Português (Portugal)' },
  { code: 'en', label: 'English' },
  { code: 'en_US', label: 'English (US)' },
  { code: 'es', label: 'Español' },
  { code: 'es_ES', label: 'Español (España)' },
  { code: 'es_MX', label: 'Español (México)' }
]

export const STATUS_COLOR = {
  APPROVED: 'green',
  PENDING: 'amber',
  REJECTED: 'red',
  PAUSED: 'orange',
  DISABLED: 'muted',
  IN_APPEAL: 'amber',
  PENDING_DELETION: 'orange'
}
