import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PageHead from '../../components/PageHead'

const steps = [
  { name: '申请提交', note: '还没有申请' },
  { name: '商家审核', note: '未开始' },
  { name: '留位报价', note: '未开始。报价不是成交' },
  { name: '玩家确认', note: '要本人确认，别人不能代点' },
  { name: '预约确认', note: '未开始' },
]

export default function ProgressPage() {
  return (
    <View className='page'>
      <PageHead title='申请进度' />
      <View className='profile-kicker'>REQUEST</View>
      <View className='profile-title'>还没有申请</View>
      <View className='profile-desc'>当前阶段是未申请。没有日期、门店和金额。</View>

      {steps.map((step, index) => (
        <View key={step.name} className='guide-step'>
          <View className={index === 0 ? 'guide-num' : 'guide-num guide-num-idle'}>{String(index + 1).padStart(2, '0')}</View>
          <View>
            <View className='guide-step-title'>{step.name}</View>
            <View className='guide-step-copy'>{step.note}</View>
          </View>
        </View>
      ))}

      <View className='sheet-menu'>
        <View className='sheet-menu-item'>
          <View className='sheet-card-title'>付款状态</View>
          <View className='catalog-tag'>未接入</View>
        </View>
      </View>
      <View className='sheet-card-copy'>付款和预约确认不是同一步。没有已支付。</View>
      <View className='btn btn-ghost' onClick={() => Taro.navigateTo({ url: '/pages/team/index' })}>返回队伍</View>
    </View>
  )
}
