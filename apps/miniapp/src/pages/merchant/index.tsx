import { View } from '@tarojs/components'
import { useState } from 'react'
import PageHead from '../../components/PageHead'

const rows = [
  { name: '待确认预约', value: '尚无数据' },
  { name: '玩家咨询', value: '尚无数据' },
  { name: '需要完善的主题信息', value: '尚无数据' },
]

const desks = [
  { id: 'script', label: '主题版本' },
  { id: 'slot', label: '场次' },
  { id: 'check', label: '待确认' },
  { id: 'book', label: '预约' },
]

export default function MerchantPage() {
  const [desk, setDesk] = useState('script')
  const current = desks.find((item) => item.id === desk)
  return (
    <View className='page page-merchant'>
      <PageHead title='商家工作台' extra='返回玩家端' />
      <View className='profile-kicker'>MERCHANT</View>
      <View className='profile-title'>只看待核实的事</View>
      <View className='profile-desc'>没有实际商家数据。不展示营业中、预约量、场次完成数和收入。</View>

      <View className='archive-tabs'>
        {desks.map((item) => (
          <View key={item.id} className={desk === item.id ? 'archive-tab archive-tab-on' : 'archive-tab'} onClick={() => setDesk(item.id)}>
            {item.label}
          </View>
        ))}
      </View>

      <View className='profile-section'>
        <View className='profile-label'>待处理 · {current?.label}</View>
        <View className='sheet-menu'>
          {rows.map((row) => (
            <View key={row.name} className='sheet-menu-item'>
              <View className='sheet-card-title'>{row.name}</View>
              <View className='catalog-tag'>{row.value}</View>
            </View>
          ))}
        </View>
      </View>

      <View className='sheet-stack'>
        <View className='sheet-card'>
          <View className='sheet-card-title'>经营概览</View>
          <View className='sheet-card-copy'>尚无数据。识别结果仍是草稿，员工也看不到玩家原始问卷。这四项是商家自己的工作台，不是玩家的测一测。</View>
        </View>
      </View>
    </View>
  )
}
