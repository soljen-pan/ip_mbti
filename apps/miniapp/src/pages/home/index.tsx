import { Image, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import TabBar from '../../components/TabBar'
import Icon from '../../components/Icon'
import FolderStage from '../../components/FolderStage'
import wordmark from '../../assets/ui/ip-wordmark-transparent.png'
import { api, loadReport, loadSession } from '../../api'
import { personaAvatar } from '../../data/avatars'

type Draft = {
  id: string
  mode: 'base' | 'branch' | 'report'
  label: string
  reportId: string
  answered: number
  total: number
}

export default function Home() {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [persona, setPersona] = useState('')

  useDidShow(() => {
    const id = loadSession()
    if (!id) {
      setDraft(null)
      return
    }
    Promise.all([api.plan(id), api.assessment(id)]).then(([plan, item]) => {
      const reportId = item.report_id || loadReport(id)
      const done = Boolean(reportId) || (plan.ready_to_submit && !plan.next)
      const inBase = Boolean(plan.next && !plan.next.branch)
      const mode = done ? 'report' : inBase ? 'base' : 'branch'
      const label = done ? '查看档案' : '继续测试'
      setDraft({ id, mode, label, reportId, answered: plan.base_answered, total: plan.base_total })
      if (!reportId) {
        setPersona('')
        return
      }
      api.report(reportId).then((report) => {
        setPersona(personaAvatar(report.full_type, item.profile?.gender, report.courage.code, report.courage.group))
      }).catch(() => setPersona(''))
    }).catch(() => setDraft(null))
  })

  function openDraft() {
    if (!draft) return
    if (draft.mode === 'report' && draft.reportId) {
      Taro.navigateTo({ url: `/pages/result/index?id=${draft.reportId}` })
      return
    }
    Taro.navigateTo({ url: `/pages/quiz/index?id=${draft.id}` })
  }

  async function restart() {
    const res = await Taro.showModal({
      title: '重新开始',
      content: '已保存的那份还在。再开一份不会改掉它，也不会改写旧答案。',
      confirmText: '再开一份',
      cancelText: '留下',
    })
    if (res.confirm) Taro.navigateTo({ url: '/pages/profile/index' })
  }

  const guest = !draft
  const progressing = draft && draft.mode !== 'report'
  const done = draft?.mode === 'report'
  const total = draft?.total || 60

  return (
    <View className='page page-tab page-home'>
      <View className='brand-logo'>
        <Image className='brand-wordmark' src={wordmark} mode='aspectFit' />
      </View>
      <View className='home-top'>
        <View className='home-brand'>入戏档案</View>
        {guest ? (
          <View className='home-login' onClick={() => Taro.navigateTo({ url: '/pages/gate/index' })}>登录</View>
        ) : (
          <View className='home-login' onClick={() => Taro.navigateTo({ url: '/pages/profile/index' })}>编辑资料</View>
        )}
      </View>
      <View className='profile-kicker'>PLAYER FIELD GUIDE</View>
      <View className='profile-title'>{done ? '这份档案已经记下。' : progressing ? '你的档案，正在成形。' : '你的入戏人格，是什么？'}</View>
      <View className='profile-desc'>{done ? '查看的是本机已保存的结果，不是一份新人格。' : progressing ? '每一次选择，都更靠近自己的线索。' : '每个人心里，都住着一个会演戏的自己。'}</View>
      {guest ? (
        <FolderStage variant='locked' stamp='未解锁档案' seal='待探索' caption={`${total} 基础题位以服务端题库为准 / 最多 100 题`} />
      ) : null}
      {progressing && draft ? (
        <FolderStage
          variant='progress'
          stamp='进行中'
          seal='本机'
          count={String(draft.answered).padStart(2, '0')}
          caption='男孩与女孩一起寻找线索'
        />
      ) : null}
      {done ? <FolderStage variant='done' persona={persona} stamp='已有结果' seal='已建档' caption={persona ? '这份档案对应的形象' : '形象待接入'} /> : null}
      {progressing && draft ? (
        <View className='home-progress'>
          <View className='home-progress-count'>{draft.answered} / {draft.total}</View>
          <View className='profile-card-note'>{draft.mode === 'branch' ? '基础题已处理 · 补充题另计' : '基础题已处理 · 本机草稿'}</View>
          <View className='rail'><View className='rail-fill' style={{ width: `${Math.round((draft.answered / Math.max(total, 1)) * 100)}%` }} /></View>
        </View>
      ) : null}
      <View className='btn btn-primary home-go' onClick={draft ? openDraft : () => Taro.navigateTo({ url: '/pages/profile/index' })}>
        {draft ? `${draft.label} →` : '开始探索 →'}
      </View>
      <View className='home-hint'>{guest ? '可先测试，登录后才能同步档案。微信登录还没接通。' : progressing ? '按需开启补充情境，解锁更完整的你。' : '再次测试会另开一份，不覆盖这份结果。'}</View>
      {progressing ? <View className='link home-restart' onClick={restart}>重新开始</View> : null}
      {guest ? (
        <View className='home-shortcuts'>
          <View className='home-shortcut' onClick={() => Taro.navigateTo({ url: '/pages/catalog/index' })}>
            <Icon name='atlas' size={22} />
            <View className='home-shortcut-text'>角色图鉴</View>
            <View className='entry-go'>›</View>
          </View>
          <View className='home-shortcut' onClick={() => Taro.redirectTo({ url: '/pages/partners/index' })}>
            <Icon name='partner' size={22} />
            <View className='home-shortcut-text'>找搭子</View>
            <View className='entry-go'>›</View>
          </View>
        </View>
      ) : (
        <View className='mine-menu home-catalog'>
          <View className='mine-menu-item mine-menu-last' onClick={() => Taro.navigateTo({ url: '/pages/catalog/index' })}>
            <Icon name='atlas' size={22} />
            <View className='mine-menu-copy'>
              <View className='mine-menu-text'>逛逛角色图鉴</View>
              <View className='profile-card-note'>发现更多有趣的入戏人格</View>
            </View>
            <View className='entry-go'>›</View>
          </View>
        </View>
      )}
      <TabBar current='home' />
    </View>
  )
}
