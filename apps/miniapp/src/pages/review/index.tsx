import { View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import PageHead from '../../components/PageHead'
import { api, Question } from '../../api'

type Group = { id: string; label: string; ids: string[]; done: number }

function groupOf(q: Question) {
  if (q.branch) return q.branch
  if (q.id >= 'B041' && q.id <= 'B050') return 'courage'
  if (q.id >= 'E001' && q.id <= 'E004') return 'emotion'
  if (q.id >= 'B051' && q.id <= 'B056') return 'play'
  return 'base'
}

const labels: Record<string, string> = {
  base: '基础测试',
  courage: '胆量',
  emotion: '剧情情绪',
  play: '玩法',
  C: '胆量澄清',
  S: '刺激安排',
  N: '叙事节奏',
  T: '组队陪同',
  P: '临界说明',
}

export default function ReviewPage() {
  const id = useRouter().params.id || ''
  const [groups, setGroups] = useState<Group[]>([])
  const [error, setError] = useState('')
  const [baseDone, setBaseDone] = useState(0)
  const [baseTotal, setBaseTotal] = useState(60)
  const [unknownCount, setUnknownCount] = useState(0)
  const [pendingNeed, setPendingNeed] = useState(0)
  const [pendingOpt, setPendingOpt] = useState(0)

  useEffect(() => {
    Promise.all([api.questions(), api.assessment(id), api.plan(id)]).then(([sheet, item, plan]) => {
      const answers = item.answers || {}
      const buckets = new Map<string, string[]>()
      sheet.questions.forEach((q) => {
        const key = groupOf(q)
        const list = buckets.get(key) || []
        list.push(q.id)
        buckets.set(key, list)
      })
      const order = ['base', 'courage', 'emotion', 'play', 'C', 'S', 'N', 'T', 'P']
      const next = order.filter((key) => buckets.has(key)).map((key) => {
        const ids = buckets.get(key) || []
        const done = ids.filter((qid) => {
          const rec = answers[qid]
          return rec && rec.status !== 'superseded' && (rec.state === 'answered' || rec.state === 'unknown')
        }).length
        return { id: key, label: labels[key] || key, ids, done }
      })
      setGroups(next)
      setBaseDone(plan.base_answered)
      setBaseTotal(plan.base_total)
      const values = Object.values(answers)
      setUnknownCount(values.filter((rec) => rec.status !== 'superseded' && rec.state === 'unknown').length)
      const need = plan.branches.filter((item) => item.required || item.branch === 'C').reduce((sum, item) => sum + Math.max(0, item.total - item.answered), 0)
      const opt = plan.branches.filter((item) => !(item.required || item.branch === 'C')).reduce((sum, item) => sum + Math.max(0, item.total - item.answered), 0)
      setPendingNeed(need)
      setPendingOpt(opt)
    }).catch(() => setError('答卷暂时对不上'))
  }, [id])

  const open = groups.filter((item) => item.done > 0).length
  const pending = groups.filter((item) => item.done < item.ids.length).length

  const finished = groups.filter((item) => item.done === item.ids.length && item.ids.length > 0).length

  return (
    <View className='page'>
      <PageHead title='答卷检查' />
      <View className='profile-kicker'>REVIEW</View>
      <View className='profile-title'>检查你的答卷</View>
      <View className='profile-desc'>基础进度 {baseDone}/{baseTotal}。已完成、未知、待补、可选分开计，不相加成完成率。</View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-card-title'>已有作答</View>
          <View className='sheet-card-copy'>基础已完成 {baseDone}/{baseTotal}</View>
        </View>
        <View className='sheet-card'>
          <View className='sheet-card-title'>无法判断</View>
          <View className='sheet-card-copy'>{unknownCount} 题标成未知，不当成居中</View>
        </View>
        <View className='sheet-card'>
          <View className='sheet-card-title'>待补澄清</View>
          <View className='sheet-card-copy'>还差 {pendingNeed} 题。这不是问卷页的进度分数</View>
        </View>
        <View className='sheet-card'>
          <View className='sheet-card-title'>可选深化</View>
          <View className='sheet-card-copy'>还差 {pendingOpt} 题，可以稍后</View>
        </View>
      </View>
      {error ? <View className='error'>{error}</View> : null}

      <View className='sheet-menu'>
        {groups.map((item) => (
          <View
            key={item.id}
            className='sheet-menu-item'
            onClick={() => {
              const target = item.ids[0]
              if (target) Taro.navigateTo({ url: `/pages/quiz/index?id=${id}&at=${target}` })
            }}
          >
            <View className='sheet-menu-main'>
              <View className='sheet-card-title'>{item.label}</View>
              <View className='sheet-card-copy'>{item.done}/{item.ids.length} 已有记录</View>
            </View>
            <View className='entry-go'>›</View>
          </View>
        ))}
      </View>

      <View className='sheet-kvs'>
        <View className='sheet-kv'><View className='sheet-kv-num'>{finished}</View><View className='sheet-card-copy'>已完成模块</View></View>
        <View className='sheet-kv'><View className='sheet-kv-num'>{open}</View><View className='sheet-card-copy'>有记录</View></View>
        <View className='sheet-kv'><View className='sheet-kv-num'>{pending}</View><View className='sheet-card-copy'>还没答完</View></View>
      </View>
      <View className='btn btn-ghost' onClick={() => Taro.reLaunch({ url: '/pages/home/index' })}>返回首页</View>
      <View className='btn btn-primary' onClick={() => Taro.navigateTo({ url: `/pages/quiz/index?id=${id}` })}>继续作答</View>
    </View>
  )
}
