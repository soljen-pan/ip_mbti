import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from './Icon'

const tabs = [
  { key: 'home', text: '测一测', url: '/pages/home/index', icon: 'test' },
  { key: 'partners', text: '找搭子', url: '/pages/partners/index', icon: 'partner' },
  { key: 'themes', text: '找主题', url: '/pages/themes/index', icon: 'theme' },
  { key: 'mine', text: '我的', url: '/pages/mine/index', icon: 'my' },
]

export default function TabBar({ current }: { current: string }) {
  return (
    <View className='tabbar'>
      <View className='tabbar-star' />
      <View className='tabbar-splat tabbar-splat-a' />
      <View className='tabbar-drip tabbar-drip-a' />
      <View className='tabbar-drip tabbar-drip-b' />
      <View className='tabbar-drip tabbar-drip-c' />
      {tabs.map((tab) => {
        const on = current === tab.key
        return (
          <View
            key={tab.key}
            className={on ? 'tab tab-on' : 'tab'}
            onClick={() => {
              if (!on) Taro.redirectTo({ url: tab.url })
            }}
          >
            <Icon name={tab.icon} size={22} stroke={2.6} />
            <Text className='tab-label'>{tab.text}</Text>
          </View>
        )
      })}
    </View>
  )
}
