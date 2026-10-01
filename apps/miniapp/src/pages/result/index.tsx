import { Image, Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { api, Report } from '../../api'
import PageHead from '../../components/PageHead'
import Icon from '../../components/Icon'
import { findArchetype } from '../../data/catalog'
import { Scene, candidates, closenessBand, rankBlock, talkAbout, FitEntry } from '../../data/candidates'
import { archiveReading, StoredAnswer } from '../../data/reading'
import { personaAvatar } from '../../data/avatars'

const courageName: Record<string, string> = {
  'T-G': '巨坦',
  'T-M': '微坦',
  'N-S': '尖叫奶',
  'N-Q': '哑巴奶',
}

const axisName: Record<string, string> = {
  immersion: '入戏投入',
  interaction: '互动意愿',
  route_openness: '探索欲望',
  intensity: '刺激偏好',
  movement: '动能偏好',
  cooperation: '协作意愿',
}

const axisNote: Record<string, string> = {
  immersion: '愿不愿意走进角色。',
  interaction: '愿不愿意接话、接互动。',
  route_openness: '想不想自己找主线以外的发现。',
  intensity: '对刺激强度的接受。',
  movement: '动得多不多。',
  cooperation: '愿不愿意一起做。',
}

export default function ResultPage() {
  const reportId = useRouter().params.id || ''
  const [report, setReport] = useState<Report | null>(null)
  const [answers, setAnswers] = useState<Record<string, StoredAnswer>>({})
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [scene, setScene] = useState<Scene>('immersive')
  const [view, setView] = useState<'read' | 'radar' | 'fit'>('read')

  useEffect(() => {
    api.report(reportId).then((item) => {
      setReport(item)
      if (!item.assessment_id) return
      api.assessment(item.assessment_id).then((sheet) => {
        setAnswers(sheet.answers || {})
        setGender(sheet.profile?.gender || '')
      }).catch(() => setAnswers({}))
    }).catch(() => setError('这份结果暂时打不开'))
  }, [reportId])

  if (!report) {
    return <View className='page page-result'><PageHead title='我的档案' /><View className='profile-desc'>{error || '正在整理结果'}</View></View>
  }

  const pending = report.courage.status !== 'resolved' || !report.courage.code
  const courage = pending ? '坦奶待补答' : courageName[report.courage.code || ''] || '坦奶待补答'
  const own = report.full_type ? findArchetype(report.full_type.slice(0, 4)) : undefined
  const reading = archiveReading(report, answers)
  const pose = report.full_type?.endsWith('R') ? '缓行型' : report.full_type?.endsWith('K') ? '动能型' : ''
  const art = personaAvatar(report.full_type, gender, report.courage.code, report.courage.group)
  return (
    <View className='page page-result'>
      <PageHead title='我的档案' />
      <View className='profile-kicker'>PLAYER ARCHIVE</View>
      <View className='profile-title'>{report.type_name || '还有字母待了解'}</View>
      <View className='sheet-tags'>
        {pose ? <View className='catalog-tag'>{pose}</View> : null}
        <View className='catalog-tag'>{courage}</View>
      </View>
      <View className='profile-desc'>{own?.line || '代码和坦奶分开写，不合成六字母。'}</View>
      <View className='paper-card'>
        <View className='soft-tag'>{report.full_type || '部分偏好待了解'}</View>
        {art ? <Image className='result-art' src={art} mode='aspectFit' /> : <View className='result-pending'>形象待接入</View>}
        <View className='folder-seal'>已建档</View>
      </View>
      <View className='archive-tabs'>
        <View className={view === 'read' ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => setView('read')}>档案解读</View>
        <View className={view === 'radar' ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => setView('radar')}>六星图</View>
        <View className={view === 'fit' ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => setView('fit')}>图鉴搭配</View>
      </View>
      {view === 'read' ? (
        <View>
          <View className='sheet-stack'>
            <View className='sheet-card'>
              <View className='sheet-card-title'>你的入戏方式</View>
              {reading.line ? <View className='sheet-card-copy'>{reading.line}</View> : <View className='sheet-card-copy'>玩法说明待这份结果补全。</View>}
              {reading.play ? <View className='sheet-card-copy'>发挥：{reading.play}</View> : null}
              {reading.narrative ? <View className='sheet-card-copy'>叙事：{reading.narrative}</View> : null}
              {reading.timing ? <View className='sheet-card-copy'>{reading.timing}</View> : null}
              {reading.actions.length ? <View className='sheet-card-copy'>下一场：{reading.actions.join('、')}。</View> : null}
            </View>
            {reading.strengths.length ? (
              <View className='sheet-card'>
                <View className='sheet-card-title'>优势</View>
                <View className='sheet-card-copy'>{reading.strengths.join('、')}</View>
              </View>
            ) : null}
            {reading.risks.length || reading.chaseNo ? (
              <View className='sheet-card'>
                <View className='sheet-card-title'>需要提前商量的事</View>
                {reading.risks.map((item) => <View key={item} className='sheet-card-copy'>{item}</View>)}
                {reading.chaseNo ? <View className='sheet-card-copy'>自述不接受追逐仍然有效。</View> : null}
              </View>
            ) : null}
            <View className='sheet-card'>
              <View className='sheet-card-title'>{courage}</View>
              {reading.couragePlay ? <View className='sheet-card-copy'>{reading.couragePlay}</View> : null}
              {reading.courageRemind ? <View className='sheet-card-copy'>{reading.courageRemind}</View> : null}
            </View>
            <View className='sheet-card'>
              <View className='sheet-card-title'>剧情情感反应</View>
              <View className='sheet-tags'>
                <View className='catalog-tag'>{reading.emotionTag}</View>
                <View className='catalog-tag'>{reading.tearsTag}</View>
              </View>
              {reading.emotionBody ? <View className='sheet-card-copy'>{reading.emotionBody}</View> : null}
            </View>
          </View>
          <View className='action-row'>
            <View className='btn btn-primary' onClick={() => Taro.redirectTo({ url: '/pages/partners/index' })}>找搭子 →</View>
            <View className='btn btn-ghost' onClick={() => Taro.redirectTo({ url: '/pages/themes/index' })}>找主题</View>
            <View className='btn btn-ghost' onClick={() => Taro.navigateTo({ url: `/pages/share/index?id=${report.id}` })}>分享</View>
          </View>
        </View>
      ) : null}
      {view === 'radar' ? (
        <View>
          <View className='sheet-card radar-card'>
            <Radar points={report.radar} />
          </View>
          <View className='radar-list'>
            {report.radar.map((item) => (
              <View key={item.axis} className='radar-item'>
                <View className='radar-item-top'>
                  <Text className='radar-item-name'>{axisName[item.axis] || item.axis}</Text>
                  <Text className={item.value === null ? 'radar-item-num radar-item-num-empty' : 'radar-item-num'}>{item.value === null ? '待补充' : Math.round(item.value)}</Text>
                </View>
                <View className='radar-item-note'>{axisNote[item.axis] || ''}</View>
                <View className='radar-item-track'>
                  <View className='radar-item-fill' style={{ width: item.value === null ? '0%' : `${Math.max(0, Math.min(100, item.value))}%` }} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {view === 'fit' ? <TypeFit report={report} scene={scene} onScene={setScene} /> : null}
    </View>
  )
}

function collapsePose(entries: FitEntry[], seen: Set<string>, ownCode: string) {
  const pose = ownCode.slice(-1)
  const out: Array<{ base: string; codes: string[]; score: number }> = []
  entries.forEach((entry) => {
    const base = entry.code.slice(0, 4)
    if (seen.has(base)) return
    const found = out.find((item) => item.base === base)
    if (!found) {
      out.push({ base, codes: [entry.code], score: entry.score })
      return
    }
    found.codes.push(entry.code)
    if (entry.code.endsWith(pose)) found.score = entry.score
  })
  out.forEach((item) => seen.add(item.base))
  return out
}

function poseCode(ownCode: string, codes: string[]) {
  const pose = ownCode.slice(-1)
  return codes.find((code) => code.endsWith(pose)) || codes[0]
}

function TypeFit({ report, scene, onScene }: { report: Report; scene: Scene; onScene: (scene: Scene) => void }) {
  const block = rankBlock(report.letters, report.full_type)
  const ownCode = report.full_type || ''
  const own = ownCode ? findArchetype(ownCode.slice(0, 4)) : undefined
  const lists = ownCode ? candidates(ownCode, scene) : null
  const seen = new Set<string>()
  const same = lists ? collapsePose(lists.same, seen, ownCode) : []
  const complement = lists ? collapsePose(lists.complement, seen, ownCode) : []
  const talk = lists ? collapsePose(lists.talk, seen, ownCode) : []
  return (
    <View className='sheet-stack'>
      <View className='sheet-card'>
        <View className='sheet-card-title'>类型方向推演</View>
        <View className='sheet-card-copy'>32 种玩法原型的启发式候选，不是真人。0–100 是偏好接近度，不是成功概率，不写百分号。明确拒绝不会被这个分数盖掉。</View>
        <View className='sheet-card-copy'>80 及以上偏好多数接近，65–80 较多共同点，50–65 差异需商量，低于 50 目标差异较多。</View>
        {block ? <View className='sheet-card-copy'>{block}</View> : null}
        {block && own ? <View className='sheet-card-copy'>具体玩法条件：{own.play}</View> : null}
      </View>
      {lists ? (
        <View>
          <View className='archive-tabs'>
            <View className={scene === 'immersive' ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => onScene('immersive')}>沉浸演绎</View>
            <View className={scene === 'chase' ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => onScene('chase')}>黑追</View>
          </View>
          <FitGroup title='合拍' note='玩法方向相近，具体组队还要看本场约定。可以有同类型。' icon='fit-same' items={same} />
          <FitGroup title='可以互补，要先协调' note='重点方向对齐，接话或路线至少有一项不同。' icon='fit-mix' items={complement} />
          <FitGroup title='差异更大，先沟通' note='不是不合，也不是品德差。先看差得最大的两项。' icon='fit-talk' items={talk} own={ownCode} scene={scene} />
        </View>
      ) : null}
    </View>
  )
}

function FitGroup({ title, note, icon, items, own, scene }: { title: string; note: string; icon: string; items: Array<{ base: string; codes: string[]; score: number }>; own?: string; scene?: Scene }) {
  if (!items.length) return null
  return (
    <View className='fit-group'>
      <View className='fit-group-head'>
        <View className={`fit-group-mark fit-group-mark-${icon}`}>
          <Icon name={icon} size={20} />
        </View>
        <View className='fit-group-copy'>
          <View className='fit-group-title'>{title}</View>
          <View className='fit-group-note'>{note}</View>
        </View>
      </View>
      {items.map((item) => {
        const archetype = findArchetype(item.base)
        const diff = own && scene ? talkAbout(own, poseCode(own, item.codes), scene) : []
        return (
          <View key={item.base} className='sheet-card fit-card' onClick={() => Taro.navigateTo({ url: `/pages/catalog/detail?code=${item.base}` })}>
            <View className='fit-card-top'>
              <View className='sheet-card-title'>{archetype?.name || item.base}</View>
              <View className='fit-score'>
                <Text className='fit-score-num'>{item.score}</Text>
                <Text className='fit-score-band'>{closenessBand(item.score)}</Text>
              </View>
            </View>
            <View className='sheet-card-copy'>{item.base} · {archetype?.line || ''}</View>
            {diff.length ? <View className='sheet-card-copy'>先对齐：{diff.join('、')}</View> : null}
          </View>
        )
      })}
    </View>
  )
}

function Radar({ points }: { points: Report['radar'] }) {
  const cx = 170
  const cy = 168
  const radius = 86
  const count = Math.max(points.length, 1)
  const spot = (index: number, ratio: number) => {
    const theta = (index * 2 * Math.PI) / count
    const r = radius * ratio
    return [cx + Math.sin(theta) * r, cy - Math.cos(theta) * r]
  }
  const ring = (scale: number) => points.map((_, index) => spot(index, scale).join(',')).join(' ')
  const known = points.map((item, index) => {
    if (item.value === null) return null
    const ratio = Math.max(0, Math.min(100, item.value)) / 100
    return spot(index, ratio)
  })
  const allKnown = known.length > 0 && known.every((point) => point)
  const segments: string[] = []
  if (!allKnown) {
    for (let i = 0; i < points.length; i += 1) {
      const a = known[i]
      const b = known[(i + 1) % points.length]
      if (!a || !b) continue
      segments.push(`${a[0]},${a[1]} ${b[0]},${b[1]}`)
    }
  }
  return (
    <View className='radar-chart'>
      <svg viewBox='0 0 340 336' role='img' aria-label='六星图'>
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon key={scale} points={ring(scale)} fill='none' stroke='var(--line)' strokeWidth='1' />
        ))}
        {points.map((item, index) => {
          const [x, y] = spot(index, 1)
          return <line key={item.axis} x1={cx} y1={cy} x2={x} y2={y} stroke='var(--line)' strokeWidth='1' />
        })}
        {allKnown ? (
          <polygon points={known.map((point) => point!.join(',')).join(' ')} fill='var(--purple)' fillOpacity='0.14' stroke='var(--purple)' strokeWidth='2' strokeLinejoin='round' />
        ) : null}
        {segments.map((line) => <polyline key={line} points={line} fill='none' stroke='var(--purple)' strokeWidth='2' />)}
        {known.map((point, index) => point ? <circle key={points[index].axis} cx={point[0]} cy={point[1]} r='3.5' fill='var(--purple)' stroke='#fff' strokeWidth='1.5' /> : null)}
        {points.map((item, index) => {
          const theta = (index * 2 * Math.PI) / count
          const sin = Math.sin(theta)
          const cos = Math.cos(theta)
          const [x, y] = spot(index, 1)
          const lx = x + sin * 26
          const ly = y - cos * 22
          const anchor = sin > 0.35 ? 'start' : sin < -0.35 ? 'end' : 'middle'
          const dy = cos > 0.5 ? -10 : cos < -0.5 ? 8 : -4
          const name = axisName[item.axis] || item.axis
          const value = item.value === null ? '待补充' : String(Math.round(item.value))
          return (
            <text key={item.axis} x={lx} y={ly + dy} textAnchor={anchor} fontSize='12' fill='var(--ink)'>
              <tspan x={lx}>{name}</tspan>
              <tspan x={lx} dy='14' fill={item.value === null ? 'var(--muted)' : 'var(--purple)'} fontWeight='700'>{value}</tspan>
            </text>
          )
        })}
      </svg>
    </View>
  )
}
