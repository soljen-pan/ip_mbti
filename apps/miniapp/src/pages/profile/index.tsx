import { Input, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import PageHead from '../../components/PageHead'
import { api, explainError, findAccountReport, saveSession } from '../../api'

const genders = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' },
]

export default function ProfilePage() {
  const [gender, setGender] = useState(() => {
    const saved = String(Taro.getStorageSync('ruxi-gender') || '')
    return saved === 'female' || saved === 'male' ? saved : ''
  })
  const [nickname, setNickname] = useState(String(Taro.getStorageSync('ruxi-nickname') || ''))
  const [avatar, setAvatar] = useState(String(Taro.getStorageSync('ruxi-avatar') || ''))
  const [avatarNote, setAvatarNote] = useState('')
  const [error, setError] = useState('')

  const genderReady = gender === 'female' || gender === 'male'

  async function pickAvatar() {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const path = res.tempFilePaths?.[0] || ''
      if (!path) {
        setAvatarNote('没有拿到图片。')
        return
      }
      setAvatar(path)
      Taro.setStorageSync('ruxi-avatar', path)
      setAvatarNote('这是临时图片，还没交给服务器，也不能当成分享图或人格角色。')
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      setAvatarNote(message.includes('cancel') ? '已取消选择。仍使用默认头像。' : '图片没有选上。仍使用默认头像。')
    }
  }

  async function start(skipName = false) {
    setError('')
    if (!genderReady) {
      setError('性别是必选项，请先选女或男。')
      return
    }
    const name = skipName ? '' : nickname.trim()
    if (!skipName && name && name.length > 12) {
      setError('昵称最多 12 个字。')
      return
    }
    try {
      const existing = await findAccountReport()
      if (existing) {
        setError('这个账号已经有测试结果，不能再改。')
        Taro.redirectTo({ url: `/pages/result/index?id=${existing}` })
        return
      }
      Taro.setStorageSync('ruxi-gender', gender)
      if (!skipName) Taro.setStorageSync('ruxi-nickname', name)
      const created = await api.create({
        gender,
        age_band: '',
        nickname: name || undefined,
        scare_experience: 'unknown',
      }, `start-${Date.now()}`)
      saveSession(created.id)
      Taro.redirectTo({ url: `/pages/quiz/index?id=${created.id}` })
    } catch (err) {
      setError(explainError(err, '暂时开不了答卷'))
    }
  }

  return (
    <View className='page profile-page'>
      <PageHead title='资料' />
      <View className='profile-kicker'>完善资料</View>
      <View className='profile-title'>先记下基本信息</View>
      <View className='profile-desc'>头像和昵称可空。性别必选，但不参与评分。</View>

      <View className='profile-card account' onClick={pickAvatar}>
        <View className='avatar avatar-btn'>
          {avatar ? '图' : '入'}
          <View className='cam-badge'>＋</View>
        </View>
        <View className='profile-card-copy'>
          <View className='profile-card-title'>选择头像</View>
          <View className='profile-card-note'>可跳过。不是微信头像，也不覆盖人格立绘。</View>
        </View>
      </View>
      {avatarNote ? <View className='profile-hint'>{avatarNote}</View> : null}

      <View className='profile-section'>
        <View className='profile-label'>
          性别 <Text className='profile-required'>必选</Text>
        </View>
        <View className='profile-gender-row'>
          {genders.map((item) => (
            <View
              key={item.value}
              className={gender === item.value ? 'profile-gender profile-gender-on' : 'profile-gender'}
              onClick={() => {
                setGender(item.value)
                if (error) setError('')
              }}
            >
              {item.label}
            </View>
          ))}
        </View>
      </View>

      <View className='profile-section'>
        <View className='profile-label'>昵称 <Text className='profile-optional'>选填 · 1–12 字</Text></View>
        <Input
          className='profile-field'
          value={nickname}
          maxlength={12}
          placeholder='可以不填'
          onInput={(e) => setNickname(e.detail.value)}
        />
      </View>

      {error ? <View className='error'>{error}</View> : null}

      <View className='profile-actions'>
        <View
          className={genderReady ? 'btn btn-ghost' : 'btn btn-disabled'}
          onClick={() => genderReady && start(true)}
        >
          跳过昵称
        </View>
        <View
          className={genderReady ? 'btn btn-primary' : 'btn btn-disabled'}
          onClick={() => genderReady && start(false)}
        >
          开始测试 →
        </View>
      </View>
    </View>
  )
}
