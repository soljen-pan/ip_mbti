import { View } from '@tarojs/components'
import './sketch.scss'
import type { Archetype } from '../data/catalog'

type Mood = 'calm' | 'act' | 'scream' | 'quiet' | 'neutral'

export function ArtSlot({ label = '角色绘制中' }: { label?: string }) {
  return (
    <View className='art-slot'>
      <View className='art-slot-mark'>{label}</View>
    </View>
  )
}

export function Sketch({
  item,
  size = 'card',
  pose = 'r',
  mood = 'neutral',
}: {
  item?: Pick<Archetype, 'face' | 'eyes' | 'wash' | 'thing'>
  size?: 'card' | 'mini' | 'corner' | 'empty'
  pose?: 'k' | 'r'
  mood?: Mood
}) {
  const face = item?.face || 'round'
  const eyes = item?.eyes || 'still'
  const wash = item?.wash || 'purple'
  const thing = item?.thing || 'ticket'
  return (
    <View className={`npc npc-${size} npc-face-${face} npc-eyes-${eyes} npc-wash-${wash} npc-thing-${thing} npc-pose-${pose} npc-mood-${mood}`}>
      <View className='npc-head'>
        <View className='npc-eye npc-eye-l' />
        <View className='npc-eye npc-eye-r' />
        <View className='npc-mouth' />
      </View>
      <View className='npc-body'>
        <View className='npc-arm npc-arm-l' />
        <View className='npc-arm npc-arm-r' />
      </View>
      <View className='npc-leg npc-leg-l' />
      <View className='npc-leg npc-leg-r' />
      <View className='npc-thing' />
      {size === 'empty' ? <View className='npc-tickets' /> : null}
    </View>
  )
}
