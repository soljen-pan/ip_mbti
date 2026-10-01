import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'

const matrix = [
  { name: '贴脸演绎', state: '待商家确认' },
  { name: '追逐跑动', state: '待商家确认' },
  { name: '黑暗场景', state: '待商家确认' },
  { name: '单人环节', state: '待商家确认' },
]

export default function ThemeDetail() {
  return (
    <View className='page'>
      <PageHead title='主题详情' />
      <View className='profile-kicker'>DEMO THEME</View>
      <View className='profile-title'>回声车站</View>
      <View className='profile-desc'>演示剧目，没有评分、门店和场次。</View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-tags'><View className='catalog-tag'>演示剧目</View></View>
          <View className='sheet-card-copy'>无剧透摘要待商家确认。在商家写出公开文案之前，这里不编故事。</View>
        </View>

        <View className='profile-label'>主题强度</View>
        <View className='sheet-menu'>
          {matrix.map((item) => (
            <View key={item.name} className='sheet-menu-item'>
              <View className='sheet-card-title'>{item.name}</View>
              <View className='catalog-tag'>{item.state}</View>
            </View>
          ))}
        </View>
        <View className='sheet-card-copy'>必做、可选、未知是三种不同状态。这条演示剧目四项都是未知，不升成必做或可选。</View>

        <View className='sheet-card sheet-card-stop'>
          <View className='sheet-card-title'>演示主题 · 暂不可预约</View>
          <View className='sheet-card-copy'>没有真实场次和商家确认。了解内容不等于可以提交申请。</View>
        </View>
      </View>

      <View className='btn btn-ghost btn-disabled'>不可预约</View>
      <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/fit/index' })}>查看适配规则</View>
    </View>
  )
}
