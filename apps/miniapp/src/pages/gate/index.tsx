import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import PageHead from '../../components/PageHead'

export default function GatePage() {
  const [failed, setFailed] = useState(false)

  function login() {
    setFailed(true)
    Taro.showToast({ title: '微信登录还没接通', icon: 'none' })
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
      <View className='btn btn-primary gate-login' onClick={login}>微信快捷登录</View>
      {failed ? <View className='error'>微信登录还没接通，这次不会写成已登录。</View> : null}
    </View>
  )
}
