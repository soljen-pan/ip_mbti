import Taro from '@tarojs/taro'
import { api, findAccountReport, Plan, saveReport, saveSession } from '../api'

export const MOCK_NICKNAME = '本地测试'
export const MOCK_GENDER = 'female'

export function writeMockLogin() {
  if (!Taro.getStorageSync('ruxi-user')) Taro.setStorageSync('ruxi-user', 'local-mock')
  Taro.setStorageSync('ruxi-logged-in', '1')
  if (!String(Taro.getStorageSync('ruxi-nickname') || '')) Taro.setStorageSync('ruxi-nickname', MOCK_NICKNAME)
  if (!String(Taro.getStorageSync('ruxi-gender') || '')) Taro.setStorageSync('ruxi-gender', MOCK_GENDER)
  if (!String(Taro.getStorageSync('ruxi-avatar') || '')) {
    const avatar = letterAvatar(String(Taro.getStorageSync('ruxi-nickname') || MOCK_NICKNAME))
    if (avatar) Taro.setStorageSync('ruxi-avatar', avatar)
  }
}

export async function ensureMockReport(onStep?: (done: number) => void) {
  const existing = await findAccountReport()
  if (existing) return existing
  const created = await api.create(
    { gender: MOCK_GENDER, nickname: MOCK_NICKNAME },
    'local-mock-report',
  )
  const sheet = await api.assessment(created.id)
  if (sheet.report_id) {
    saveSession(created.id)
    saveReport(created.id, sheet.report_id)
    return sheet.report_id
  }
  let plan = await api.plan(created.id)
  let steps = 0
  while (plan.next && steps < 120) {
    const question = plan.next
    const value = pick(question)
    plan = await api.answer(created.id, plan.revision, {
      id: question.id,
      state: value === null ? 'unknown' : 'answered',
      value,
    })
    steps += 1
    onStep?.(steps)
  }
  if (!plan.ready_to_submit) throw new Error('本地测试报告还没答完')
  const report = await api.submit(created.id, plan.revision)
  saveSession(created.id)
  saveReport(created.id, report.id)
  return report.id
}

function pick(question: NonNullable<Plan['next']>) {
  if (question.input === 'likert') return 4
  const option = (question.options || []).find((item) => item.value !== 'unknown' && item.value !== '')
  return option ? option.value : null
}

function letterAvatar(name: string) {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = '#693e7d'
  ctx.beginPath()
  ctx.arc(64, 64, 64, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 52px "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.slice(0, 1) || '测', 64, 68)
  return canvas.toDataURL('image/png')
}
