import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TabBar from '../../components/TabBar'

const rows = [
  { id: 'mix', title: '坦 + 奶', body: '有互补可能，陪同还要本人确认。坦不自动带队。' },
  { id: 'tt', title: '坦 + 坦', body: '可以轮流接任务。' },
  { id: 'nn', title: '奶 + 奶', body: '门口礼让三百回合：您先，您先。后面跟低恐路线和陪同建议。' },
]

export default function PartnersPage() {
  return (
    <View className='page page-tab'>
      <View className='profile-kicker'>FIND A PARTNER</View>
      <View className='profile-title'>找搭子</View>
      <View className='profile-desc'>从熟人邀请开始。这里不展示在线的人，邀请也还没接通。</View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-card-title'>双人入戏邀请</View>
          <View className='sheet-pair'>
            <View className='sheet-slot'>
              <View className='sheet-card-title'>我</View>
              <View className='sheet-card-copy'>待加入</View>
            </View>
            <View className='sheet-slot'>
              <View className='sheet-card-title'>搭子</View>
              <View className='sheet-card-copy'>待邀请</View>
            </View>
          </View>
          <View className='sheet-card-copy'>先聊玩法，再定分工。点下去也不会发出去。</View>
          <View className='btn btn-primary' onClick={() => Taro.showToast({ title: '邀请还没接通，不会发出去', icon: 'none' })}>邀请好友 →</View>
        </View>

        <View className='profile-label'>搭配方向</View>
        {rows.map((row) => (
          <View key={row.id} className='sheet-card'>
            <View className='sheet-card-title'>{row.title}</View>
            <View className='sheet-card-copy'>{row.body}</View>
          </View>
        ))}
        <View className='sheet-card-copy'>明确拒绝优先于这些方向。没有双方同意，不展示对方原题或雷达。</View>
      </View>

      <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}>队伍席位</View>
      <TabBar current='partners' />
    </View>
  )
}
