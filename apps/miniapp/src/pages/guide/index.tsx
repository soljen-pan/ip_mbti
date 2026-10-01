import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'

const steps = [
  {
    n: '01',
    title: '建立入戏档案',
    copy: '先答基础题。只有特定答案才会按规则出现补充题。补充题单独计数，不会写成超过基础题量的进度。单次最多 100 题。',
  },
  {
    n: '02',
    title: '看类型和坦奶',
    copy: '五字母、动能或缓行、坦奶、六星图分开看。信息不够就标待补答，不拿别的人格图来顶。',
  },
  {
    n: '03',
    title: '约队友和主题',
    copy: '先看类型方向。明确拒绝不会被推荐盖掉。商家没写明的标成待商家确认。演示主题不能预约，申请也不等于已支付。',
  },
]

export default function GuidePage() {
  return (
    <View className='page guide-page'>
      <PageHead title='玩法指南' />
      <View className='profile-kicker'>HOW IT WORKS</View>
      <View className='profile-title'>从测试到组队</View>
      <View className='profile-desc'>三步就够。类型、胆量和预约各看各的。</View>

      {steps.map((item) => (
        <View key={item.n} className='guide-step'>
          <View className='guide-num'>{item.n}</View>
          <View>
            <View className='guide-step-title'>{item.title}</View>
            <View className='guide-step-copy'>{item.copy}</View>
          </View>
        </View>
      ))}

      <View className='guide-remember'>
        <View className='profile-label'>作答时记住</View>
        <View className='guide-rule'>无法判断不是居中，是另一项选择。</View>
        <View className='guide-rule'>选中一项不会自动跳到下一题。</View>
      </View>

      <View className='btn btn-primary guide-go' onClick={() => Taro.reLaunch({ url: '/pages/home/index' })}>开始探索 →</View>
    </View>
  )
}
