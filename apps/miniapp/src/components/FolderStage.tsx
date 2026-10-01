import { Image, View } from '@tarojs/components'
import cream from '../assets/ui/folder-cream.png'
import blue from '../assets/ui/folder-blue.svg'
import lockedDuo from '../assets/ui/home-locked-duo.png'
import progressDuo from '../assets/ui/home-progress-duo.png'

type Variant = 'locked' | 'progress' | 'done'

export default function FolderStage({
  variant,
  stamp,
  seal,
  caption,
  count,
  persona,
}: {
  variant: Variant
  stamp: string
  seal: string
  caption?: string
  count?: string
  persona?: string
}) {
  const bg = variant === 'progress' ? blue : cream
  const art = persona || (variant === 'progress' ? progressDuo : variant === 'locked' ? lockedDuo : '')
  return (
    <View className='folder-stage'>
      <Image className='folder-bg' src={bg} mode='aspectFill' />
      <View className='folder-stamp'>{stamp}</View>
      {count ? <View className='folder-count'>{count}</View> : null}
      {art ? (
        <View className='folder-art-wrap'>
          <Image className='folder-art' src={art} mode='aspectFit' />
        </View>
      ) : <View className='folder-empty'>形象待接入</View>}
      <View className='folder-seal'>{seal}</View>
      {caption ? <View className='folder-caption'>{caption}</View> : null}
    </View>
  )
}
