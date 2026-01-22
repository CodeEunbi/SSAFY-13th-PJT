<template>
  <div class="container mt-5 p-5 bg-light text-dark rounded-3" style="max-width: 500px;">
    <h2 class="mb-4">로그인</h2>
    <form @submit.prevent="handleSubmit">
      <AuthInput label="아이디" v-model="username" id="username" placeholder="아이디를 입력하세요" />
      <AuthInput label="비밀번호" type="password" v-model="password" id="password" placeholder="비밀번호를 입력하세요" />
      <div class="d-flex justify-content-between">  
        <button type="submit" class="btn btn-success">로그인</button>
        <RouterLink :to="{ name: 'signup' }" class="btn btn-outline-success">회원가입</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AuthInput from '@/components/auth/AuthInput.vue'

import { useAccountStore } from '@/stores/accounts'
import { useRouter } from 'vue-router'

const store = useAccountStore()
const router = useRouter()

const username = ref('')
const password = ref('')

const handleSubmit = async() => {
  console.log('로그인 요청:', {
    username: username.value,
    password: password.value
  })

  const userInfo = {
    username: username.value,
    password: password.value
  }

  const success = await store.logIn(userInfo)
  if (success){
    router.push({ name: 'landing-view' })
  }
  else{
    alert('아이디 또는 비밀번호를 확인해 주세요')
  }
}

</script>
