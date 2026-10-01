import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import PageHead from '../../components/PageHead'

const checks = [
  { name: '主题配置', value: '待商家确认' },
  { name: '人数', value: '待商家确认' },
  { name: '价格', value: '待商家确认' },
  { name: '特殊支持', value: '待商家确认' },
]

export default function BookingPage() {
  const [agreed, setAgreed] = useState(false)
  return (
    <View className='page'>
      <PageHead title='预约申请' />
      <View className='profile-kicker'>BOOKING</View>
      <View className='profile-title'>还不能提交申请</View>
      <View className='profile-desc'>当前是设计演示，不是真实商家。提交申请也不会发出去。</View>

      <View className='sheet-stack'>
        <View className='sheet-card sheet-card-wait'>
          <View className='sheet-card-title'>演示示意</View>
          <View className='sheet-card-copy'>暂不支持真正预约。申请、审核、报价、本人确认、预约确认、付款是分开的状态。</View>
        </View>
      </View>

      <View className='sheet-menu'>
        {checks.map((item) => (
          <View key={item.name} className='sheet-menu-item'>
            <View className='sheet-card-title'>{item.name}</View>
            <View className='catalog-tag'>{item.value}</View>
          </View>
        ))}
      </View>

      <View className='sheet-card sheet-check' onClick={() => setAgreed(!agreed)}>
        <View className={agreed ? 'mark mark-on' : 'mark'} />
        <View className='sheet-card-copy'>我已阅读预约须知。默认不勾选。勾选也不会把演示数据发出去。</View>
      </View>

      <View className='sheet-card-copy'>这里没有已支付，也没有成交。</View>
      <View className='btn btn-primary btn-disabled'>演示数据不能申请</View>
      <View className='link' onClick={() => Taro.navigateTo({ url: '/pages/progress/index' })}>查看申请进度</View>
    </View>
  )
}
