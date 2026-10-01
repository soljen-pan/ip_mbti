import watermarkUrl from '../../assets/ui/moments-watermark.jpg'
import { findArchetype } from '../../data/catalog'
import { candidates, closenessBand, type FitEntry } from '../../data/candidates'
import type { Report } from '../../api'

export const POSTER_WIDTH = 1080
export const POSTER_HEIGHT = 1440

const axisName: Record<string, string> = {
  immersion: '入戏',
  interaction: '互动',
  route_openness: '探索',
  intensity: '刺激',
  movement: '动能',
  cooperation: '协作',
}

export type PosterInput = {
  report: Report
  gender: string
  nickname: string
  avatarUrl: string
  personaUrl: string
  entryUrl: string
}

export function shareEntryUrl() {
  if (typeof window === 'undefined') return ''
  const path = window.location.pathname || '/'
  return `${window.location.origin}${path}#/pages/home/index`
}

export async function renderMomentsPoster(input: PosterInput) {
  const canvas = document.createElement('canvas')
  canvas.width = POSTER_WIDTH
  canvas.height = POSTER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('画布打不开')

  ctx.fillStyle = '#f7f8f6'
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)

  const watermark = await loadImage(watermarkUrl)
  const bannerH = Math.round(POSTER_WIDTH * (watermark.height / watermark.width))
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, POSTER_WIDTH, bannerH)
  ctx.drawImage(watermark, 0, 0, POSTER_WIDTH, bannerH)

  const bodyTop = bannerH - 20
  roundRect(ctx, 28, bodyTop, POSTER_WIDTH - 56, POSTER_HEIGHT - bodyTop - 24, 32)
  ctx.fillStyle = '#fcf9ef'
  ctx.fill()

  const avatar = input.avatarUrl ? await loadImage(input.avatarUrl).catch(() => null) : null
  const nick = (input.nickname || '').trim().slice(0, 12) || '未设置昵称'
  drawAvatar(ctx, 56, bodyTop + 28, 84, avatar, nick)

  ctx.fillStyle = '#111111'
  ctx.font = '700 36px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(nick, 160, bodyTop + 36)
  ctx.fillStyle = '#626066'
  ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.fillText('入戏档案', 160, bodyTop + 80)

  const title = input.report.type_name || '部分偏好待了解'
  ctx.fillStyle = '#111111'
  ctx.font = '700 44px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.fillText(fitText(ctx, title, 960), 56, bodyTop + 132)

  const code = input.report.full_type || '部分偏好待了解'
  const courage = courageLabel(input.report)
  ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
  const codeW = ctx.measureText(code).width
  pill(ctx, 56, bodyTop + 192, codeW + 32, 40, '#111111', '#ffffff', code)
  pill(ctx, 56 + codeW + 48, bodyTop + 192, ctx.measureText(courage).width + 32, 40, '#693e7d', '#ffffff', courage)

  const persona = input.personaUrl ? await loadImage(input.personaUrl).catch(() => null) : null
  const artX = 56
  const artY = bodyTop + 252
  const artW = 320
  const artH = 220
  roundRect(ctx, artX, artY, artW, artH, 24)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  if (persona) {
    const ps = Math.min((artW - 16) / persona.width, (artH - 16) / persona.height)
    const pw = persona.width * ps
    const ph = persona.height * ps
    ctx.drawImage(persona, artX + (artW - pw) / 2, artY + artH - ph - 6, pw, ph)
  } else {
    ctx.fillStyle = '#626066'
    ctx.font = '500 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('形象待接入', artX + artW / 2, artY + artH / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
  }

  drawRadar(ctx, 760, artY + artH / 2, 96, input.report.radar || [])

  const fits = fitRows(input.report.full_type)
  let rowY = artY + artH + 20
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#111111'
  ctx.font = '700 26px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.fillText('密室搭配', 56, rowY)
  rowY += 38
  if (!fits.length) {
    ctx.fillStyle = '#626066'
    ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.fillText('类型还没齐，先不列搭配。', 56, rowY)
  } else {
    for (const row of fits.slice(0, 3)) {
      ctx.fillStyle = '#111111'
      ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
      ctx.fillText(row.name, 56, rowY)
      ctx.fillStyle = '#693e7d'
      ctx.font = '700 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(String(row.score), 780, rowY)
      ctx.textAlign = 'left'
      ctx.fillStyle = '#626066'
      ctx.font = '400 22px "PingFang SC", "Hiragino Sans GB", sans-serif'
      ctx.fillText(row.band, 800, rowY)
      rowY += 36
    }
  }

  const qr = await qrImage(input.entryUrl)
  const qrSize = 148
  const qrX = POSTER_WIDTH - 56 - qrSize
  const qrY = POSTER_HEIGHT - 40 - qrSize
  roundRect(ctx, qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize)
  ctx.fillStyle = '#111111'
  ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('扫码开始测试', 56, qrY + 36)
  ctx.fillStyle = '#626066'
  ctx.font = '400 20px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.fillText('打开入戏档案，登录后做测试', 56, qrY + 74)

  return canvas.toDataURL('image/jpeg', 0.92)
}

