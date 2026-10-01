import { View } from '@tarojs/components'
import './ghost.scss'

export default function Ghost({ compact = false }: { compact?: boolean }) {
  return (
    <View className={compact ? 'ghost ghost-compact' : 'ghost'} aria-role='img'>
      <View className='ghost-script' />
      <View className='ghost-body'>
        <View className='ghost-badge'>NPC</View>
      </View>
      <View className='ghost-head'>
        <View className='ghost-eye ghost-eye-l' />
        <View className='ghost-eye ghost-eye-r' />
        <View className='ghost-mouth' />
      </View>
      <View className='ghost-leg ghost-leg-l' />
      <View className='ghost-leg ghost-leg-r' />
    </View>
  )
}
