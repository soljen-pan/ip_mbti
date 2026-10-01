import { Image, View } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState } from 'react'
import PageHead from '../../components/PageHead'
import { api, Report } from '../../api'
import { personaAvatar } from '../../data/avatars'
import { POSTER_HEIGHT, POSTER_WIDTH, renderMomentsPoster, shareEntryUrl } from './poster'

const courageName: Record<string, string> = {
  'T-G': '巨坦',
  'T-M': '微坦',
  'N-S': '尖叫奶',
  'N-Q': '哑巴奶',
}

export default function SharePage() {
  const reportId = useRouter().params.id || ''
  const [report, setReport] = useState<Report | null>(null)
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [poster, setPoster] = useState('')
  const [busy, setBusy] = useState(false)
  const nickname = String(Taro.getStorageSync('ruxi-nickname') || '')
  const avatar = String(Taro.getStorageSync('ruxi-avatar') || '')

  useEffect(() => {
    api.report(reportId).then((item) => {
      setReport(item)
      if (!item.assessment_id) return
      api.assessment(item.assessment_id).then((sheet) => setGender(sheet.profile?.gender || '')).catch(() => setGender(''))
    }).catch(() => setError('这份结果暂时打不开'))
  }, [reportId])

  if (!report) {
    return <View className='page'><PageHead title='分享' /><View className='profile-desc'>{error || '正在整理预览'}</View></View>
  }

  const pending = report.courage.status !== 'resolved' || !report.courage.code
  const courage = pending ? '坦奶待补答' : courageName[report.courage.code || ''] || '坦奶待补答'
  const art = personaAvatar(report.full_type, gender, report.courage.code, report.courage.group)
  const entry = shareEntryUrl()

  const make = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const url = await renderMomentsPoster({
        report,
        gender,
        nickname,
        avatarUrl: avatar,
        personaUrl: art,
        entryUrl: entry,
      })
      setPoster(url)
    } catch {
      setError('图片没生成。头像或角色图如果打不开，可以先去掉头像再试。')
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!poster) return
    const link = document.createElement('a')
    link.href = poster
    link.download = 'ruxi-moments.jpg'
    link.click()
  }

  return (
    <View className='page page-share'>
      <PageHead title='分享' />
      <View className='profile-kicker'>MOMENTS</View>
      <View className='profile-title'>朋友圈图片</View>
      <View className='profile-desc'>尺寸 {POSTER_WIDTH}×{POSTER_HEIGHT}。朋友圈单图长边会压到 1280，这个比例不会裁掉顶部水印和底部二维码。</View>
      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-card-title'>{report.type_name || '部分偏好待了解'}</View>
          <View className='sheet-card-copy'>{report.full_type || '部分偏好待了解'} · {courage}</View>
          <View className='sheet-card-copy'>昵称：{nickname || '未设置昵称'}{avatar ? '' : ' · 还没有头像，图上会用昵称首字'}</View>
          {art ? <Image className='share-art' src={art} mode='aspectFit' /> : <View className='sheet-card-copy'>形象待接入</View>}
        </View>
        {poster ? <Image className='moments-preview' src={poster} mode='widthFix' /> : null}
      </View>
      {error ? <View className='profile-desc'>{error}</View> : null}
      <View className='action-row'>
        <View className={poster ? 'btn btn-ghost' : 'btn btn-ghost btn-disabled'} onClick={save}>保存图片</View>
        <View className={busy ? 'btn btn-primary btn-disabled' : 'btn btn-primary'} onClick={make}>{busy ? '正在生成' : '生成朋友圈图片'}</View>
      </View>
      <View className='sheet-card-copy'>二维码打开当前站点首页，登录后可以开始测试。正式微信小程序码要等小程序发布后才能换上。</View>
    </View>
  )
}