function courageLabel(report: Report) {
  const names: Record<string, string> = { 'T-G': '巨坦', 'T-M': '微坦', 'N-S': '尖叫奶', 'N-Q': '哑巴奶' }
  if (report.courage.status !== 'resolved' || !report.courage.code) return '坦奶待补答'
  return names[report.courage.code] || '坦奶待补答'
}

function fitRows(fullType: string) {
  const code = (fullType || '').slice(0, 4)
  if (!code || code.includes('?')) return []
  const lists = candidates(code, 'immersive')
  const merged = mergePose([...lists.same, ...lists.complement])
  return merged.slice(0, 4).map((item) => ({
    name: findArchetype(item.code)?.name || item.code,
    score: item.score,
    band: closenessBand(item.score),
  }))
}

function mergePose(list: FitEntry[]) {
  const map = new Map<string, FitEntry>()
  for (const item of list) {
    const code = item.code.slice(0, 4)
    const prev = map.get(code)
    if (!prev || item.score > prev.score) map.set(code, { code, score: item.score })
  }
  return [...map.values()]
}

function drawAvatar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, image: HTMLImageElement | null, nick: string) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (image) {
    const side = Math.min(image.width, image.height)
    const sx = (image.width - side) / 2
    const sy = (image.height - side) / 2
    ctx.drawImage(image, sx, sy, side, side, x, y, size, size)
  } else {
    ctx.fillStyle = '#693e7d'
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 44px "PingFang SC", "Hiragino Sans GB", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(nick.slice(0, 1) || '戏', x + size / 2, y + size / 2)
  }
  ctx.restore()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 4
  ctx.stroke()
}

function drawRadar(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, radar: Report['radar']) {
  const count = Math.max(radar.length, 6)
  const at = (index: number, dist: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
    return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist] as const
  }
  ctx.strokeStyle = '#d7d2cd'
  ctx.lineWidth = 2
  for (const ring of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath()
    for (let i = 0; i < count; i += 1) {
      const [x, y] = at(i, radius * ring)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  for (let i = 0; i < count; i += 1) {
    const [x, y] = at(i, radius)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
  const known = radar.length > 0 && radar.every((item) => item.value !== null && item.value !== undefined)
  ctx.strokeStyle = '#693e7d'
  ctx.lineWidth = 4
  ctx.beginPath()
  let open = false
  radar.forEach((item, index) => {
    if (item.value === null || item.value === undefined) {
      if (open) ctx.stroke()
      open = false
      ctx.beginPath()
      return
    }
    const [x, y] = at(index, radius * (item.value / 100))
    if (!open) {
      ctx.moveTo(x, y)
      open = true
    } else ctx.lineTo(x, y)
  })
  if (known) {
    ctx.closePath()
    ctx.fillStyle = 'rgba(105, 62, 125, 0.16)'
    ctx.fill()
  }
  if (open) ctx.stroke()

  ctx.fillStyle = '#111111'
  ctx.font = '600 22px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  radar.forEach((item, index) => {
    const [x, y] = at(index, radius + 36)
    const name = axisName[item.axis] || item.axis
    const value = item.value === null || item.value === undefined ? '待补充' : String(Math.round(item.value))
    ctx.fillText(`${name} ${value}`, x, y)
  })
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, color: string, text: string) {
  roundRect(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.fillStyle = color
  ctx.font = '600 24px "PingFang SC", "Hiragino Sans GB", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + w / 2, y + h / 2 + 1)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text
  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > max) out = out.slice(0, -1)
  return `${out}…`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片读不出来'))
    image.src = src
  })
}

async function qrImage(url: string) {
  const QRCode = (await import('qrcode')).default
  const dataUrl = await QRCode.toDataURL(url || 'https://example.invalid', {
    margin: 1,
    width: 336,
    color: { dark: '#111111', light: '#ffffff' },
  })
  return loadImage(dataUrl)
}
