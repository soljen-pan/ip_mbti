import { Image, View } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import PageHead from '../../components/PageHead'
import { findArchetype, personalityTraits } from '../../data/catalog'
import { avatarLabel, catalogAvatars } from '../../data/avatars'

export default function CatalogDetail() {
  const code = useRouter().params.code || ''
  const item = findArchetype(code)
  if (!item) {
    return (
      <View className='page catalog-page'>
        <PageHead title='图鉴详情' />
        <View className='profile-desc'>这个代码不在图鉴里。</View>
      </View>
    )
  }
  const traits = personalityTraits(item.code)
  const portraits = catalogAvatars(item.code)
  return (
    <View className='page catalog-page'>
      <PageHead title='图鉴详情' />
      <View className='profile-kicker'>PERSONALITY</View>
      <View className='profile-title'>{item.name}</View>
      <View className='profile-desc'>{item.code}。示例类型，不是你的测试结果。</View>
      <View className='persona-grid'>
        {portraits.map((portrait) => (
          <View key={portrait.file} className='persona-card'>
            <Image className='persona-card-art' src={portrait.src} mode='aspectFit' />
            <View className='persona-card-label'>{avatarLabel[`${portrait.gender}-${portrait.courage}`]}</View>
          </View>
        ))}
      </View>
      <View className='profile-desc'>男、女和坦、奶各一张。动能型和缓行型共用这一套形象。</View>
      <View className='catalog-traits'>
        {traits.map((trait) => (
          <View key={trait.label} className='catalog-trait'>
            <View className='catalog-tag'>{trait.label}</View>
            <View className='catalog-trait-copy'>{trait.copy}</View>
          </View>
        ))}
      </View>
    </View>
  )
}
