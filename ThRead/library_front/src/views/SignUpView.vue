<template>
  <div class="container mt-5 p-5 bg-light text-dark rounded-3" style="max-width: 500px;">
    <h2 class="mb-4">회원가입</h2>
    <form @submit.prevent="handleSubmit">
      <AuthInput label="아이디" v-model="username" id="username" placeholder="아이디를 입력하세요" />
      <AuthInput label="비밀번호" type="password" v-model="password1" id="password1" placeholder="비밀번호를 입력하세요" />
      <AuthInput label="비밀번호 확인" type="password" v-model="password2" id="password2" placeholder="비밀번호를 다시 입력하세요" />
      <AuthInput label="이메일" type="email" v-model="email" id="email" placeholder="이메일을 입력하세요" />
      <AuthInput label="생일" type="date" v-model="birthDate" id="birthDate" />
      <AuthInput label="성별" v-model="gender" id="gender" />
      <AuthInput label="MBTI" v-model="mbti" id="mbti" />
      <button type="submit" class="btn btn-success">회원가입</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AuthInput from '@/components/auth/AuthInput.vue'

import { useAccountStore } from '@/stores/accounts.js'
import { useRouter } from 'vue-router'

const store = useAccountStore()
const router = useRouter()

const username = ref('')
const password1 = ref('')
const password2 = ref('')
const email = ref('')
const birthDate = ref('')
const gender = ref('')
const mbti = ref('')

const handleSubmit = () => {

  const getFieldName = (key) => {
    const fieldNames = {
      username: '아이디',
      password1: '비밀번호',
      password2: '비밀번호 확인',
      email: '이메일',
      birthDate: '생일',
    }
    return fieldNames[key] || key
  }

  const requiredFields = {
    username: username.value,
    password1: password1.value,
    password2: password2.value,
    email: email.value,
    birth_date: birthDate.value,
    gender: gender.value,
    mbti: mbti.value,
  }

  if (password1.value!==password2.value) {
    alert('비밀번호를 확인해 주세요.')
    return  
  }


  for (const [key, value] of Object.entries(requiredFields)) {
    if (!value) {
      alert(`${getFieldName(key)}를 입력해주세요!`)
      return
    }
  }

  const userInfo = {
    ...requiredFields,
    gender: gender.value,
    mbti: mbti.value,
  }


  console.log('회원가입 요청:', userInfo)
  store.signUp(userInfo)
  router.push({name: 'login'})
}

</script>


<style scoped>

</style>
