import { Text, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import PageHead from '../../components/PageHead'
import { api, explainError, Plan, Question, saveReport } from '../../api'

const moduleLabel: Record<string, string> = {
  preference: '情境选择',
  engagement: '投入',
  courage: '胆量',
  emotion: '情绪',
  narrative: '叙事',
  play: '玩法',
  branch: '补充',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function QuizPage() {
  const id = useRouter().params.id || ''
  const at = useRouter().params.at || ''
  const [plan, setPlan] = useState<Plan | null>(null)
  const [bank, setBank] = useState<Record<string, Question>>({})
  const [order, setOrder] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, { state: string; likert?: number; enum?: string }>>({})
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | number | null>(null)
  const [unknown, setUnknown] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [explain, setExplain] = useState(false)
  const [ackBranch, setAckBranch] = useState('')

  function fill(qid: string, map = answers) {
    const rec = map[qid]
    setDirty(false)
    if (!rec) {
      setPicked(null)
      setUnknown(false)
      return
    }
    if (rec.state === 'unknown') {
      setUnknown(true)
      setPicked(null)
      return
    }
    setUnknown(false)
    if (typeof rec.likert === 'number') setPicked(rec.likert)
    else if (rec.enum) setPicked(rec.enum)
    else setPicked(null)
  }

  async function load() {
    const [next, sheet, item] = await Promise.all([api.plan(id), api.questions(), api.assessment(id)])
    const map: Record<string, Question> = {}
    sheet.questions.forEach((q) => { map[q.id] = q })
    setBank(map)
    setOrder(item.base_order || [])
    setAnswers(item.answers || {})
    setPlan(next)
    if (at && map[at]) {
      setReviewId(at)
      fill(at, item.answers || {})
    }
    if (next.ready_to_submit && !next.next && !at) {
      const report = await api.submit(id, next.revision)
      saveReport(id, report.id)
      Taro.redirectTo({ url: `/pages/result/index?id=${report.id}` })
    }
  }

  useEffect(() => {
    load().catch((err: unknown) => setError(explainError(err, '题目暂时打不开')))
  }, [id])

  const live = plan?.next || null
  const current = reviewId && bank[reviewId] ? bank[reviewId] : live
  const ready = unknown || picked !== null

  function choose(value: string | number) {
    setPicked(value)
    setUnknown(false)
    setDirty(true)
    setError('')
  }

  async function commit() {
    if (!plan || !current || busy) return
    if (!ready) return
    setBusy(true)
    setError('')
    try {
      const next = await api.answer(id, plan.revision, {
        id: current.id,
        state: unknown ? 'unknown' : 'answered',
        value: unknown ? null : picked,
      })
      const item = await api.assessment(id)
      setAnswers(item.answers || {})
      setOrder(item.base_order || order)
      setPlan(next)
      setDirty(false)
      if (reviewId) {
        const idx = (item.base_order || []).indexOf(reviewId)
        const following = item.base_order?.[idx + 1]
        const liveId = next.next?.id
        if (following && following !== liveId) {
          setReviewId(following)
          fill(following, item.answers || {})
        } else {
          setReviewId(null)
          setPicked(null)
          setUnknown(false)
        }
      } else {
        setPicked(null)
        setUnknown(false)
      }
      if (!reviewId && next.ready_to_submit && !next.next) {
        const report = await api.submit(id, next.revision)
        saveReport(id, report.id)
        Taro.redirectTo({ url: `/pages/result/index?id=${report.id}` })
      }
    } catch (err) {
      setError(explainError(err, '没有保存成功，答案还在这页'))
    } finally {
      setBusy(false)
    }
  }

  function goPrev() {
    const currentId = reviewId || live?.id || ''
    const idx = order.indexOf(currentId)
    const target = idx > 0 ? order[idx - 1] : idx < 0 ? order[order.length - 1] : ''
    if (!target || !bank[target]) return
    setReviewId(target)
    fill(target)
    setError('')
  }

  async function leave() {
    if (dirty) {
      const res = await Taro.showModal({
        title: '这题还没保存',
        content: '点下一题才会写入。现在离开的话，这一题的新选择不会保留。',
        confirmText: '仍然离开',
        cancelText: '继续答',
      })
      if (!res.confirm) return
    }
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  async function deferCurrent() {
    const branch = live?.branch
    if (!plan || reviewId || !branch || branch === 'C') return
    try {
      const next = await api.defer(id, plan.revision, branch)
      setPlan(next)
      setPicked(null)
      setUnknown(false)
      setDirty(false)
    } catch (err) {
      setError(explainError(err, '没能延后这条补充'))
    }
  }

  if (!plan || !current) {
    return (
      <View className='page quiz-page'>
        <PageHead title='入戏问卷' onBack={leave} onHome={leave} />
        <View className={error ? 'error' : 'profile-desc'}>{error || '正在准备题目'}</View>
      </View>
    )
  }

  const baseIndex = order.indexOf(current.id)
  const qno = baseIndex >= 0 ? baseIndex + 1 : null
  const branch = plan.branches.find((item) => item.branch === current.branch)
  const atFirst = order[0] === current.id
  const width = `${Math.round((plan.base_answered / Math.max(plan.base_total, 1)) * 100)}%`
  const branchCode = current.branch || ''
  const prefaceSeen = branchCode ? Boolean(Taro.getStorageSync(`ruxi-preface-${id}-${branchCode}`)) : false
  const showPreface = !reviewId && Boolean(plan.preface) && Boolean(branchCode) && ackBranch !== branchCode && !prefaceSeen

  if (showPreface) {
    return (
      <View className='page quiz-page'>
        <PageHead title='分支补题' onBack={leave} onHome={leave} />
        <View className='profile-kicker'>BRANCH</View>
        <View className='profile-title'>选择你的下一步探索</View>
        <View className='sheet-tags'>
          <View className='catalog-tag'>基础 {plan.base_answered}/{plan.base_total}</View>
          {plan.base_answered === plan.base_total ? <View className='catalog-tag'>基础题已完成</View> : null}
        </View>
        <View className='profile-desc'>{plan.preface}</View>
        <View className='sheet-stack'>
          <View className='sheet-card sheet-card-wait'>
            <View className='sheet-card-title'>需要澄清</View>
            <View className='sheet-card-copy'>{plan.branches.filter((item) => item.required || item.branch === 'C').map((item) => `${item.label} ${item.answered}/${item.total}`).join(' · ') || '当前没有必须先答的澄清。'}</View>
          </View>
          <View className='sheet-card'>
            <View className='sheet-card-title'>可选深化</View>
            <View className='sheet-card-copy'>{plan.branches.filter((item) => !(item.required || item.branch === 'C')).map((item) => `${item.label} ${item.answered}/${item.total}${item.deferred ? ' · 已延后' : ''}`).join(' · ') || '当前没有可选补充。'}</View>
          </View>
        </View>
        <View className='sheet-kvs'>
          <View className='sheet-kv'><View className='sheet-card-title'>基础测试</View></View>
          <View className='sheet-kv'><View className='sheet-card-title'>分支补题</View></View>
          <View className='sheet-kv'><View className='sheet-card-title'>生成档案</View></View>
        </View>
        <View className='action-row'>
          <View className='btn btn-ghost' onClick={branchCode === 'C' ? () => setError('胆量澄清还不能跳过') : deferCurrent}>稍后再来</View>
          <View className='btn btn-primary' onClick={() => { Taro.setStorageSync(`ruxi-preface-${id}-${branchCode}`, '1'); setAckBranch(branchCode) }}>开始补题 →</View>
        </View>
        {error ? <View className='error'>{error}</View> : null}
      </View>
    )
  }

  return (
    <View className='page quiz-page'>
      <PageHead title='入戏问卷' onBack={leave} onHome={leave} />
      <View className='sheet-card quiz-progress-card'>
        <View className='quiz-sheet-row'>
          <View className='sheet-card-title'>{qno ? `已处理 ${plan.base_answered} / ${plan.base_total}` : `补充 ${branch?.answered || 0} / ${branch?.total || 0}`}</View>
          <View className='quiz-exit' onClick={leave}>保存退出</View>
        </View>
        <View className='rail quiz-rail'><View className='rail-fill quiz-rail-fill' style={{ width }} /></View>
        <View className='sheet-card-copy'>{qno ? `基础题 · 当前第 ${pad(qno)} 题` : `补充题另计。基础已处理 ${plan.base_answered}/${plan.base_total}`}</View>
      </View>
      {reviewId ? <View className='quiz-note'>正在回看。改完后点下一题才会保存。</View> : null}
      <View className='quiz-stem'>{current.text}</View>
      {current.options.filter((item) => item.value !== 'unknown').map((item) => {
        const on = !unknown && picked === item.value
        return (
          <View key={String(item.value)} className={on ? 'quiz-choice quiz-choice-on' : 'quiz-choice'} onClick={() => choose(item.value)}>
            <View className={on ? 'mark mark-on' : 'mark'} />
            <Text>{item.label}</Text>
          </View>
        )
      })}
      <View className='quiz-split'>
        <View className='split-line' />
        <Text>无法判断不是居中</Text>
        <Text className='quiz-help' onClick={() => setExplain(!explain)}>?</Text>
      </View>
      {explain ? <View className='quiz-dirty'>点它不会被当成「居中 / 看情况」。</View> : null}
      <View className={unknown ? 'quiz-choice quiz-choice-on' : 'quiz-choice'} onClick={() => { setUnknown(true); setPicked(null); setDirty(true) }}>
        <View className={unknown ? 'mark mark-on' : 'mark'} />
        <Text>无法判断</Text>
      </View>
      {error ? <View className='error'>{error}</View> : null}
      {!reviewId && current.branch && current.branch !== 'C' ? (
        <View className='link' onClick={deferCurrent}>稍后完善这条补充</View>
      ) : null}
      <View className='quiz-dock'>
        {!ready ? <View className='quiz-hint'>先选一项，再去下一题。</View> : null}
        <View className='quiz-actions'>
          <View className={atFirst ? 'btn btn-ghost btn-disabled' : 'btn btn-ghost'} onClick={atFirst ? undefined : goPrev}>← 上一题</View>
          <View className={ready && !busy ? 'btn btn-primary' : 'btn btn-primary btn-disabled'} onClick={ready ? commit : undefined}>
            {busy ? '保存中' : '下一题 →'}
          </View>
        </View>
      </View>
    </View>
  )
}
