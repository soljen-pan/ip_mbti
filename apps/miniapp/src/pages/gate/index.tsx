import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import PageHead from '../../components/PageHead'
import { ensureMockReport, writeMockLogin } from '../../dev/mockSession'

export default function GatePage() {
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  function login() {
    setFailed(true)
    setError('')
    Taro.showToast({ title: '微信登录还没接通', icon: 'none' })
  }

  async function mock() {
    if (busy) return
    setBusy(true)
    setFailed(false)
    setError('')
    setStep(0)
    writeMockLogin()
    try {
      const reportId = await ensureMockReport(setStep)
      Taro.redirectTo({ url: `/pages/result/index?id=${reportId}` })
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setError(message || '本地测试账号已写入，报告这次没生成。')
      setBusy(false)
    }
  }

  return (
    <View className='page gate-page'>
      <PageHead
        title='登录'
        home={false}
        onBack={() => {
          if (Taro.getCurrentPages().length > 1) Taro.navigateBack()
        }}
      />
      <View className='profile-kicker'>入戏档案</View>
      <View className='profile-title'>微信快捷登录</View>
      <View className={busy ? 'btn btn-primary gate-login btn-disabled' : 'btn btn-primary gate-login'} onClick={login}>微信快捷登录</View>
      {failed ? <View className='error'>微信登录还没接通，这次不会写成已登录。</View> : null}
      <View className={busy ? 'btn btn-ghost gate-mock btn-disabled' : 'btn btn-ghost gate-mock'} onClick={mock}>
        {busy ? `正在准备本地报告 ${step}` : '本地测试登录'}
      </View>
      <View className='profile-hint gate-note'>账号还没有结果时，才写入一份本地测试报告。已经测出来的结果会直接打开，不会重算，也不会改昵称和头像。不是微信登录。</View>
      {error ? <View className='error'>{error}</View> : null}
    </View>
  )
}
