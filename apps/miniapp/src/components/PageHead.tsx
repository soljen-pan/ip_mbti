import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Icon from './Icon'

export default function PageHead({ title, onBack, extra, home = true, onHome }: { title: string; onBack?: () => void; extra?: string; home?: boolean; onHome?: () => void }) {
  function back() {
    if (onBack) {
      onBack()
      return
    }
    if (Taro.getCurrentPages().length > 1) Taro.navigateBack()
    else Taro.reLaunch({ url: '/pages/home/index' })
  }

  function goHome() {
    if (onHome) {
      onHome()
      return
    }
    Taro.reLaunch({ url: '/pages/home/index' })
  }

  return (
    <View className='page-head'>
      <View className='page-head-btn' onClick={back}><Icon name='back' size={22} /></View>
      <View className='page-head-title'>{title}</View>
      {extra ? <View className='page-head-extra' onClick={goHome}>{extra}</View> : null}
      {home ? (
        <View className='page-head-btn' onClick={goHome}>
          <Icon name='home' size={22} />
        </View>
      ) : null}
    </View>
  )
}
