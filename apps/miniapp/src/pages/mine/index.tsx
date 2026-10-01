import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TabBar from '../../components/TabBar'
import Icon from '../../components/Icon'
import wordmark from '../../assets/ui/ip-wordmark-transparent.png'
import { loadReport, loadSession } from '../../api'

export default function MinePage() {
  const nickname = String(Taro.getStorageSync('ruxi-nickname') || '')
  const loggedIn = Taro.getStorageSync('ruxi-logged-in') === '1'
  const saved = loggedIn ? loadSession() : ''
  const reportId = loggedIn && saved ? loadReport(saved) : ''

  return (
    <View className='page page-tab mine-page'>
      <View className='brand-logo'>
        <Image className='brand-wordmark' src={wordmark} mode='aspectFit' />
      </View>
      <View className='profile-kicker'>PLAYER SPACE</View>
      <View className='profile-title'>我的</View>
      <View className='profile-desc'>{loggedIn ? '账户、图鉴和档案都在这里。' : '图鉴和玩法可以先看。'}</View>

      {loggedIn ? (
        <View className='mine-hero'>
          <View className='avatar'>{nickname.slice(0, 1)}</View>
          <View className='mine-hero-copy'>
            <View className='profile-card-title'>{nickname}</View>
            <View className='profile-card-note'>这是你填写的称呼，不是微信昵称，也不代替人格角色。</View>
            <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/profile/index' })}>编辑头像与昵称</View>
          </View>
        </View>
      ) : (
        <View className='mine-hero mine-hero-guest'>
          <View className='avatar'>入</View>
          <View className='mine-guest-title'>登录你的入戏档案</View>
          <View className='profile-card-note'>登录后才能同步档案、管理队伍与预约。</View>
          <View className='btn btn-primary' onClick={() => Taro.navigateTo({ url: '/pages/gate/index' })}>去登录</View>
          <View className='profile-hint'>登录与头像昵称是两步。微信登录还没接通，不会写成已登录。</View>
        </View>
      )}

      <View className='mine-menu'>
        <View className='mine-menu-item' onClick={() => Taro.navigateTo({ url: '/pages/catalog/index' })}>
          <Icon name='atlas' size={22} />
          <View className='mine-menu-text'>角色图鉴</View>
          <View className='entry-go'>›</View>
        </View>
        <View className='mine-menu-item' onClick={() => Taro.navigateTo({ url: '/pages/guide/index' })}>
          <Icon name='theme' size={22} />
          <View className='mine-menu-text'>玩法指南</View>
          <View className='entry-go'>›</View>
        </View>
        <View className='mine-menu-item mine-menu-last' onClick={() => Taro.navigateTo({ url: '/pages/gate/index' })}>
          <Icon name='privacy' size={22} />
          <View className='mine-menu-text'>隐私与设置</View>
          <View className='entry-go'>›</View>
        </View>
      </View>

      {loggedIn ? (
        <View className='mine-section'>
          <View className='profile-label'>我的档案</View>
          {reportId ? (
            <>
              <View className='profile-card-note'>本机已有一份保存的结果。</View>
              <View className='link' onClick={() => Taro.navigateTo({ url: `/pages/result/index?id=${reportId}` })}>查看已保存的结果 ›</View>
            </>
          ) : saved ? (
            <>
              <View className='profile-card-note'>本机还有未完成的答卷。</View>
              <View className='link' onClick={() => Taro.navigateTo({ url: `/pages/quiz/index?id=${saved}` })}>继续本机测试 ›</View>
            </>
          ) : (
            <View className='profile-card-note'>登录后还没有同步的测试与报告。</View>
          )}
        </View>
      ) : null}

      <TabBar current='mine' />
    </View>
  )
}
