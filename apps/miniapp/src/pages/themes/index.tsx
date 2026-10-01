import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TabBar from '../../components/TabBar'

export default function ThemesPage() {
  return (
    <View className='page page-tab'>
      <View className='profile-kicker'>THEME LIST</View>
      <View className='profile-title'>找主题</View>
      <View className='profile-desc'>下面只有一条演示剧目。没有商家海报、评分、城市和可订场次。</View>

      <View className='sheet-stack'>
        <View className='sheet-card' onClick={() => Taro.navigateTo({ url: '/pages/theme/detail' })}>
          <View className='sheet-tags'>
            <View className='catalog-tag'>演示</View>
            <View className='catalog-tag'>不可预约</View>
          </View>
          <View className='sheet-card-title'>回声车站</View>
          <View className='sheet-card-copy'>题材、人数待商家确认。海报待商家提供。</View>
        </View>
        <View className='sheet-card'>
          <View className='sheet-card-title'>尚无第二则主题</View>
          <View className='sheet-card-copy'>不复制效果图里的虚构海报和评分。</View>
        </View>
      </View>

      <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}>先建立队伍</View>
      <TabBar current='themes' />
    </View>
  )
}
