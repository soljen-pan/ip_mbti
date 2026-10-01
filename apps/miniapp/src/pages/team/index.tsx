import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'

const tasks = [
  { name: '选主题', state: '待分配' },
  { name: '定时间', state: '待分配' },
  { name: '联系商家', state: '待分配' },
  { name: '准备物品', state: '待分配' },
]

const stats = [
  { num: '0', label: '已确认' },
  { num: '0', label: '待商量' },
  { num: '0', label: '不接受' },
]

export default function TeamPage() {
  return (
    <View className='page'>
      <PageHead title='我的队伍' />
      <View className='profile-kicker'>TEAM</View>
      <View className='profile-title'>还没有可商量的队伍</View>
      <View className='profile-desc'>席位、任务和确认都空着。这里不编造队员，也不能代替别人点确认。</View>

      <View className='sheet-pair'>
        <View className='sheet-slot'>
          <View className='sheet-card-title'>你</View>
          <View className='sheet-card-copy'>待加入</View>
        </View>
        <View className='sheet-slot'>
          <View className='sheet-card-title'>空位</View>
          <View className='sheet-card-copy'>待邀请</View>
        </View>
      </View>

      <View className='sheet-kvs'>
        {stats.map((item) => (
          <View key={item.label} className='sheet-kv'>
            <View className='sheet-kv-num'>{item.num}</View>
            <View className='sheet-card-copy'>{item.label}</View>
          </View>
        ))}
      </View>

      <View className='profile-section'>
        <View className='profile-label'>任务分工</View>
        <View className='sheet-menu'>
          {tasks.map((task) => (
            <View key={task.name} className='sheet-menu-item'>
              <View className='sheet-card-title'>{task.name}</View>
              <View className='catalog-tag'>{task.state}</View>
            </View>
          ))}
        </View>
      </View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-card-title'>小队动态</View>
          <View className='sheet-card-copy'>还没有人加入或离开。成员变动后，之前的适配作废。明确拒绝不能被投票盖过去。坦不自动带队，奶也不被派去单人任务。</View>
        </View>
      </View>

      <View className='btn btn-primary' onClick={() => Taro.redirectTo({ url: '/pages/themes/index' })}>选择主题</View>
      <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/fit/index' })}>查看适配</View>
    </View>
  )
}
