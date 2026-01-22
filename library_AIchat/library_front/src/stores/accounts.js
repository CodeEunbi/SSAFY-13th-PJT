import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAccountStore = defineStore('account', () => {
  const ACCOUNT_API_URL = 'http://127.0.0.1:8000/accounts'

  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLogin = computed(() => {
    return token.value ? true : false
  })

  const fetchUser = function () {
    if (!token.value) {
      console.warn('토큰이 없습니다. 사용자 정보를 불러올 수 없습니다.')
      return
    }

    axios.get(`${ACCOUNT_API_URL}/profile/`, {
      headers: {
        Authorization: `Token ${token.value}`
      }
    })
      .then(res => {
        user.value = res.data
      })
      .catch(err => {
        console.error('유저 정보 불러오기 실패:', err)
      })
  }

  const signUp = function ({username, password1, password2, email, birth_date, gender, mbti}) {

    if (!birth_date) {
      alert('생일을 입력해주세요 (YYYY-MM-DD 형식)')
      return
    }
        
    axios({
      method: 'POST',
      url: `${ACCOUNT_API_URL}/signup/`,
      data: {
        username, password1, password2, email, birth_date, gender, mbti
      }
    })
    .then(() => {
      console.log('회원가입 성공')
    })
    .catch(err => {
      console.log(err.response.data)
    })
}


  const logIn = async function ({ username, password }) {
  return axios({
    method: 'POST',
    url: `${ACCOUNT_API_URL}/login/`,
    data: { username, password }
  })
    .then(res => {
      token.value = res.data.key
      localStorage.setItem('token', res.data.key)

      return axios({
        method: 'GET',
        url: `${ACCOUNT_API_URL}/profile/`,
        headers: {
          Authorization: `Token ${res.data.key}`
        }
      })
    })
    .then(res => {
      user.value = res.data
      return true
    })
    .catch(err => {
      console.log('로그인 실패:', err.response?.data || err)
      return false
    })
}


  return {
    token, isLogin, user,
    fetchUser, signUp, logIn
  }
}, { persist: {
    paths: ['token', 'user'], 
  } })
