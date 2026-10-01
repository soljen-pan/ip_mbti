import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'

const rows = [
  { tone: 'wait', title: '未知待确认', body: '贴脸、追逐、突发声音、黑暗、单人环节都还没有商家核实。缺项不写成安全或没有。' },
  { tone: 'stop', title: '明确冲突', body: '一旦有人明确拒绝，这条不会被高相似度盖掉。现在还没有真实队伍，所以没有可计数的冲突。' },
  { tone: 'ok', title: '已满足', body: '没有已确认的人数、主题和场次，不能列出已满足项。' },
]

export default function FitPage() {
  return (
    <View className='page'>
      <PageHead title='组队适配' />
      <View className='profile-kicker'>FIT CHECK</View>
      <View className='profile-title'>和主题还对不齐</View>
      <View className='profile-desc'>这一页不显示问卷进度。适配看的是边界、未知和明确拒绝，不是第几题。</View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-tags'><View className='catalog-tag'>演示剧目</View></View>
          <View className='sheet-card-title'>回声车站</View>
          <View className='sheet-card-copy'>没有真实海报、门店和场次。适配结果不能当成可预约。</View>
        </View>
        {rows.map((row) => (
          <View key={row.title} className={row.tone === 'stop' ? 'sheet-card sheet-card-stop' : row.tone === 'wait' ? 'sheet-card sheet-card-wait' : 'sheet-card'}>
            <View className='sheet-card-title'>{row.title}</View>
            <View className='sheet-card-copy'>{row.body}</View>
          </View>
        ))}
      </View>

      <View className='btn btn-primary' onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}>调整方案 →</View>
    </View>
  )
}
