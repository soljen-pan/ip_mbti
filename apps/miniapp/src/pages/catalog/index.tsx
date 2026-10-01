import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'
import { archetypes, personalityTraits } from '../../data/catalog'

export default function CatalogPage() {
  return (
    <View className='page catalog-page'>
      <PageHead title='图鉴' />
      <View className='profile-kicker'>TYPE ATLAS</View>
      <View className='profile-title'>16 个人格</View>
      <View className='profile-desc'>类型参考，不是你的测试结果。</View>
      <View className='catalog-list'>
        {archetypes.map((item) => (
          <View key={item.code} className='catalog-card' onClick={() => Taro.navigateTo({ url: `/pages/catalog/detail?code=${item.code}` })}>
            <View className='catalog-card-top'>
              <View className='catalog-name'>{item.name}</View>
              <View className='catalog-code'>{item.code}</View>
            </View>
            <View className='catalog-tags'>
              {personalityTraits(item.code).map((trait) => (
                <View key={trait.label} className='catalog-tag'>{trait.label}</View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
