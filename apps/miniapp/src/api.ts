import Taro from '@tarojs/taro'

const API = 'http://127.0.0.1:8080'

export interface Option {
  value: string | number
  label: string
}

export interface Question {
  id: string
  text: string
  input: string
  module: string
  branch?: string
  options: Option[]
}

export interface Plan {
  revision: number
  status: string
  base_answered: number
  base_total: number
  branches: Array<{ branch: string; label: string; required?: boolean; answered: number; total: number; note?: string; deferred: boolean }>
  preface?: string
  next: Question | null
  ready_to_submit: boolean
}

export interface Report {
  id: string
  assessment_id?: string
  status: string
  depth: string
  full_type: string | null
  type_name: string | null
  courage: { status: string; code?: string; subtype?: string; group?: string; basis?: string }
  scores: Record<string, number | null>
  story: Record<string, { label: string; score: number | null }>
  radar: Array<{ axis: string; value: number | null }>
  letters?: Record<string, { score?: number | null; display_letter?: string; flexible?: boolean }>
}

function userId() {
  const key = 'ruxi-user'
  const saved = Taro.getStorageSync(key)
  if (saved) return String(saved)
  const created = `local-${Date.now()}`
  Taro.setStorageSync(key, created)
  return created
}

function rawError(err: unknown) {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object' && 'errMsg' in err) return String((err as { errMsg?: string }).errMsg || '')
  return ''
}

function isTechnical(text: string) {
  const raw = text.trim()
  if (!raw) return true
  if (/[\u4e00-\u9fff]/.test(raw)) return false
  return true
}

export function explainError(err: unknown, fallback: string) {
  const message = rawError(err).trim()
  if (isTechnical(message)) return fallback
  return message
}

async function request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, data?: unknown): Promise<T> {
  let res: Taro.request.SuccessCallbackResult<T>
  try {
    res = await Taro.request<T>({
      url: API + path,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'X-User-Id': userId(),
      },
    })
  } catch (err) {
    throw new Error(explainError(err, '答卷服务暂时连不上，请稍后再试。'))
  }
  if (!res.statusCode || res.statusCode >= 400) {
    const body = res.data as { message?: string } | undefined
    const fallback = !res.statusCode ? '答卷服务暂时连不上，请稍后再试。' : '这次没有完成，请稍后再试。'
    throw new Error(explainError(new Error(body?.message || ''), fallback))
  }
  return res.data
}

export const api = {
  create(profile: Record<string, unknown>, idempotencyKey: string) {
    return request<{ id: string; revision: number }>('POST', '/v2/assessments', {
      idempotency_key: idempotencyKey,
      profile,
    })
  },
  plan(id: string) {
    return request<Plan>('GET', `/v2/assessments/${id}/plan`)
  },
  answer(id: string, revision: number, answer: { id: string; state: string; value: string | number | null }) {
    return request<Plan>('PATCH', `/v2/assessments/${id}/answers`, {
      expected_revision: revision,
      answers: [answer],
    })
  },
  defer(id: string, revision: number, branch: string) {
    return request<Plan>('POST', `/v2/assessments/${id}/defer`, {
      expected_revision: revision,
      branch,
    })
  },
  submit(id: string, revision: number) {
    return request<Report>('POST', `/v2/assessments/${id}/submit`, {
      expected_revision: revision,
      allow_partial: true,
    })
  },
  report(id: string) {
    return request<Report>('GET', `/v2/reports/${id}`)
  },
  assessment(id: string) {
    return request<{
      id: string
      revision: number
      report_id?: string
      base_order: string[]
      profile?: { gender?: string }
      answers: Record<string, { state: string; likert?: number; enum?: string; status: string }>
    }>('GET', `/v2/assessments/${id}`)
  },
  questions() {
    return request<{ questions: Question[] }>('GET', '/v2/question-sets/current')
  },
}

export function saveSession(id: string) {
  Taro.setStorageSync('ruxi-assessment', id)
}

export function loadSession() {
  const id = Taro.getStorageSync('ruxi-assessment')
  return id ? String(id) : ''
}

export function saveReport(assessmentId: string, reportId: string) {
  Taro.setStorageSync('ruxi-report', JSON.stringify({ assessmentId, reportId }))
}

export async function findAccountReport() {
  const id = loadSession()
  if (!id) return ''
  try {
    const sheet = await api.assessment(id)
    const reportId = sheet.report_id || loadReport(id)
    if (!reportId) return ''
    await api.report(reportId)
    if (sheet.report_id) saveReport(id, sheet.report_id)
    return reportId
  } catch {
    return ''
  }
}

export function loadReport(assessmentId: string) {
  const raw = Taro.getStorageSync('ruxi-report')
  if (!raw) return ''
  try {
    const parsed = JSON.parse(String(raw)) as { assessmentId?: string; reportId?: string }
    if (parsed.assessmentId === assessmentId && parsed.reportId) return parsed.reportId
  } catch {
    return ''
  }
  return ''
}
